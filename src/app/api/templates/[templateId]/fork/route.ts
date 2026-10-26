import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { API_ERROR_CODES } from "@/lib/association/rules";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { templateId } = await params;

  const sourceTemplate = await prisma.associationTemplate.findUnique({
    where: { id: templateId },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
  });

  if (!sourceTemplate) {
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  }

  // R-032 : Les templates système (SYSTEM) ne peuvent pas être forkés, seulement utilisés tels quels
  if (sourceTemplate.origin === "SYSTEM") {
    return NextResponse.json(
      {
        error: API_ERROR_CODES.ASSOC_009.message,
        code: API_ERROR_CODES.ASSOC_009.code,
      },
      { status: API_ERROR_CODES.ASSOC_009.httpStatus }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, visibility = "PRIVATE" } = body;

  const forked = await prisma.associationTemplate.create({
    data: {
      name: name?.trim() || `${sourceTemplate.name} (Fork)`,
      description: description?.trim() || sourceTemplate.description,
      category: sourceTemplate.category,
      origin: visibility === "PUBLIC" ? "COMMUNITY" : "PRIVATE",
      visibility,
      targetAudience: sourceTemplate.targetAudience,
      reglementHtml: sourceTemplate.reglementHtml,
      iconEmoji: sourceTemplate.iconEmoji,
      color: sourceTemplate.color,
      creatorId: session.user.id,
      forkedFromId: sourceTemplate.id,
      version: 1,
      activities: {
        create: sourceTemplate.activities.map((act) => ({
          name: act.name,
          description: act.description,
          type: act.type,
          participation: act.participation,
          contributionAmount: act.contributionAmount,
          contributionFrequency: act.contributionFrequency,
          distributionMode: act.distributionMode,
          penaltyLateAmount: act.penaltyLateAmount,
          penaltyLatePercent: act.penaltyLatePercent,
          sortOrder: act.sortOrder,
          isDefaultEnabled: act.isDefaultEnabled,
          docObjective: act.docObjective,
          docImportance: act.docImportance,
          docTips: act.docTips,
          docPitfalls: act.docPitfalls,
        })),
      },
    },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ template: forked }, { status: 201 });
}
