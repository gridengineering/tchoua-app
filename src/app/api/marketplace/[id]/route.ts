import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { isMarketplaceType, marketplaceVisibilityWhere, normalizeListing } from "@/lib/marketplace";

async function getViewer(userId: string) {
  const memberships = await prisma.associationMembership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { associationId: true },
  });
  return memberships.map((membership) => membership.associationId);
}

async function findVisible(id: string, userId: string) {
  const associationIds = await getViewer(userId);
  return prisma.marketplaceListing.findFirst({
    where: {
      id,
      OR: [
        marketplaceVisibilityWhere(associationIds, userId),
        { sellerId: userId },
      ],
    },
    include: {
      seller: { select: { id: true, name: true, avatar: true, location: true, email: true } },
      association: { select: { id: true, name: true, logo: true } },
      _count: { select: { interests: true, conversations: true } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const listing = await findVisible(id, session.user.id);
  if (!listing) return NextResponse.json({ error: "Annonce introuvable ou non visible." }, { status: 404 });

  const isOwner = listing.sellerId === session.user.id;
  const [myInterest, interests, conversations] = await Promise.all([
    isOwner ? null : prisma.marketplaceInterest.findUnique({
      where: { listingId_userId: { listingId: id, userId: session.user.id } },
    }),
    isOwner
      ? prisma.marketplaceInterest.findMany({
          where: { listingId: id },
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : null,
    isOwner
      ? prisma.marketplaceConversation.findMany({
          where: { listingId: id, sellerId: session.user.id },
          include: {
            buyer: { select: { id: true, name: true, avatar: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        })
      : null,
  ]);

  if (!isOwner) {
    await prisma.marketplaceListing.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => null);
  }

  return NextResponse.json({
    listing: normalizeListing(listing),
    isOwner,
    myInterest,
    interests,
    conversations,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sellerId !== session.user.id && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.description !== undefined) data.description = String(body.description).trim() || null;
  if (body.type !== undefined) {
    if (!isMarketplaceType(String(body.type).toUpperCase())) return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    data.type = String(body.type).toUpperCase();
  }
  if (body.category !== undefined) data.category = String(body.category).trim() || "Autres";
  if (body.rubrique !== undefined) data.rubrique = String(body.rubrique).trim() || null;
  if (body.price !== undefined) data.price = body.price === "" || body.price == null ? null : Number(body.price);
  if (body.unit !== undefined) data.unit = String(body.unit).trim() || "unité";
  if (body.quantity !== undefined) data.quantity = body.quantity === "" || body.quantity == null ? null : Number(body.quantity);
  if (body.location !== undefined) data.location = String(body.location).trim() || null;
  if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;
  if (body.images !== undefined) data.images = JSON.stringify(body.images).slice(0, 20000);
  if (body.contactPhone !== undefined) data.contactPhone = String(body.contactPhone).trim() || null;
  if (body.contactEmail !== undefined) data.contactEmail = String(body.contactEmail).trim() || null;
  if (body.contactWhatsapp !== undefined) data.contactWhatsapp = String(body.contactWhatsapp).trim() || null;
  if (body.status !== undefined) {
    if (!["ACTIVE", "PAUSED", "CLOSED"].includes(String(body.status))) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    data.status = String(body.status);
  }

  const updated = await prisma.marketplaceListing.update({
    where: { id },
    data,
    include: {
      seller: { select: { id: true, name: true, avatar: true, location: true } },
      association: { select: { id: true, name: true, logo: true } },
      _count: { select: { interests: true } },
    },
  });
  return NextResponse.json({ listing: normalizeListing(updated) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sellerId !== session.user.id && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  await prisma.marketplaceListing.update({ where: { id }, data: { status: "CLOSED" } });
  return NextResponse.json({ success: true });
}
