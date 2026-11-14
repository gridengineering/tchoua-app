import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishAssociationEvent } from "@/lib/rtc/centrifugo";
import { getPlatformSettings } from "@/lib/platform-settings";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ", "SOLIDARITY_OFFICER"];

async function chatEnabled() {
  const settings = await getPlatformSettings();
  return settings.rtc.enabled && settings.rtc.chatEnabled;
}

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await chatEnabled())) return NextResponse.json({ error: "Le chat est désactivé." }, { status: 503 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") ?? "GENERAL";
  const before = searchParams.get("before");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  // BUREAU channel restricted to bureau members
  if (channel === "BUREAU" && !BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  }

  const messages = await prisma.assocMessage.findMany({
    where: {
      associationId: id,
      channel,
      isDeleted: false,
      ...(before && { createdAt: { lt: new Date(before) } }),
    },
    include: {
      membership: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await chatEnabled())) return NextResponse.json({ error: "Le chat est désactivé." }, { status: 503 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const body = await req.json();
  const { content, type = "TEXT", channel = "GENERAL", mediaUrl, replyToId } = body;

  if ((!content || !content.trim()) && !mediaUrl) {
    return NextResponse.json({ error: "content ou fichier requis" }, { status: 400 });
  }

  if (channel === "BUREAU" && !BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  }

  const message = await prisma.assocMessage.create({
    data: {
      associationId: id,
      membershipId: membership.id,
      content: String(content ?? "").slice(0, 4000),
      type,
      channel,
      mediaUrl,
      replyToId,
    },
    include: {
      membership: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
  });

  await publishAssociationEvent(id, channel, { type: "message", message });

  return NextResponse.json({ message }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "messageId requis" }, { status: 400 });

  const msg = await prisma.assocMessage.findFirst({
    where: { id: messageId, associationId: id },
  });
  if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });

  // Author or bureau can delete
  if (msg.membershipId !== membership.id && !BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  await prisma.assocMessage.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });

  return NextResponse.json({ ok: true });
}
