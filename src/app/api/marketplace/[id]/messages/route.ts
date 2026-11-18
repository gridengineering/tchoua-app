import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marketplaceVisibilityWhere } from "@/lib/marketplace";

async function viewerAssociations(userId: string) {
  const memberships = await prisma.associationMembership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { associationId: true },
  });
  return memberships.map((membership) => membership.associationId);
}

async function visibleListing(id: string, userId: string) {
  const associationIds = await viewerAssociations(userId);
  return prisma.marketplaceListing.findFirst({
    where: {
      id,
      OR: [marketplaceVisibilityWhere(associationIds, userId), { sellerId: userId }],
    },
    select: { id: true, sellerId: true, title: true, associationId: true },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const listing = await visibleListing(id, session.user.id);
  if (!listing) return NextResponse.json({ error: "Annonce introuvable ou non visible." }, { status: 404 });

  const conversationId = new URL(req.url).searchParams.get("conversationId");
  let conversation = conversationId
    ? await prisma.marketplaceConversation.findFirst({
        where: {
          id: conversationId,
          listingId: id,
          OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
        },
      })
    : null;

  if (!conversation && listing.sellerId !== session.user.id) {
    conversation = await prisma.marketplaceConversation.findUnique({
      where: { listingId_buyerId: { listingId: id, buyerId: session.user.id } },
    });
  }

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  const messages = await prisma.marketplaceMessage.findMany({
    where: { conversationId: conversation.id },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return NextResponse.json({
    conversation,
    messages,
    isSeller: conversation.sellerId === session.user.id,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const listing = await visibleListing(id, session.user.id);
  if (!listing) return NextResponse.json({ error: "Annonce introuvable ou non visible." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim().slice(0, 4000);
  if (!content) return NextResponse.json({ error: "Message requis." }, { status: 400 });

  let conversationId = body.conversationId ? String(body.conversationId) : "";
  let conversation = conversationId
    ? await prisma.marketplaceConversation.findFirst({
        where: {
          id: conversationId,
          listingId: id,
          OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
        },
      })
    : null;

  if (!conversation && listing.sellerId !== session.user.id) {
    conversation = await prisma.marketplaceConversation.create({
      data: { listingId: id, buyerId: session.user.id, sellerId: listing.sellerId },
    });
  }
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable. Ouvrez une discussion depuis l'annonce." }, { status: 403 });
  }

  const message = await prisma.marketplaceMessage.create({
    data: { conversationId: conversation.id, senderId: session.user.id, content },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });
  await prisma.marketplaceConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  }).catch(() => null);

  return NextResponse.json({ conversation, message }, { status: 201 });
}
