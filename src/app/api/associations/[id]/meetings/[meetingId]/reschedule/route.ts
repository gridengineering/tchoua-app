import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMeetingBureau, meetingDateLabel, postMeetingMessage } from "@/lib/association/meetings";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId, meetingId } = await params;
  const me = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true, role: true },
  });
  if (!me || !isMeetingBureau(me.role)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  const meeting = await prisma.assocMeeting.findFirst({ where: { id: meetingId, associationId } });
  if (!meeting) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (meeting.closedAt) return NextResponse.json({ error: "Session clôturée" }, { status: 409 });
  if (meeting.openedAt) return NextResponse.json({ error: "La session est déjà ouverte ; créez une nouvelle séance pour changer la date." }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return NextResponse.json({ error: "Nouvelle date/heure invalide" }, { status: 400 });
  const modality = body.modality ? String(body.modality).toUpperCase() : meeting.modality;
  if (!["PHYSICAL", "ONLINE", "ROTATING"].includes(modality)) return NextResponse.json({ error: "Modalité invalide" }, { status: 400 });
  const hostMembershipId = body.hostMembershipId ? String(body.hostMembershipId) : meeting.hostMembershipId;
  if (hostMembershipId) {
    const host = await prisma.associationMembership.findFirst({ where: { id: hostMembershipId, associationId }, select: { id: true } });
    if (!host) return NextResponse.json({ error: "Hôte étranger à l'association" }, { status: 400 });
  }
  const updated = await prisma.assocMeeting.update({
    where: { id: meetingId },
    data: {
      scheduledAt,
      location: body.location !== undefined ? String(body.location) : meeting.location,
      modality,
      onlineUrl: body.onlineUrl !== undefined ? (body.onlineUrl || null) : meeting.onlineUrl,
      hostMembershipId: hostMembershipId || null,
      isRotating: modality === "ROTATING",
      notes: body.reason ? [meeting.notes, `Report : ${String(body.reason)}`].filter(Boolean).join("\n") : meeting.notes,
    },
  });
  await postMeetingMessage({
    associationId,
    membershipId: me.id,
    content: `📅 Session reportée : ${meeting.title ?? "Réunion"} — nouvelle date ${meetingDateLabel(updated.scheduledAt)}${updated.location ? ` · ${updated.location}` : ""}${body.reason ? ` · Motif : ${String(body.reason).slice(0, 300)}` : ""}.`,
  }).catch(() => {});
  return NextResponse.json({ meeting: updated });
}
