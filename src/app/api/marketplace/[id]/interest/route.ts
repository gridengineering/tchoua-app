import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications/dispatch";
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
    include: {
      seller: { select: { id: true, name: true, email: true, language: true } },
      association: { select: { id: true, name: true } },
    },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const listing = await visibleListing(id, session.user.id);
  if (!listing) return NextResponse.json({ error: "Annonce introuvable ou non visible." }, { status: 404 });
  if (listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous intéresser à votre propre annonce." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const message = body.message ? String(body.message).trim().slice(0, 2000) : null;
  const contact = body.contact ? String(body.contact).trim().slice(0, 200) : null;

  const existing = await prisma.marketplaceInterest.findUnique({
    where: { listingId_userId: { listingId: id, userId: session.user.id } },
  });
  const interest = existing
    ? await prisma.marketplaceInterest.update({
        where: { id: existing.id },
        data: { message, contact, status: "NEW" },
      })
    : await prisma.marketplaceInterest.create({
        data: { listingId: id, userId: session.user.id, message, contact },
      });

  if (!existing) {
    await prisma.marketplaceListing.update({
      where: { id },
      data: { interestCount: { increment: 1 } },
    }).catch(() => null);
  }

  const conversation = await prisma.marketplaceConversation.upsert({
    where: { listingId_buyerId: { listingId: id, buyerId: session.user.id } },
    update: { updatedAt: new Date() },
    create: { listingId: id, buyerId: session.user.id, sellerId: listing.sellerId },
  });

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  const actorName = actor?.name ?? "Un membre";
  const typeLabel = listing.type;
  await dispatchNotification({
    event: "MARKETPLACE_INTEREST",
    userId: listing.sellerId,
    associationId: listing.associationId,
    title: "Nouvel intérêt pour votre annonce",
    message: `${actorName} s'intéresse à « ${listing.title} » (${typeLabel}).${message ? ` Message : ${message}` : ""}`,
    link: `/marketplace?listing=${listing.id}`,
    type: "ACTION_REQUIRED",
    data: { listingId: listing.id, interestId: interest.id, conversationId: conversation.id },
  }).catch(() => null);

  return NextResponse.json({ interest, conversationId: conversation.id }, { status: existing ? 200 : 201 });
}
