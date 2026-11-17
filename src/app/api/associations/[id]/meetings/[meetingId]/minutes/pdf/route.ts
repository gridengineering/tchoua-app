import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMeetingPdfs } from "@/lib/association/meeting-minutes";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId, meetingId } = await params;
  const me = await prisma.associationMembership.findFirst({ where: { associationId, userId: session.user.id, status: { not: "LEFT" } }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  const meeting = await prisma.assocMeeting.findFirst({ where: { id: meetingId, associationId } });
  if (!meeting) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  const type = new URL(req.url).searchParams.get("type") === "statement" ? "statement" : "minutes";
  let report;
  try {
    report = await generateMeetingPdfs(associationId, meetingId);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Génération impossible" }, { status: 500 });
  }
  const path = type === "statement" ? report.statementPath : report.minutesPath;
  const data = await readFile(path);
  const filename = type === "statement" ? "releve-session.pdf" : "compte-rendu-session.pdf";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
