import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";
import {
  validateTemplateConversionEligibility,
  anonymizeAssociationForTemplate,
  calculateTemplatePopularityScore,
  API_ERROR_CODES,
} from "@/lib/association/rules";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const eligibility = await validateTemplateConversionEligibility(id, prisma);

  return NextResponse.json({
    eligible: eligibility.valid,
    error: eligibility.error ?? null,
    code: eligibility.valid ? null : API_ERROR_CODES.ASSOC_008.code,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const [membership, association] = await Promise.all([
    prisma.associationMembership.findFirst({
      where: { userId: session.user.id, associationId: id, status: "ACTIVE" },
    }),
    prisma.association.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { sortOrder: "asc" } },
        regulations: { orderBy: { articleNumber: "asc" } },
        customRoles: true,
        approvalWorkflows: true,
      },
    }),
  ]);

  if (!association) {
    return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
  }

  const isAdmin = isSuperAdmin(session);
  if (!isAdmin && (!membership || !["FOUNDER", "PRESIDENT"].includes(membership.role))) {
    return NextResponse.json(
      { error: "Seuls le fondateur ou le président peuvent convertir l'association en modèle" },
      { status: 403 }
    );
  }

  // R-033 : L'association doit être ACTIVE depuis au moins 90 jours
  const eligibility = await validateTemplateConversionEligibility(id, prisma);
  if (!eligibility.valid && !isAdmin) {
    return NextResponse.json(
      {
        error: eligibility.error ?? API_ERROR_CODES.ASSOC_008.message,
        code: API_ERROR_CODES.ASSOC_008.code,
      },
      { status: API_ERROR_CODES.ASSOC_008.httpStatus }
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    name,
    description,
    category,
    visibility = "PUBLIC",
    targetAudience,
    iconEmoji = "🏦",
  } = body;

  // R-029 : Anonymisation stricte des données personnelles et financières
  const anonymized = anonymizeAssociationForTemplate(association);

  const templateOrigin =
    visibility === "PRIVATE"
      ? "PRIVATE"
      : association.parentId
      ? "FEDERATION"
      : "COMMUNITY";

  const initialPopularity = calculateTemplatePopularityScore({
    usageCount: 1,
    activeAssociations: 1,
    ratingAvg: 0,
    ratingCount: 0,
    completionRate: 100,
  });

  const template = await prisma.associationTemplate.create({
    data: {
      name: name?.trim() || `Modèle — ${association.name}`,
      description:
        description?.trim() ||
        association.description ||
        `Modèle issu de l'association ${association.name}`,
      category: category || association.type || "TONTINE",
      origin: templateOrigin,
      visibility: ["PUBLIC", "PRIVATE", "PENDING_REVIEW"].includes(visibility)
        ? visibility
        : "PUBLIC",
      targetAudience: targetAudience ?? null,
      reglementHtml: association.reglementHtml ?? null,
      iconEmoji,
      color: association.color || "#0d3d28",
      creatorId: session.user.id,
      popularityScore: initialPopularity,
      activities: {
        create: association.activities.map((act, idx) => ({
          name: act.name,
          description: act.description ?? null,
          type: act.type,
          participation: act.participation ?? "MANDATORY",
          contributionAmount: act.contributionAmount ?? null,
          contributionFrequency: act.contributionFrequency ?? "MONTHLY",
          distributionMode: act.distributionMode ?? "ROTATION",
          penaltyLateAmount: act.penaltyLateAmount ?? null,
          penaltyLatePercent: act.penaltyLatePercent ?? null,
          sortOrder: act.sortOrder ?? idx,
          isDefaultEnabled: true,
        })),
      },
    },
    include: {
      activities: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (prisma.associationAuditLog?.create) {
    await prisma.associationAuditLog
      .create({
        data: {
          associationId: id,
          userId: session.user.id,
          action: "CONVERT_TO_TEMPLATE",
          entity: "TEMPLATE",
          entityId: template.id,
          details: `Conversion en modèle (${template.visibility}) : ${template.name}`,
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(
    {
      template,
      anonymizedSnapshot: anonymized,
      // R-027 : +10 points de réputation pour un template communautaire public
      reputationPointsEarned: template.visibility === "PUBLIC" ? 10 : 0,
    },
    { status: 201 }
  );
}
