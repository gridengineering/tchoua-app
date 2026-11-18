import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_RUBRIQUES,
  MARKETPLACE_TYPES,
  isMarketplaceType,
  marketplaceVisibilityWhere,
  normalizeListing,
  parseImages,
} from "@/lib/marketplace";

const MAX_IMAGES = 6;

async function viewerContext(userId: string) {
  const memberships = await prisma.associationMembership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { associationId: true, role: true },
  });
  return {
    associationIds: memberships.map((membership) => membership.associationId),
    memberships,
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || searchParams.get("search") || "").trim();
  const type = searchParams.get("type")?.toUpperCase() || "";
  const category = searchParams.get("category")?.trim() || "";
  const rubrique = searchParams.get("rubrique")?.trim() || "";
  const associationId = searchParams.get("associationId")?.trim() || "";
  const location = searchParams.get("location")?.trim() || "";
  const rawPriceMin = searchParams.get("priceMin");
  const rawPriceMax = searchParams.get("priceMax");
  const priceMin = rawPriceMin == null || rawPriceMin.trim() === "" ? Number.NaN : Number(rawPriceMin);
  const priceMax = rawPriceMax == null || rawPriceMax.trim() === "" ? Number.NaN : Number(rawPriceMax);
  const sort = searchParams.get("sort") || "recent";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") || 12)));

  const { associationIds } = await viewerContext(session.user.id);
  const where: any = {
    AND: [
      marketplaceVisibilityWhere(associationIds, session.user.id),
      { status: "ACTIVE" },
    ],
  };

  if (q) {
    where.AND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { rubrique: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (type && MARKETPLACE_TYPES.includes(type as any)) where.AND.push({ type });
  if (category) where.AND.push({ category });
  if (rubrique) where.AND.push({ rubrique });
  if (associationId) where.AND.push({ associationId });
  if (location) where.AND.push({ location: { contains: location, mode: "insensitive" } });
  if (Number.isFinite(priceMin) || Number.isFinite(priceMax)) {
    where.AND.push({
      price: {
        ...(Number.isFinite(priceMin) ? { gte: priceMin } : {}),
        ...(Number.isFinite(priceMax) ? { lte: priceMax } : {}),
      },
    });
  }

  const orderBy: any =
    sort === "price_asc" ? { price: "asc" }
    : sort === "price_desc" ? { price: "desc" }
    : sort === "deadline" ? { deadline: "asc" }
    : { createdAt: "desc" };

  const [listings, total, facetRows] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, avatar: true, location: true } },
        association: { select: { id: true, name: true, logo: true } },
        _count: { select: { interests: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where }),
    prisma.marketplaceListing.findMany({
      where: { AND: [marketplaceVisibilityWhere(associationIds, session.user.id), { status: "ACTIVE" }] },
      select: { category: true, rubrique: true, type: true },
    }),
  ]);

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...facetRows.map((row) => row.category).filter(Boolean)]));
  const rubriques = Array.from(new Set([...DEFAULT_RUBRIQUES, ...facetRows.map((row) => row.rubrique).filter(Boolean) as string[]]));
  const types = MARKETPLACE_TYPES.filter((candidate) => facetRows.some((row) => row.type === candidate));

  return NextResponse.json({
    listings: listings.map((listing) => ({
      ...normalizeListing(listing),
      interestCount: listing._count?.interests ?? listing.interestCount,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    facets: { categories, rubriques, types },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const type = String(body.type || "VENTE").toUpperCase();
  const category = String(body.category || "Autres").trim() || "Autres";
  const rubrique = body.rubrique ? String(body.rubrique).trim() : null;
  const associationId = body.associationId ? String(body.associationId) : null;
  const location = body.location ? String(body.location).trim() : null;
  const unit = body.unit ? String(body.unit).trim() : "unité";
  const quantity = body.quantity === "" || body.quantity == null ? null : Number(body.quantity);
  const rawPrice = body.price === "" || body.price == null ? null : Number(body.price);
  const deadline = body.deadline ? new Date(body.deadline) : null;
  const images = parseImages(body.images).slice(0, MAX_IMAGES);

  if (title.length < 3) return NextResponse.json({ error: "Le titre doit contenir au moins 3 caractères." }, { status: 400 });
  if (!isMarketplaceType(type)) return NextResponse.json({ error: "Type d'annonce invalide." }, { status: 400 });
  if (rawPrice != null && (!Number.isFinite(rawPrice) || rawPrice < 0)) {
    return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
  }
  if (quantity != null && (!Number.isFinite(quantity) || quantity < 0)) {
    return NextResponse.json({ error: "Quantité invalide." }, { status: 400 });
  }
  if (deadline && Number.isNaN(deadline.getTime())) return NextResponse.json({ error: "Échéance invalide." }, { status: 400 });

  const { associationIds, memberships } = await viewerContext(session.user.id);
  if (associationIds.length === 0) {
    return NextResponse.json({ error: "Vous devez être membre actif d'au moins une association pour publier." }, { status: 403 });
  }
  const targetAssociation = associationId || memberships[0]?.associationId;
  if (!targetAssociation || !associationIds.includes(targetAssociation)) {
    return NextResponse.json({ error: "Vous n'êtes pas membre de cette association." }, { status: 403 });
  }

  const listing = await prisma.marketplaceListing.create({
    data: {
      sellerId: session.user.id,
      associationId: targetAssociation,
      title,
      description: description || null,
      type,
      category,
      rubrique,
      price: rawPrice,
      unit,
      quantity,
      location,
      deadline,
      images: images.length ? JSON.stringify(images) : null,
      contactPhone: body.contactPhone ? String(body.contactPhone).trim() : null,
      contactEmail: body.contactEmail ? String(body.contactEmail).trim() : null,
      contactWhatsapp: body.contactWhatsapp ? String(body.contactWhatsapp).trim() : null,
      status: "ACTIVE",
    },
    include: {
      seller: { select: { id: true, name: true, avatar: true, location: true } },
      association: { select: { id: true, name: true, logo: true } },
      _count: { select: { interests: true } },
    },
  });

  return NextResponse.json({ listing: normalizeListing(listing) }, { status: 201 });
}
