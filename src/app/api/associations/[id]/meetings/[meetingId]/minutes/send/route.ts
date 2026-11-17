import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMeetingBureau, meetingDateLabel } from "@/lib/association/meetings";
import { generateMeetingPdfs } from "@/lib/association/meeting-minutes";
import { sendTransactionalEmail } from "@/lib/mailer";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId, meetingId } = await params;
  const me = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true, role: true },
  });
  if (!me || !isMeetingBureau(me.role)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  const meeting = await prisma.assocMeeting.findFirst({ where: { id: meetingId, associationId }, include: { association: { select: { name: true } } } });
  if (!meeting) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (!meeting.closedAt) return NextResponse.json({ error: "Clôturez la session avant d'envoyer le compte rendu." }, { status: 409 });

  const report = await generateMeetingPdfs(associationId, meetingId);
  const recipients = await prisma.associationMembership.findMany({
    where: { associationId, status: "ACTIVE", user: { emailVerifiedAt: { not: null }, email: { not: "" } } },
    select: { user: { select: { email: true, name: true } } },
    distinct: ["userId"],
  });
  const subject = `Compte rendu — ${meeting.association.name} — ${meetingDateLabel(meeting.scheduledAt)}`;
  let sent = 0;
  const failed: string[] = [];
  for (const recipient of recipients) {
    const email = recipient.user.email;
    if (!email) continue;
    const ok = await sendTransactionalEmail({
      to: email,
      subject,
      text: `Bonjour ${recipient.user.name},\n\nVeuillez trouver ci-joint le compte rendu et le relevé financier de la session du ${meetingDateLabel(meeting.scheduledAt)}.\n\n${meeting.association.name}`,
      html: report.html,
      attachments: [
        { filename: "compte-rendu-session.pdf", path: report.minutesPath },
        { filename: "releve-session.pdf", path: report.statementPath },
      ],
    });
    if (ok) sent += 1; else failed.push(email);
  }
  return NextResponse.json({ sent, failed: failed.length, recipients: recipients.length, minutesUrl: report.minutesUrl, statementUrl: report.statementUrl }, { status: sent > 0 ? 200 : 502 });
}
