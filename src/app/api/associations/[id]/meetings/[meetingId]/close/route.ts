import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMeetingPdfs } from "@/lib/association/meeting-minutes";
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
  if (meeting.closedAt) return NextResponse.json({ error: "Session déjà clôturée" }, { status: 409 });
  if (!meeting.openedAt) return NextResponse.json({ error: "Ouvrez la session avant de la clôturer." }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const report = await generateMeetingPdfs(associationId, meetingId);
  const minutesHtml = body.minutesHtml ? String(body.minutesHtml).slice(0, 200000) : report.html;
  let nextMeeting: any = null;

  const result = await prisma.$transaction(async (tx) => {
    const closed = await tx.assocMeeting.update({
      where: { id: meetingId },
      data: {
        status: "HELD",
        closedAt: new Date(),
        minutesHtml,
        minutesUrl: report.minutesUrl,
      },
    });
    if (meeting.hostMembershipId) {
      await tx.hostingRotation.updateMany({
        where: { associationId, membershipId: meeting.hostMembershipId, status: "PENDING" },
        data: { status: "HOSTED", hostedMeetingId: meetingId },
      });
    }
    if (body.nextMeeting?.scheduledAt) {
      const nextDate = new Date(body.nextMeeting.scheduledAt);
      if (!Number.isNaN(nextDate.getTime())) {
        nextMeeting = await tx.assocMeeting.create({
          data: {
            associationId,
            title: body.nextMeeting.title || "Session ordinaire",
            type: "REGULAR",
            scheduledAt: nextDate,
            location: body.nextMeeting.location || null,
            modality: body.nextMeeting.modality || meeting.modality,
            onlineUrl: body.nextMeeting.onlineUrl || null,
            hostMembershipId: body.nextMeeting.hostMembershipId || null,
            isRotating: (body.nextMeeting.modality || meeting.modality) === "ROTATING",
            quorumRequired: body.nextMeeting.quorumRequired ?? meeting.quorumRequired,
            status: "PLANNED",
          },
        });
      }
    }
    await tx.assocDocument.create({
      data: {
        associationId,
        name: `Compte rendu — ${meeting.title ?? "Session"} — ${meeting.scheduledAt.toISOString().slice(0, 10)}`,
        type: "PV_REUNION",
        url: report.minutesUrl,
        mimeType: "application/pdf",
        isPublic: false,
        relatedMeetingId: meetingId,
      },
    }).catch(() => null);
    return { meeting: closed, nextMeeting };
  });

  await postMeetingMessage({ associationId, membershipId: me.id, content: `✅ Session clôturée : ${meeting.title ?? "Réunion"} — ${meetingDateLabel(new Date())}.`, channel: "GENERAL" }).catch(() => {});
  await postMeetingMessage({ associationId, membershipId: me.id, content: `📄 Relevé financier de session disponible : ${meeting.title ?? "Session"}.`, type: "DOCUMENT", mediaUrl: report.statementUrl }).catch(() => {});
  await postMeetingMessage({ associationId, membershipId: me.id, content: `📘 Compte rendu de session disponible : ${meeting.title ?? "Session"}.`, type: "DOCUMENT", mediaUrl: report.minutesUrl }).catch(() => {});

  return NextResponse.json({
    meeting: result.meeting,
    nextMeeting: result.nextMeeting,
    minutesUrl: report.minutesUrl,
    statementUrl: report.statementUrl,
    totals: report.totals,
    present: report.present.length,
    absent: report.absent.length,
  });
}
