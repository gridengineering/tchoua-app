import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { computeSolidarityPreview } from "@/lib/association/solidarity";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

const APPLY_ROLES = ["FOUNDER", "PRESIDENT", "TREASURER", "VICE_PRESIDENT"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const membership = await getMembership(session.user.id, associationId);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const preview = await computeSolidarityPreview(associationId, year);
  const run = await prisma.associationSolidarityRun.findUnique({
    where: { associationId_year: { associationId, year } },
  });

  const canManage =
    APPLY_ROLES.includes(membership.role) ||
    (hasPermission(session, membership, "VIEW_FINANCES") &&
      hasPermission(session, membership, "MANAGE_ACTIVITIES"));

  return NextResponse.json({
    year,
    preview,
    canManage,
    run: run
      ? {
          id: run.id,
          year: run.year,
          totalIn: run.totalIn,
          totalOut: run.totalOut,
          balance: run.balance,
          deficit: run.deficit,
          membersCount: run.membersCount,
          perMember: run.perMember,
          status: run.status,
          appliedAt: run.appliedAt,
        }
      : null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const membership = await getMembership(session.user.id, associationId);
  const allowed =
    membership &&
    (APPLY_ROLES.includes(membership.role) ||
      (hasPermission(session, membership, "VIEW_FINANCES") &&
        hasPermission(session, membership, "MANAGE_ACTIVITIES")));
  if (!allowed) return NextResponse.json({ error: "Réservé au bureau / trésorier" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "").toUpperCase();
  const year = Number(body.year) || new Date().getFullYear();

  if (action === "COMPUTE") {
    const preview = await computeSolidarityPreview(associationId, year);
    if (!preview.activities.length) {
      return NextResponse.json(
        { error: "Aucune activité de solidarité (AIDE_SOLIDAIRE) dans cette association" },
        { status: 400 }
      );
    }
    const existing = await prisma.associationSolidarityRun.findUnique({
      where: { associationId_year: { associationId, year } },
    });
    if (existing?.status === "APPLIED") {
      return NextResponse.json({ error: `Exercice ${year} déjà appliqué` }, { status: 409 });
    }

    const run = await prisma.$transaction(async (tx) => {
      const saved = await tx.associationSolidarityRun.upsert({
        where: { associationId_year: { associationId, year } },
        create: {
          associationId,
          year,
          totalIn: preview.totalIn,
          totalOut: preview.totalOut,
          balance: preview.balance,
          deficit: preview.deficit,
          membersCount: preview.membersCount,
          perMember: preview.perMember,
          status: "DRAFT",
          createdById: session.user.id,
        },
        update: {
          totalIn: preview.totalIn,
          totalOut: preview.totalOut,
          balance: preview.balance,
          deficit: preview.deficit,
          membersCount: preview.membersCount,
          perMember: preview.perMember,
          status: "DRAFT",
        },
      });
      await tx.associationAuditLog
        .create({
          data: {
            associationId,
            userId: session.user.id,
            action: "SOLIDARITY_RECONSTITUTION_COMPUTE",
            entity: "ASSOCIATION",
            entityId: associationId,
            details: `Reconstitution solidarité ${year} : entrées ${preview.totalIn}, sorties ${preview.totalOut}, déficit ${preview.deficit}, ${preview.perMember}/membre`,
          },
        })
        .catch(() => {});
      return saved;
    });

    return NextResponse.json({ ok: true, run });
  }

  if (action === "APPLY") {
    const run = await prisma.associationSolidarityRun.findUnique({
      where: { associationId_year: { associationId, year } },
    });
    if (!run) return NextResponse.json({ error: "Aucun bilan calculé pour cet exercice" }, { status: 404 });
    if (run.status === "APPLIED") {
      return NextResponse.json({ error: "Bilan déjà appliqué" }, { status: 409 });
    }
    if (run.perMember <= 0 || run.deficit <= 0) {
      return NextResponse.json({ error: "Aucun déficit à répartir" }, { status: 400 });
    }

    const activity = await prisma.associationActivity.findFirst({
      where: { associationId, type: { in: ["AIDE_SOLIDAIRE", "SOLIDARITY"] } },
      orderBy: { sortOrder: "asc" },
    });
    if (!activity) {
      return NextResponse.json({ error: "Activité de solidarité introuvable" }, { status: 400 });
    }

    const members = await prisma.associationMembership.findMany({
      where: { associationId, status: "ACTIVE" },
      select: { id: true },
    });

    const dueAt = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    const result = await prisma.$transaction(async (tx) => {
      await tx.activityContribution.createMany({
        data: members.map((m) => ({
          activityId: activity.id,
          membershipId: m.id,
          amount: run.perMember,
          unit: "CASH",
          status: "PENDING",
          dueAt,
          notes: `Reconstitution annuelle du fonds de solidarité ${year}`,
        })),
      });
      await tx.associationSolidarityRun.update({
        where: { id: run.id },
        data: { status: "APPLIED", appliedAt: new Date() },
      });
      await tx.associationAuditLog
        .create({
          data: {
            associationId,
            userId: session.user.id,
            action: "SOLIDARITY_RECONSTITUTION_APPLY",
            entity: "ASSOCIATION",
            entityId: associationId,
            details: `Reconstitution ${year} appliquée : ${run.perMember} FCFA × ${members.length} membres (déficit ${run.deficit})`,
          },
        })
        .catch(() => {});
      return { members: members.length };
    });

    return NextResponse.json({ ok: true, ...result, perMember: run.perMember, activityId: activity.id });
  }

  if (action === "DELETE") {
    const run = await prisma.associationSolidarityRun.findUnique({
      where: { associationId_year: { associationId, year } },
    });
    if (!run) return NextResponse.json({ error: "Aucun bilan" }, { status: 404 });
    if (run.status === "APPLIED") {
      return NextResponse.json({ error: "Impossible de supprimer un bilan appliqué" }, { status: 409 });
    }
    await prisma.associationSolidarityRun.delete({ where: { id: run.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
