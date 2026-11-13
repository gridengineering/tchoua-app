import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) {
    const assoc = await prisma.association.findUnique({ where: { id }, select: { isPublic: true } });
    if (!assoc?.isPublic) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const activities = await prisma.associationActivity.findMany({
    where: { associationId: id },
    include: {
      _count: { select: { subscriptions: true } },
      ...(membership && {
        subscriptions: {
          where: { membershipId: membership.id },
          select: { id: true, status: true, partsCount: true },
        },
      }),
    },
    orderBy: { sortOrder: "asc" },
  });

  const result = activities.map((act) => ({
    ...act,
    mySubscription: membership ? (act as any).subscriptions?.[0] ?? null : null,
    subscriptions: undefined,
  }));

  return NextResponse.json({ activities: result });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!hasPermission(session, membership, "CREATE_ACTIVITY")) {
    return NextResponse.json({ error: "Permission CREATE_ACTIVITY requise" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name, description, type, status, participation, conditionMonths,
    contributionAmount, contributionUnit, contributionFrequency, distributionMode,
    auctionMinBidPct, auctionMinBidders, rotationOrder, frequencyConfig,
    partAmount, maxPartsPerSession, beneficiaryAmountPerShare, minShareFraction,
    maxSharesPerMember, maxBeneficiarySharesPerSession, allowPartialShares,
    allowSameBeneficiaryMultipleShares, cycleMode, cycleSessions, cycleStart, cycleEnd, cycleConfig,
    caisseBalance, caisseLoanRate, caisseLoanDuration,
    loanRate1, loanRate2, loanMaxPerMember, loanApprovalMode, loanMaxActive,
    penaltyLateAmount, penaltyLatePercent, penaltyGraceDays, maxRetards,
    paymentMethods, natureCatalog, collectionAmount, sortOrder,
  } = body;

  if (!name || !type) return NextResponse.json({ error: "name et type sont requis" }, { status: 400 });

  const activity = await prisma.associationActivity.create({
    data: {
      associationId: id,
      name,
      description,
      type,
      status: status ?? "ACTIVE",
      participation: participation ?? "OPTIONAL",
      conditionMonths,
      contributionAmount,
      contributionUnit,
      contributionFrequency,
      distributionMode,
      auctionMinBidPct,
      auctionMinBidders,
      rotationOrder: rotationOrder ? JSON.stringify(rotationOrder) : null,
      frequencyConfig: frequencyConfig ? JSON.stringify(frequencyConfig) : null,
      partAmount,
      maxPartsPerSession,
      beneficiaryAmountPerShare,
      minShareFraction: minShareFraction ?? 1,
      maxSharesPerMember,
      maxBeneficiarySharesPerSession,
      allowPartialShares: allowPartialShares ?? false,
      allowSameBeneficiaryMultipleShares: allowSameBeneficiaryMultipleShares ?? true,
      cycleMode: cycleMode ?? "FIXED_SESSIONS",
      cycleSessions,
      cycleStart: cycleStart ? new Date(cycleStart) : null,
      cycleEnd: cycleEnd ? new Date(cycleEnd) : null,
      cycleConfig: cycleConfig ? JSON.stringify(cycleConfig) : null,
      caisseBalance: caisseBalance ?? 0,
      caisseLoanRate,
      caisseLoanDuration,
      loanRate1,
      loanRate2,
      loanMaxPerMember,
      loanApprovalMode,
      loanMaxActive,
      penaltyLateAmount,
      penaltyLatePercent,
      penaltyGraceDays,
      maxRetards,
      paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : undefined,
      natureCatalog: natureCatalog ? JSON.stringify(natureCatalog) : null,
      collectionAmount,
      sortOrder: sortOrder ?? 0,
    },
  });

  // Auto-subscribe ACTIVE members if MANDATORY
  if (participation === "MANDATORY") {
    const activeMembers = await prisma.associationMembership.findMany({
      where: { associationId: id, status: "ACTIVE" },
      select: { id: true },
    });

    for (const m of activeMembers) {
      const exists = await prisma.activitySubscription.findFirst({
        where: { membershipId: m.id, activityId: activity.id },
      });
      if (!exists) {
        await prisma.activitySubscription.create({
          data: { membershipId: m.id, activityId: activity.id, status: "ACTIVE", subscribedAt: new Date() },
        });
      }
    }
  }

  return NextResponse.json({ activity }, { status: 201 });
}
