import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centrifugoToken } from "@/lib/rtc/centrifugo";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const associationId = String(body.associationId ?? "");
  const settings = await getPlatformSettings();
  const rtc = settings.rtc;
  if (!rtc.enabled || !rtc.chatEnabled) {
    return NextResponse.json({ error: "Le chat temps réel est désactivé par l'administration." }, { status: 503 });
  }
  if (!associationId) return NextResponse.json({ error: "associationId requis" }, { status: 400 });

  const membership = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: session.user.id, associationId } },
    select: { status: true, role: true },
  });
  if (!membership || membership.status === "LEFT") {
    return NextResponse.json({ error: "Vous n'êtes pas membre de cette association" }, { status: 403 });
  }

  const channels = [`assoc:${associationId}:GENERAL`, `assoc:${associationId}:ANNONCES`];
  if (rtc.bureauChannelEnabled && ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ"].includes(membership.role)) {
    channels.push(`assoc:${associationId}:BUREAU`);
  }
  const activities = await prisma.associationActivity.findMany({
    where: { associationId },
    select: { id: true },
  });
  channels.push(...activities.map((activity) => `assoc:${associationId}:ACT_${activity.id}`));

  try {
    const token = centrifugoToken(session.user.id, channels);
    return NextResponse.json({
      token,
      channels,
      wsUrl: rtc.chatWsUrl || process.env.CENTRIFUGO_WS_URL || "wss://chat.tchoua.com/connection/websocket",
    });
  } catch {
    return NextResponse.json({ error: "Messagerie temps réel non configurée" }, { status: 503 });
  }
}
