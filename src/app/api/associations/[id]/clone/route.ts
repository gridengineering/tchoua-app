import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Verify membership
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId: id, status: { not: "LEFT" } },
  });

  if (!membership && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Accès refusé. Réservé aux membres." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const sourceAssociation = await prisma.association.findUnique({
    where: { id },
    include: { activities: true }
  });

  if (!sourceAssociation) {
    return NextResponse.json(
      { error: "Association source introuvable" },
      { status: 404 }
    );
  }

  try {
    const newAssociation = await prisma.$transaction(async (tx) => {
      const cloned = await tx.association.create({
        data: {
          name,
          description: sourceAssociation.description,
          type: sourceAssociation.type,
          isPublic: sourceAssociation.isPublic,
          color: sourceAssociation.color,
          region: sourceAssociation.region,
          templateUsed: sourceAssociation.templateUsed,
          templateId: sourceAssociation.templateId,
          reglementHtml: sourceAssociation.reglementHtml,
          bureauConfig: sourceAssociation.bureauConfig,
          membershipConfig: sourceAssociation.membershipConfig,
          meetingConfig: sourceAssociation.meetingConfig,
          socialAidCaps: sourceAssociation.socialAidCaps,
          sanctionsConfig: sourceAssociation.sanctionsConfig,
          bankConfig: sourceAssociation.bankConfig,
          creatorId: session.user.id,
          status: "DRAFT",
        }
      });

      const newMembership = await tx.associationMembership.create({
        data: {
          userId: session.user.id,
          associationId: cloned.id,
          role: "PRESIDENT",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });

      if (sourceAssociation.activities.length > 0) {
        await tx.associationActivity.createMany({
          data: sourceAssociation.activities.map(act => ({
            associationId: cloned.id,
            name: act.name,
            description: act.description,
            type: act.type,
            status: "ACTIVE",
            participation: act.participation,
            conditionMonths: act.conditionMonths,
            contributionAmount: act.contributionAmount,
            contributionUnit: act.contributionUnit,
            contributionFrequency: act.contributionFrequency,
            distributionMode: act.distributionMode,
            auctionMinBidPct: act.auctionMinBidPct,
            auctionMinBidders: act.auctionMinBidders,
            rotationOrder: act.rotationOrder,
            frequencyConfig: act.frequencyConfig,
            partAmount: act.partAmount,
            maxPartsPerSession: act.maxPartsPerSession,
            caisseBalance: 0,
            caisseLoanRate: act.caisseLoanRate,
            caisseLoanDuration: act.caisseLoanDuration,
            loanRate1: act.loanRate1,
            loanRate2: act.loanRate2,
            loanMaxPerMember: act.loanMaxPerMember,
            loanApprovalMode: act.loanApprovalMode,
            loanMaxActive: act.loanMaxActive,
            penaltyLateAmount: act.penaltyLateAmount,
            penaltyLatePercent: act.penaltyLatePercent,
            penaltyGraceDays: act.penaltyGraceDays,
            maxRetards: act.maxRetards,
            paymentMethods: act.paymentMethods,
            natureCatalog: act.natureCatalog,
            collectionAmount: act.collectionAmount,
            sortOrder: act.sortOrder,
          }))
        });

        const mandatoryActivities = await tx.associationActivity.findMany({
          where: { associationId: cloned.id, participation: "MANDATORY" },
          select: { id: true },
        });

        if (mandatoryActivities.length > 0) {
          await tx.activitySubscription.createMany({
            data: mandatoryActivities.map((act) => ({
              membershipId: newMembership.id,
              activityId: act.id,
              status: "ACTIVE",
              subscribedAt: new Date(),
            })),
          });
        }
      }

      return cloned;
    });

    return NextResponse.json({ association: newAssociation }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ce nom d'association existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Erreur lors du clonage" },
      { status: 400 }
    );
  }
}
