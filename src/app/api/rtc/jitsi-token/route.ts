import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHmac } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAssociationEligibility, eligibilityJson } from "@/lib/association/eligibility";
import { getPlatformSettings } from "@/lib/platform-settings";

const MODERATOR_ROLES = new Set([
  "FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ",
]);

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signJitsiJwt(payload: Record<string, unknown>, secret: string) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const settings = await getPlatformSettings();
  const rtc = settings.rtc;
  if (!rtc.enabled || !rtc.videoEnabled) {
    return NextResponse.json({ error: "La visioconférence est désactivée par l'administration." }, { status: 503 });
  }
  const secret = process.env.JITSI_JWT_APP_SECRET;
  const appId = rtc.jitsiAppId || process.env.JITSI_JWT_APP_ID || "tchoua";
  const jitsiUrl = (rtc.jitsiUrl || process.env.JITSI_URL || "https://meet.tchoua.com").replace(/\/$/, "");
  if (!secret) {
    return NextResponse.json({ error: "Service visioconférence non configuré" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const associationId = String(body.associationId ?? "");
  const meetingId = body.meetingId ? String(body.meetingId) : null;
  if (!associationId) return NextResponse.json({ error: "associationId requis" }, { status: 400 });

  const membership = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: session.user.id, associationId } },
    select: { id: true, role: true, status: true, user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  if (!membership || membership.status === "LEFT") {
    return NextResponse.json({ error: "Vous n'êtes pas membre de cette association" }, { status: 403 });
  }

  if (meetingId) {
    const meeting = await prisma.assocMeeting.findFirst({
      where: { id: meetingId, associationId },
      select: { id: true },
    });
    if (!meeting) return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
  }

  const eligibility = await checkAssociationEligibility(session.user.id, associationId, {
    minKycLevel: Number(rtc.requireKycLevel ?? 1),
  });
  if (!eligibility.ok) {
    return NextResponse.json(eligibilityJson(eligibility), { status: 403 });
  }

  const prefix = (rtc.jitsiRoomPrefix || "assoc").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "assoc";
  const room = meetingId
    ? `${prefix}-${associationId}-reunion-${meetingId}`
    : `${prefix}-${associationId}-general`;
  const moderator = MODERATOR_ROLES.has(membership.role);
  const now = Math.floor(Date.now() / 1000);
  const token = signJitsiJwt(
    {
      aud: "jitsi",
      iss: appId,
      sub: appId,
      room,
      exp: now + Math.max(5, Number(rtc.jitsiJwtTtlMinutes ?? 60)) * 60,
      nbf: now - 10,
      iat: now,
      context: {
        user: {
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          avatar: membership.user.avatar ?? "",
          moderator,
        },
      },
    },
    secret
  );

  return NextResponse.json({
    token,
    room,
    moderator,
    url: `${jitsiUrl}/${encodeURIComponent(room)}?jwt=${encodeURIComponent(token)}`,
  });
}
