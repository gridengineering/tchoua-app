import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { computeDividendPreview } from "@/lib/association/dividends";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

function canManage(session: any, membership: any): boolean {
  if (!membership) return false;
  if (["FOUNDER", "PRESIDENT", "TREASURER"].includes(membership.role)) return true;
  return hasPermission(session, membership, "VIEW_FINANCES") && hasPermission(session, membership, "MANAGE_ACTIVITIES");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const membership = await getMembership(session.user.id, associationId);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const preview = await computeDividendPreview(associationId, year);
  const run = await prisma.associationDividendRun.findUnique({
    where: { associationId_year: { associationId, year } },
    include: {
      shares: {
        include: { membership: { include: { user: { select: { name: true } } } } },
        orderBy: { interestShare: "desc" },
      },
    },
  });

  const manager = canManage(session, membership);
  const visibleShares = run
    ? manager
      ? run.shares
      : run.shares.filter((s) => s.membershipId === membership.id)
    : [];

  return NextResponse.json({
    year,
    preview,
    canManage: manager,
    run: run
      ? {
          id: run.id,
          year: run.year,
          totalInterest: run.totalInterest,
          totalCapital: run.totalCapital,
          status: run.status,
          postedAt: run.postedAt,
          createdAt: run.createdAt,
          shares: visibleShares.map((s) => ({
            id: s.id,
            membershipId: s.membershipId,
            memberName: s.membership.user.name,
            capital: s.capital,
            interestShare: s.interestShare,
            eligible: s.eligible,
            credited: s.credited,
            creditedAt: s.creditedAt,
          })),
        }
      : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const membership = await getMembership(session.user.id, associationId);
  if (!canManage(session, membership)) {
    return NextResponse.json({ error: "Réservé au bureau / trésorier" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "").toUpperCase();
  const year = Number(body.year) || new Date().getFullYear();

  if (action === "COMPUTE") {
    const existing = await prisma.associationDividendRun.findUnique({
      where: { associationId_year: { associationId, year } },
    });
    if (existing?.status === "POSTED") {
      return NextResponse.json({ error: `Exercice ${year} déjà crédité` }, { status: 409 });
    }

    const preview = await computeDividendPreview(associationId, year);

    const run = await prisma.$transaction(async (tx) => {
      const saved = await tx.associationDividendRun.upsert({
        where: { associationId_year: { associationId, year } },
        create: {
          associationId,
          year,
          totalInterest: preview.totalInterest,
          totalCapital: preview.totalCapital,
          status: "DRAFT",
          createdById: session.user.id,
        },
        update: {
          totalInterest: preview.totalInterest,
          totalCapital: preview.totalCapital,
          status: "DRAFT",
        },
      });
      await tx.associationDividendShare.deleteMany({ where: { runId: saved.id } });
      if (preview.shares.length) {
        await tx.associationDividendShare.createMany({
          data: preview.shares.map((s) => ({
            runId: saved.id,
            membershipId: s.membershipId,
            capital: s.capital,
            interestShare: s.interestShare,
            eligible: s.eligible,
          })),
        });
      }
      await tx.associationAuditLog
        .create({
          data: {
            associationId,
            userId: session.user.id,
            action: "DIVIDENDS_COMPUTE",
            entity: "ASSOCIATION",
            entityId: associationId,
            details: `Répartition ${year} calculée : ${preview.totalInterest} FCFA d'intérêts sur ${preview.totalCapital} FCFA de capital (${preview.shares.length} membres)`,
          },
        })
        .catch(() => {});
      return saved;
    });

    return NextResponse.json({ ok: true, run });
  }

  if (action === "POST") {
    const run = await prisma.associationDividendRun.findUnique({
      where: { associationId_year: { associationId, year } },
      include: { shares: { include: { membership: { select: { id: true, userId: true } } } } },
    });
    if (!run) return NextResponse.json({ error: "Aucune répartition calculée" }, { status: 404 });
    if (run.status === "POSTED") {
      return NextResponse.json({ error: "Répartition déjà créditée" }, { status: 409 });
    }

    const toCredit = run.shares.filter((s) => !s.credited && s.interestShare > 0);

    const result = await prisma.$transaction(async (tx) => {
      let credited = 0;
      let totalCredited = 0;
      for (const share of toCredit) {
        const wallet = await tx.wallet.upsert({
          where: { userId: share.membership.userId },
          create: { userId: share.membership.userId, balance: 0 },
          update: {},
        });
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: share.interestShare } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: share.interestShare,
            netAmount: share.interestShare,
            feeAmount: 0,
            type: "RECEIPT",
            status: "COMPLETED",
            description: `Quote-part de dividendes ${year}`,
            associationId,
          },
        });
        await tx.associationDividendShare.update({
          where: { id: share.id },
          data: { credited: true, creditedAt: new Date() },
        });
        credited += 1;
        totalCredited += share.interestShare;
      }
      await tx.associationDividendRun.update({
        where: { id: run.id },
        data: { status: "POSTED", postedAt: new Date() },
      });
      await tx.associationAuditLog
        .create({
          data: {
            associationId,
            userId: session.user.id,
            action: "DIVIDENDS_POST",
            entity: "ASSOCIATION",
            entityId: associationId,
            details: `Dividendes ${year} crédités : ${totalCredited} FCFA sur ${credited} portefeuilles`,
          },
        })
        .catch(() => {});
      return { credited, totalCredited };
    });

    return NextResponse.json({ ok: true, ...result });
  }

  if (action === "DELETE") {
    const run = await prisma.associationDividendRun.findUnique({
      where: { associationId_year: { associationId, year } },
    });
    if (!run) return NextResponse.json({ error: "Aucune répartition" }, { status: 404 });
    if (run.status === "POSTED") {
      return NextResponse.json({ error: "Impossible de supprimer un exercice crédité" }, { status: 409 });
    }
    await prisma.associationDividendRun.delete({ where: { id: run.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
