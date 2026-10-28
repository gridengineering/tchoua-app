import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getDefaultMeetingQuorum,
  calculateProgressiveAbsenceFine,
} from "@/lib/association/rules";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "SOLIDARITY_OFFICER"];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get("meetingId");

  // Single meeting detail with attendance
  if (meetingId) {
    const meeting = await prisma.assocMeeting.findFirst({
      where: { id: meetingId, associationId: id },
      include: {
        attendances: {
          include: { membership: { include: { user: { select: { name: true, email: true } } } } },
        },
        fines: {
          include: { membership: { include: { user: { select: { name: true, email: true } } } } },
        },
      },
    });
    if (!meeting) return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
    return NextResponse.json({ meeting });
  }

  const upcoming = searchParams.get("upcoming") === "true";
  const past = searchParams.get("past") === "true";

  const now = new Date();

  const meetings = await prisma.assocMeeting.findMany({
    where: {
      associationId: id,
      ...(upcoming && { scheduledAt: { gte: now } }),
      ...(past && { scheduledAt: { lt: now } }),
    },
    include: {
      _count: { select: { attendances: true } },
      attendances: {
        where: { membershipId: membership.id },
        select: { id: true, status: true },
      },
    },
    orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
    take: 50,
  });

  const result = meetings.map((m) => ({
    ...m,
    myAttendance: m.attendances[0] ?? null,
    attendances: undefined,
  }));

  return NextResponse.json({ meetings: result });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership || !BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
  }

  const body = await req.json();
  const { title, type, scheduledAt, location, quorumRequired, agenda, notes, isRotating } = body;

  if (!title || !scheduledAt) {
    return NextResponse.json({ error: "title et scheduledAt sont requis" }, { status: 400 });
  }

  function resolveQuorum(typeVal?: string, provided?: number) {
    if (provided !== undefined && provided !== null) return provided;
    return getDefaultMeetingQuorum(typeVal ?? "REGULAR");
  }

  const resolvedType = type ?? "REGULAR";

  const meeting = await prisma.assocMeeting.create({
    data: {
      associationId: id,
      title,
      type: resolvedType,
      scheduledAt: new Date(scheduledAt),
      location,
      quorumRequired: resolveQuorum(resolvedType, quorumRequired),
      agenda: agenda ? JSON.stringify(agenda) : null,
      notes,
      isRotating: isRotating ?? false,
      status: "PLANNED",
    },
  });

  return NextResponse.json({ meeting }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership || !BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
  }

  const body = await req.json();
  const { meetingId, membershipId, attendanceStatus, status } = body;

  if (!meetingId) return NextResponse.json({ error: "meetingId requis" }, { status: 400 });

  const meeting = await prisma.assocMeeting.findFirst({ where: { id: meetingId, associationId: id } });
  if (!meeting) return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });

  // Update meeting status
  if (status) {
    await prisma.assocMeeting.update({ where: { id: meetingId }, data: { status } });
  }

  // Record attendance
  if (membershipId && attendanceStatus) {
    await prisma.assocMeetingAttendance.upsert({
      where: { meetingId_membershipId: { meetingId, membershipId } },
      create: { meetingId, membershipId, status: attendanceStatus },
      update: { status: attendanceStatus },
    });

    // Auto-create fine for absent members (SPECIFICATION.md §3.2 & R-050)
    if (attendanceStatus === "ABSENT") {
      const assoc = await prisma.association.findUnique({ where: { id } });
      const totalAbsences = await prisma.assocMeetingAttendance.count({
        where: { membershipId, meeting: { associationId: id }, status: "ABSENT" },
      });

      const progressive = calculateProgressiveAbsenceFine(totalAbsences);
      let fineAmount = progressive.fineAmount;
      const reason = `Absence #${totalAbsences} non justifiée`;

      if (assoc?.sanctionsConfig) {
        try {
          const sc = JSON.parse(assoc.sanctionsConfig);
          if (sc.absenceFines && Array.isArray(sc.absenceFines)) {
            fineAmount =
              sc.absenceFines[Math.min(Math.max(0, totalAbsences - 1), sc.absenceFines.length - 1)] ??
              progressive.fineAmount;
          } else if (sc.absenceFine) {
            fineAmount = sc.absenceFine * totalAbsences;
          }
        } catch {}
      }

      if (fineAmount > 0) {
        const existingFine = await prisma.assocMeetingFine.findFirst({
          where: { meetingId, membershipId, reason: { startsWith: "Absence" } },
        });
        if (!existingFine) {
          await prisma.assocMeetingFine.create({
            data: { meetingId, membershipId, reason, amount: fineAmount, paid: false },
          });
        }
      }

      // R-050 : Signalement automatique au bureau dès 3 absences non justifiées
      if (progressive.notifyBureau && prisma.associationAuditLog?.create) {
        await prisma.associationAuditLog
          .create({
            data: {
              associationId: id,
              userId: session.user.id,
              action:
                progressive.action === "PROPOSE_RADIATION"
                  ? "ABSENCE_PROPOSE_RADIATION"
                  : progressive.action === "WARNING_AND_FINE"
                  ? "ABSENCE_FORMAL_WARNING"
                  : "ABSENCE_BUREAU_ALERT_R050",
              entity: "MEMBERSHIP",
              entityId: membershipId,
              details: `Membre absent ${totalAbsences} fois sans justification (${progressive.action})`,
            },
          })
          .catch(() => {});
      }
    }

    // Auto-create fine for late arrival (Module 3.2)
    if (attendanceStatus === "LATE") {
      const assoc = await prisma.association.findUnique({ where: { id } });
      if (assoc?.sanctionsConfig) {
        try {
          const sc = JSON.parse(assoc.sanctionsConfig);
          const lateFine = sc.lateFine ?? 500;
          const lateThreshold = sc.lateThresholdMinutes ?? 30;

          const arrivedAt = new Date();
          const scheduledAt = new Date(meeting.scheduledAt);
          const diffMinutes = (arrivedAt.getTime() - scheduledAt.getTime()) / (1000 * 60);

          if (diffMinutes > lateThreshold) {
            const existingFine = await prisma.assocMeetingFine.findFirst({
              where: { meetingId, membershipId, reason: { startsWith: "Retard" } },
            });
            if (!existingFine) {
              await prisma.assocMeetingFine.create({
                data: {
                  meetingId,
                  membershipId,
                  reason: `Retard de ${Math.round(diffMinutes)} min (> ${lateThreshold} min)`,
                  amount: lateFine,
                  paid: false
                },
              });
            }
          }
        } catch {}
      }
    }

    // Recalculate attendee count and quorum
    const presentCount = await prisma.assocMeetingAttendance.count({
      where: { meetingId, status: { in: ["PRESENT", "LATE"] } },
    });
    const totalMembers = await prisma.associationMembership.count({
      where: { associationId: id, status: "ACTIVE" },
    });
    const quorumReached = totalMembers > 0
      ? (presentCount / totalMembers) * 100 >= (meeting.quorumRequired ?? 0)
      : false;
    await prisma.assocMeeting.update({
      where: { id: meetingId },
      data: { attendeeCount: presentCount, quorumReached },
    });
  }

  return NextResponse.json({ ok: true });
}
