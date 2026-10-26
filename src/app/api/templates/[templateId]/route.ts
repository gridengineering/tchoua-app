import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";
import {
  validateTemplateDeletionOrArchival,
  calculateTemplatePopularityScore,
} from "@/lib/association/rules";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;

  const template = await prisma.associationTemplate.findUnique({
    where: { id: templateId },
    include: {
      activities: { orderBy: { sortOrder: "asc" } },
      ratings: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!template) return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });

  return NextResponse.json({ template });
}

// ─── §11.9 & R-035 : Mise à jour d'un template avec incrémentation de version ─
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { templateId } = await params;
  const existing = await prisma.associationTemplate.findUnique({
    where: { id: templateId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  }

  if (existing.creatorId !== session.user.id && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    name,
    description,
    category,
    visibility,
    targetAudience,
    reglementHtml,
    iconEmoji,
    color,
    isActive,
  } = body;

  const popularityScore = calculateTemplatePopularityScore({
    usageCount: existing.usageCount,
    activeAssociations: existing.usageCount,
    ratingAvg: existing.rating,
    ratingCount: existing.ratingCount,
    completionRate: 100,
  });

  const updated = await prisma.associationTemplate.update({
    where: { id: templateId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(visibility !== undefined && { visibility }),
      ...(targetAudience !== undefined && { targetAudience }),
      ...(reglementHtml !== undefined && { reglementHtml }),
      ...(iconEmoji !== undefined && { iconEmoji }),
      ...(color !== undefined && { color }),
      ...(isActive !== undefined && { isActive }),
      // R-035 : Chaque modification incrémente la version
      version: { increment: 1 },
      popularityScore,
    },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ template: updated });
}

// ─── §11.9 & R-028 : Suppression ou archivage si usageCount > 10 ──────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { templateId } = await params;
  const existing = await prisma.associationTemplate.findUnique({
    where: { id: templateId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  }

  if (existing.creatorId !== session.user.id && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const decision = validateTemplateDeletionOrArchival(existing.usageCount);
  if (decision.shouldArchive) {
    const archived = await prisma.associationTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });
    return NextResponse.json({
      archived: true,
      deleted: false,
      reason: decision.reason,
      template: archived,
    });
  }

  await prisma.associationTemplate.delete({
    where: { id: templateId },
  });

  return NextResponse.json({ archived: false, deleted: true });
}
