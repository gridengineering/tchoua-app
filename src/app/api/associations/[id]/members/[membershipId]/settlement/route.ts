import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";
import { computeMemberSettlement } from "@/lib/association/settlement";

const BUREAU_ROLES = [
  "FOUNDER",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId, membershipId } = await params;
  const actor = await getMembership(session.user.id, associationId);
  if (!actor) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const isSelf = actor.id === membershipId;
  if (!isSelf && !BUREAU_ROLES.includes(actor.role) && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const preview = await computeMemberSettlement(associationId, membershipId);
  const history = await prisma.memberSettlement.findMany({
    where: { associationId, membershipId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    preview,
    canManage: BUREAU_ROLES.includes(actor.role) || isSuperAdmin(session),
    history: history.map((h) => ({
      id: h.id,
      type: h.type,
      year: h.year,
      assets: h.assets,
      totalDebts: h.totalDebts,
      net: h.net,
      status: h.status,
      createdAt: h.createdAt,
      appliedAt: h.appliedAt,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId, membershipId } = await params;
  const actor = await getMembership(session.user.id, associationId);
  if (!actor || (!BUREAU_ROLES.includes(actor.role) && !isSuperAdmin(session))) {
    return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "").toUpperCase();
  const type = String(body.type ?? "DEPARTURE").toUpperCase();
  const year = body.year ? Number(body.year) : null;

  if (!["DEPARTURE", "YEAR_END", "DEATH"].includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const target = await prisma.associationMembership.findFirst({
    where: { id: membershipId, associationId },
    include: { user: { select: { name: true } } },
  });
  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  if (action === "SAVE") {
    const preview = await computeMemberSettlement(associationId, membershipId);
    const settlement = await prisma.memberSettlement.create({
      data: {
        associationId,
        membershipId,
        type,
        year,
        assets: preview.assets,
        debtFines: preview.debtFines,
        debtSanctions: preview.debtSanctions,
        debtLoans: preview.debtLoans,
        debtCollation: preview.debtCollation,
        totalDebts: preview.totalDebts,
        net: preview.net,
        details: JSON.stringify({
          savings: preview.savings,
          fines: preview.fines,
          sanctions: preview.sanctions,
          loans: preview.loans,
          collations: preview.collations,
        }),
        status: "DRAFT",
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ ok: true, settlement });
  }

  if (action === "APPLY") {
    if (type === "DEATH") {
      return NextResponse.json(
        { error: "Pour un décès, utilisez l'action « Décès » qui déclenche la liquidation 75/25 et les aides." },
        { status: 400 }
      );
    }

    const preview = await computeMemberSettlement(associationId, membershipId);
    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.memberSettlement.create({
        data: {
          associationId,
          membershipId,
          type,
          year,
          assets: preview.assets,
          debtFines: preview.debtFines,
          debtSanctions: preview.debtSanctions,
          debtLoans: preview.debtLoans,
          debtCollation: preview.debtCollation,
          totalDebts: preview.totalDebts,
          net: preview.net,
          details: JSON.stringify({
            savings: preview.savings,
            fines: preview.fines,
            sanctions: preview.sanctions,
            loans: preview.loans,
            collations: preview.collations,
            recoveryRequired: preview.net < 0,
          }),
          status: "APPLIED",
          createdById: session.user.id,
          appliedAt: new Date(),
        },
      });

      if (type === "DEPARTURE") {
        await tx.associationMembership.update({
          where: { id: membershipId },
          data: {
            status: "RESIGNED",
            leftAt: new Date(),
            resignedAt: new Date(),
            notes: `Sortie avec solde ${preview.net} FCFA (compensation dettes/avoirs)`,
          },
        });
      }

      await tx.associationAuditLog
        .create({
          data: {
            associationId,
            userId: session.user.id,
            action: type === "DEPARTURE" ? "MEMBER_SETTLEMENT_DEPARTURE" : "MEMBER_SETTLEMENT_YEAR_END",
            entity: "MEMBERSHIP",
            entityId: membershipId,
            details: `Solde ${type} — avoirs ${preview.assets}, dettes ${preview.totalDebts}, net ${preview.net} (${preview.net < 0 ? "recouvrement requis" : "à verser au membre"})`,
          },
        })
        .catch(() => {});

      return created;
    });

    return NextResponse.json({
      ok: true,
      settlement,
      recoveryRequired: preview.net < 0,
      amountToPay: preview.net > 0 ? preview.net : 0,
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
