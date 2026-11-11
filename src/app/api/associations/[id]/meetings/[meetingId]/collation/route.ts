import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

const BUREAU_ROLES = [
  "PRESIDENT",
  "FOUNDER",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
  "CENSOR",
  "SOLIDARITY_OFFICER",
];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

function configNumbers(meetingConfig: string | null | undefined): { rate: number; hostPayout: number } {
  if (!meetingConfig) return { rate: 0, hostPayout: 0 };
  try {
    const cfg = JSON.parse(meetingConfig);
    const rate = Number(cfg?.collationRate);
    const payout = Number(cfg?.collationHostPayout);
    return {
      rate: Number.isFinite(rate) && rate > 0 ? rate : 0,
      hostPayout: Number.isFinite(payout) && payout > 0 ? payout : 0,
    };
  } catch {
    return { rate: 0, hostPayout: 0 };
  }
}

/**
 * GET /api/associations/[id]/meetings/[meetingId]/collation
 * Synthèse de la collation : attendu, collecté, arriérés de l'hôte, net à reverser.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId, meetingId } = await params;
  const membership = await getMembership(session.user.id, associationId);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const meeting = await prisma.assocMeeting.findFirst({
    where: { id: meetingId, associationId },
    include: {
      collations: {
        include: { membership: { include: { user: { select: { id: true, name: true } } } } },
        orderBy: { membership: { memberNumber: "asc" } },
      },
      fines: true,
    },
  });
  if (!meeting) return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });

  const assoc = await prisma.association.findUnique({
    where: { id: associationId },
    select: { meetingConfig: true },
  });

  const activeCount = await prisma.associationMembership.count({
    where: { associationId, status: "ACTIVE" },
  });

  const cfg = configNumbers(assoc?.meetingConfig);
  const configuredRate = cfg.rate;
  const rate = meeting.collationRate ?? configuredRate;
  const expected = meeting.collations.reduce((sum, c) => sum + c.amount, 0);
  const collected = meeting.collations
    .filter((c) => c.paid)
    .reduce((sum, c) => sum + c.amount, 0);

  const host = meeting.collationHostMembershipId
    ? await prisma.associationMembership.findFirst({
        where: { id: meeting.collationHostMembershipId, associationId },
        include: { user: { select: { id: true, name: true } } },
      })
    : null;

  const hostCollation = meeting.collations.find(
    (c) => c.membershipId === meeting.collationHostMembershipId
  );
  const hostFines = meeting.fines
    .filter((f) => f.membershipId === meeting.collationHostMembershipId && !f.paid)
    .reduce((sum, f) => sum + f.amount, 0);
  const hostArrears =
    (hostCollation && !hostCollation.paid ? hostCollation.amount : 0) + hostFines;

  const available = Math.max(0, collected - hostArrears);
  const netPayout = cfg.hostPayout > 0 ? Math.min(available, cfg.hostPayout) : available;

  return NextResponse.json({
    meeting: {
      id: meeting.id,
      title: meeting.title,
      scheduledAt: meeting.scheduledAt,
      status: meeting.status,
      collationStatus: meeting.collationStatus,
      collationHostMembershipId: meeting.collationHostMembershipId,
    },
    rate,
    configuredRate,
    activeCount,
    expected,
    collected,
    outstanding: Math.max(0, expected - collected),
    host: host ? { id: host.id, name: host.user.name, memberNumber: host.memberNumber } : null,
    hostArrears,
    hostPayoutLimit: cfg.hostPayout,
    hostFines,
    hostCollationDue: hostCollation && !hostCollation.paid ? hostCollation.amount : 0,
    netPayout,
    collations: meeting.collations.map((c) => ({
      id: c.id,
      membershipId: c.membershipId,
      memberName: c.membership.user.name,
      memberNumber: c.membership.memberNumber,
      amount: c.amount,
      paid: c.paid,
      paidAt: c.paidAt,
      method: c.method,
    })),
    canManage:
      BUREAU_ROLES.includes(membership.role) ||
      hasPermission(session, membership, "MANAGE_MEETINGS"),
  });
}

/**
 * POST /api/associations/[id]/meetings/[meetingId]/collation
 * actions : OPEN (ouvre la collecte), TOGGLE (encaisse un membre), CLOSE (clôture + PV).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId, meetingId } = await params;
  const membership = await getMembership(session.user.id, associationId);
  const allowed =
    membership &&
    (BUREAU_ROLES.includes(membership.role) ||
      hasPermission(session, membership, "MANAGE_MEETINGS"));
  if (!allowed) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });

  const meeting = await prisma.assocMeeting.findFirst({
    where: { id: meetingId, associationId },
  });
  if (!meeting) return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "").toUpperCase();

  if (action === "OPEN") {
    if (meeting.collationStatus === "CLOSED") {
      return NextResponse.json({ error: "Collation déjà clôturée" }, { status: 400 });
    }
    const assoc = await prisma.association.findUnique({
      where: { id: associationId },
      select: { meetingConfig: true },
    });
    const rate = Number(body.rate) > 0 ? Number(body.rate) : configNumbers(assoc?.meetingConfig).rate;
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: "Montant de collation invalide" }, { status: 400 });
    }

    const hostId: string | null =
      body.hostMembershipId === null || body.hostMembershipId === ""
        ? null
        : body.hostMembershipId ?? meeting.collationHostMembershipId ?? null;

    if (hostId) {
      const hostExists = await prisma.associationMembership.findFirst({
        where: { id: hostId, associationId, status: { not: "LEFT" } },
        select: { id: true },
      });
      if (!hostExists) return NextResponse.json({ error: "Hôte invalide" }, { status: 400 });
    }

    const activeMembers = await prisma.associationMembership.findMany({
      where: { associationId, status: "ACTIVE" },
      select: { id: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      await tx.assocMeeting.update({
        where: { id: meetingId },
        data: {
          collationRate: rate,
          collationHostMembershipId: hostId,
          collationStatus: "OPEN",
        },
      });
      let created = 0;
      for (const m of activeMembers) {
        const existing = await tx.assocMeetingCollation.findUnique({
          where: { meetingId_membershipId: { meetingId, membershipId: m.id } },
        });
        if (existing) {
          if (!existing.paid) {
            await tx.assocMeetingCollation.update({
              where: { id: existing.id },
              data: { amount: rate },
            });
          }
          continue;
        }
        await tx.assocMeetingCollation.create({
          data: { meetingId, membershipId: m.id, amount: rate },
        });
        created += 1;
      }
      await tx.associationAuditLog
        .create({
          data: {
            associationId,
            userId: session.user.id,
            action: "MEETING_COLLATION_OPEN",
            entity: "MEETING",
            entityId: meetingId,
            details: `Collation ouverte : ${rate} FCFA × ${activeMembers.length} membres (${created} nouvelles lignes)`,
          },
        })
        .catch(() => {});
      return { created, members: activeMembers.length };
    });

    return NextResponse.json({ ok: true, rate, ...result });
  }

  if (action === "TOGGLE") {
    const membershipId = String(body.membershipId ?? "");
    if (!membershipId) return NextResponse.json({ error: "membershipId requis" }, { status: 400 });
    const entry = await prisma.assocMeetingCollation.findUnique({
      where: { meetingId_membershipId: { meetingId, membershipId } },
    });
    if (!entry) return NextResponse.json({ error: "Ligne de collation introuvable" }, { status: 404 });
    if (meeting.collationStatus === "CLOSED") {
      return NextResponse.json({ error: "Collation clôturée" }, { status: 400 });
    }
    const paid = typeof body.paid === "boolean" ? body.paid : !entry.paid;
    const updated = await prisma.assocMeetingCollation.update({
      where: { id: entry.id },
      data: {
        paid,
        paidAt: paid ? new Date() : null,
        method: paid ? (body.method ?? "CASH") : null,
      },
    });
    return NextResponse.json({ ok: true, collation: updated });
  }

  if (action === "CLOSE") {
    const entries = await prisma.assocMeetingCollation.findMany({ where: { meetingId } });
    const collected = entries.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
    await prisma.assocMeeting.update({
      where: { id: meetingId },
      data: { collationStatus: "CLOSED" },
    });
    await prisma.associationAuditLog
      .create({
        data: {
          associationId,
          userId: session.user.id,
          action: "MEETING_COLLATION_CLOSE",
          entity: "MEETING",
          entityId: meetingId,
          details: `Collation clôturée : ${collected} FCFA collectés sur ${entries.length} lignes`,
        },
      })
      .catch(() => {});
    return NextResponse.json({ ok: true, collected });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
