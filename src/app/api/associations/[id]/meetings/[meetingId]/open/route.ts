import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  agendaTemplate,
  currentRotation,
  isMeetingBureau,
  meetingDateLabel,
  parseMeetingConfig,
  postMeetingMessage,
} from "@/lib/association/meetings";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId, meetingId } = await params;
  const me = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true, role: true },
  });
  if (!me || !isMeetingBureau(me.role)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const meeting = await prisma.assocMeeting.findFirst({
    where: { id: meetingId, associationId },
    include: { association: { select: { meetingConfig: true, name: true } }, agendaItems: true },
  });
  if (!meeting) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (meeting.closedAt) return NextResponse.json({ error: "Session déjà clôturée" }, { status: 409 });
  if (meeting.openedAt) return NextResponse.json({ error: "Session déjà ouverte" }, { status: 409 });

  const active = await prisma.associationMembership.findMany({
    where: { associationId, status: "ACTIVE" },
    select: { id: true, role: true, user: { select: { name: true } } },
    orderBy: [{ joinedAt: "asc" }, { createdAt: "asc" }],
  });
  const validIds = new Set(active.map((m) => m.id));
  const requested = body.roles ?? {};
  const defaultPresident = active.find((m) => m.role === "PRESIDENT")?.id ?? active.find((m) => m.role === "FOUNDER")?.id ?? null;
  const defaultSecretary = active.find((m) => m.role === "SECRETARY")?.id ?? null;
  const defaultCensor = active.find((m) => m.role === "AUDITOR")?.id ?? null;
  const pick = (value: unknown, fallback: string | null) => {
    const id = value ? String(value) : "";
    return validIds.has(id) ? id : fallback;
  };
  const sessionPresidentId = pick(requested.presidentId ?? body.sessionPresidentId, defaultPresident);
  const sessionSecretaryId = pick(requested.secretaryId ?? body.sessionSecretaryId, defaultSecretary);
  const sessionCensorId = pick(requested.censorId ?? body.sessionCensorId, defaultCensor);
  const extra = Array.isArray(requested.extra) ? requested.extra.filter((r: any) => validIds.has(String(r.membershipId))).map((r: any) => ({ role: String(r.role ?? "MEMBRE"), membershipId: String(r.membershipId) })) : [];

  const associationConfig = parseMeetingConfig(meeting.association.meetingConfig);
  const template = agendaTemplate(associationConfig);
  let plannedAgenda: string[] = [];
  if (meeting.agenda) {
    try {
      const parsed = JSON.parse(meeting.agenda);
      plannedAgenda = (Array.isArray(parsed) ? parsed : [])
        .map((x) => (typeof x === "string" ? x : x?.title))
        .filter(Boolean)
        .map(String);
    } catch {
      plannedAgenda = String(meeting.agenda).split("\n").map((x) => x.trim()).filter(Boolean);
    }
  }
  const initialAgenda = plannedAgenda.length ? plannedAgenda : (body.loadTemplate === false ? [] : template);
  const modality = String(body.modality ?? meeting.modality ?? (meeting.isRotating ? "ROTATING" : "PHYSICAL")).toUpperCase();
  if (!["PHYSICAL", "ONLINE", "ROTATING"].includes(modality)) return NextResponse.json({ error: "Modalité invalide" }, { status: 400 });
  const rotation = await currentRotation(associationId);
  const rotationHost = rotation.next?.membershipId ?? null;
  const requestedHost = body.hostMembershipId && validIds.has(String(body.hostMembershipId)) ? String(body.hostMembershipId) : null;
  const hostMembershipId = requestedHost ?? meeting.hostMembershipId ?? (modality === "ROTATING" ? rotationHost : null);
  const resolvedLocation = body.location
    ? String(body.location)
    : meeting.location || (modality === "ROTATING" ? rotation.next?.address : null);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.assocMeetingAttendance.createMany({
      data: active.map((m) => ({ meetingId, membershipId: m.id, status: "ABSENT", arrivedAt: null })),
      skipDuplicates: true,
    });
    if (initialAgenda.length > 0 && meeting.agendaItems.length === 0) {
      await tx.assocMeetingAgendaItem.createMany({
        data: initialAgenda.map((title, index) => ({ meetingId, order: index + 1, title })),
      });
    }
    return tx.assocMeeting.update({
      where: { id: meetingId },
      data: {
        status: "HELD",
        openedAt: new Date(),
        modality,
        onlineUrl: body.onlineUrl ? String(body.onlineUrl) : meeting.onlineUrl,
        location: resolvedLocation || null,
        hostMembershipId: hostMembershipId || null,
        isRotating: modality === "ROTATING",
        sessionPresidentId,
        sessionSecretaryId,
        sessionCensorId,
        sessionRolesExtra: JSON.stringify(extra),
        quorumRequired: body.quorumRequired != null ? Number(body.quorumRequired) : meeting.quorumRequired,
      },
      include: { attendances: { include: { membership: { include: { user: { select: { name: true } } } } } }, agendaItems: { orderBy: { order: "asc" } } },
    });
  });

  await postMeetingMessage({
    associationId,
    membershipId: me.id,
    content: `🔔 Séance ouverte : ${meeting.title ?? "Réunion"} — ${meetingDateLabel(meeting.scheduledAt)}. Président de séance : ${active.find((m) => m.id === sessionPresidentId)?.user.name ?? "à désigner"}${hostMembershipId ? ` · Hôte : ${active.find((m) => m.id === hostMembershipId)?.user.name ?? "membre"}` : ""}.`,
  }).catch(() => {});

  return NextResponse.json({ meeting: updated });
}
