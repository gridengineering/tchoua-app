import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateNameSlug,
  validateAssociationName,
  validateMaxAssociationsPerMember,
  validateNotSuspendedInAnyAssociation,
} from "@/lib/association/rules";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all) {
    const associations = await prisma.association.findMany({
      where: { isPublic: true, status: "ACTIVE" },
      include: {
        _count: { select: { memberships: true, activities: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ associations });
  }

  const memberships = await prisma.associationMembership.findMany({
    where: { userId: session.user.id, status: { not: "LEFT" } },
    include: {
      association: {
        include: {
          _count: { select: { memberships: true, activities: true } },
          meetings: {
            where: { scheduledAt: { gte: new Date() }, status: "PLANNED" },
            orderBy: { scheduledAt: "asc" },
            take: 1,
            select: { id: true, title: true, scheduledAt: true, type: true },
          },
        },
      },
    },
  });

  const associations = memberships.map((m) => ({
    ...m.association,
    myRole: m.role,
    myStatus: m.status,
    nextMeeting: m.association.meetings[0] ?? null,
  }));

  return NextResponse.json({ associations });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    description,
    type,
    isPublic,
    color,
    region,
    templateUsed,
    templateId,
    reglementHtml,
    bureauConfig,
    membershipConfig,
    meetingConfig,
    socialAidCaps,
    sanctionsConfig,
    bankConfig,
    activities = [],
  } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "name et type sont requis" }, { status: 400 });
  }

  // R-001 : Unicité du nom / slug
  const nameCheck = await validateAssociationName(name, prisma);
  if (!nameCheck.valid) {
    return NextResponse.json({ error: nameCheck.error, code: "ASSOC_001" }, { status: 409 });
  }

  // R-016 : Max 10 associations actives par membre
  const maxAssocCheck = await validateMaxAssociationsPerMember(session.user.id, prisma);
  if (!maxAssocCheck.valid) {
    return NextResponse.json({ error: maxAssocCheck.error, code: "ASSOC_005" }, { status: 400 });
  }

  // R-018 : Un membre suspendu ne peut pas créer une nouvelle association
  const suspendedCheck = await validateNotSuspendedInAnyAssociation(session.user.id, prisma);
  if (!suspendedCheck.valid) {
    return NextResponse.json({ error: suspendedCheck.error }, { status: 403 });
  }

  const association = await prisma.association.create({
    data: {
      name,
      nameSlug: generateNameSlug(name),
      description,
      type,
      isPublic: isPublic ?? false,
      color,
      region,
      templateUsed,
      templateId: templateId || null,
      reglementHtml,
      bureauConfig: bureauConfig ? JSON.stringify(bureauConfig) : null,
      membershipConfig: membershipConfig ? JSON.stringify(membershipConfig) : null,
      meetingConfig: meetingConfig ? JSON.stringify(meetingConfig) : null,
      socialAidCaps: socialAidCaps ? JSON.stringify(socialAidCaps) : null,
      sanctionsConfig: sanctionsConfig ? JSON.stringify(sanctionsConfig) : null,
      bankConfig: bankConfig ? JSON.stringify(bankConfig) : null,
      creatorId: session.user.id,
      status: "ACTIVE",
      activatedAt: new Date(),
    },
  });

  // Increment template usage count
  if (templateId) {
    await prisma.associationTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    }).catch(() => {}); // silently ignore if template not found
  }

  const membership = await prisma.associationMembership.create({
    data: {
      userId: session.user.id,
      associationId: association.id,
      role: "FOUNDER",
      memberNumber: "M-001",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
  });

  if (activities.length > 0) {
    await prisma.associationActivity.createMany({
      data: activities.map((act: any, idx: number) => ({
        associationId: association.id,
        name: act.name,
        description: act.description,
        type: act.type ?? "TONTINE",
        status: act.status ?? "ACTIVE",
        participation: act.participation ?? "OPTIONAL",
        conditionMonths: act.conditionMonths,
        contributionAmount: act.contributionAmount,
        contributionUnit: act.contributionUnit,
        contributionFrequency: act.contributionFrequency,
        distributionMode: act.distributionMode,
        auctionMinBidPct: act.auctionMinBidPct,
        auctionMinBidders: act.auctionMinBidders,
        rotationOrder: act.rotationOrder ? JSON.stringify(act.rotationOrder) : null,
        frequencyConfig: act.frequencyConfig ? JSON.stringify(act.frequencyConfig) : null,
        partAmount: act.partAmount,
        maxPartsPerSession: act.maxPartsPerSession,
        caisseBalance: act.caisseBalance ?? 0,
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
        paymentMethods: act.paymentMethods ? JSON.stringify(act.paymentMethods) : null,
        natureCatalog: act.natureCatalog ? JSON.stringify(act.natureCatalog) : null,
        collectionAmount: act.collectionAmount,
        sortOrder: act.sortOrder ?? idx,
      })),
    });

    // Auto-subscribe founder to MANDATORY activities
    const mandatoryActivities = await prisma.associationActivity.findMany({
      where: { associationId: association.id, participation: "MANDATORY" },
      select: { id: true },
    });

    if (mandatoryActivities.length > 0) {
      await prisma.activitySubscription.createMany({
        data: mandatoryActivities.map((act) => ({
          membershipId: membership.id,
          activityId: act.id,
          status: "ACTIVE",
          subscribedAt: new Date(),
        })),
      });
    }
  }

  const result = await prisma.association.findUnique({
    where: { id: association.id },
    include: {
      activities: true,
      _count: { select: { memberships: true, activities: true } },
    },
  });

  return NextResponse.json({ id: association.id, association: result }, { status: 201 });
}
