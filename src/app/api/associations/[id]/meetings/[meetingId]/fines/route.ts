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

const FINE_REASONS = [
  "ABSENT",
  "LATE",
  "INDISCIPLINE",
  "MISSED_COMMISSION",
  "ABSENT_AG",
  "EARLY_DEPARTURE",
  "OTHER",
] as const;

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

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
    select: { id: true },
  });
  if (!meeting) return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });

  const fines = await prisma.assocMeetingFine.findMany({
    where: { meetingId },
    include: { membership: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: [{ paid: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    fines: fines.map((f) => ({
      id: f.id,
      membershipId: f.membershipId,
      memberName: f.membership.user.name,
      reason: f.reason,
      amount: f.amount,
      paid: f.paid,
      paidAt: f.paidAt,
      notes: f.notes,
      createdAt: f.createdAt,
    })),
    totalUnpaid: fines.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0),
  });
}

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
    select: { id: true },
  });
  if (!meeting) return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const membershipId = String(body.membershipId ?? "");
  const reason = String(body.reason ?? "OTHER").toUpperCase();
  const amount = Number(body.amount);
  const notes = body.notes ? String(body.notes) : null;

  if (!membershipId) return NextResponse.json({ error: "membershipId requis" }, { status: 400 });
  if (!FINE_REASONS.includes(reason as (typeof FINE_REASONS)[number])) {
    return NextResponse.json({ error: "Motif invalide" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const target = await prisma.associationMembership.findFirst({
    where: { id: membershipId, associationId, status: { not: "LEFT" } },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 400 });

  const fine = await prisma.assocMeetingFine.create({
    data: { meetingId, membershipId, reason, amount, notes, paid: false },
    include: { membership: { include: { user: { select: { name: true } } } } },
  });

  await prisma.associationAuditLog
    .create({
      data: {
        associationId,
        userId: session.user.id,
        action: "MEETING_FINE_CREATE",
        entity: "MEETING",
        entityId: meetingId,
        details: `Amende ${reason} de ${amount} FCFA infligée à ${fine.membership.user.name}`,
      },
    })
    .catch(() => {});

  return NextResponse.json(
    {
      fine: {
        id: fine.id,
        membershipId: fine.membershipId,
        memberName: fine.membership.user.name,
        reason: fine.reason,
        amount: fine.amount,
        paid: fine.paid,
        notes: fine.notes,
        createdAt: fine.createdAt,
      },
    },
    { status: 201 }
  );
}

export async function PATCH(
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

  const body = await req.json().catch(() => ({}));
  const fineId = String(body.fineId ?? "");
  if (!fineId) return NextResponse.json({ error: "fineId requis" }, { status: 400 });

  const fine = await prisma.assocMeetingFine.findFirst({
    where: { id: fineId, meetingId, meeting: { associationId } },
  });
  if (!fine) return NextResponse.json({ error: "Amende introuvable" }, { status: 404 });

  const paid = typeof body.paid === "boolean" ? body.paid : !fine.paid;
  const updated = await prisma.assocMeetingFine.update({
    where: { id: fine.id },
    data: { paid, paidAt: paid ? new Date() : null },
  });

  return NextResponse.json({ ok: true, fine: updated });
}
