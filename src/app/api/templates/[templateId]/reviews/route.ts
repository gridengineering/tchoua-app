import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTemplatePopularityScore } from "@/lib/association/rules";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const reviews = await prisma.templateRating.findMany({
    where: { templateId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { templateId } = await params;
  const body = await req.json().catch(() => ({}));
  const { rating, comment } = body;

  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return NextResponse.json(
      { error: "La note doit être comprise entre 1 et 5" },
      { status: 400 }
    );
  }

  const template = await prisma.associationTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) {
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  }

  const review = await prisma.templateRating.upsert({
    where: {
      templateId_userId: {
        templateId,
        userId: session.user.id,
      },
    },
    create: {
      templateId,
      userId: session.user.id,
      rating: numericRating,
      comment: comment ?? null,
    },
    update: {
      rating: numericRating,
      comment: comment ?? null,
    },
  });

  const allRatings = await prisma.templateRating.findMany({
    where: { templateId },
    select: { rating: true },
  });
  const ratingCount = allRatings.length;
  const ratingAvg =
    ratingCount > 0
      ? Math.round(
          (allRatings.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10
        ) / 10
      : 0;

  const popularityScore = calculateTemplatePopularityScore({
    usageCount: template.usageCount,
    activeAssociations: template.usageCount,
    ratingAvg,
    ratingCount,
    completionRate: 100,
  });

  await prisma.associationTemplate.update({
    where: { id: templateId },
    data: {
      rating: ratingAvg,
      ratingCount,
      popularityScore,
    },
  });

  return NextResponse.json({ review, rating: ratingAvg, ratingCount, popularityScore }, { status: 201 });
}
