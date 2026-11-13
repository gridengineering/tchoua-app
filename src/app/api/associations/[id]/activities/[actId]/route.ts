import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

async function checkActivity(actId: string, associationId: string) {
  return prisma.associationActivity.findFirst({
    where: { id: actId, associationId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, actId } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) {
    const assoc = await prisma.association.findUnique({ where: { id }, select: { isPublic: true } });
    if (!assoc?.isPublic && !isSuperAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const activity = await prisma.associationActivity.findFirst({
    where: { id: actId, associationId: id },
    include: {
      actSessions: {
        orderBy: { sessionNumber: "desc" },
        take: 20,
        include: {
          beneficiaries: {
            include: {
              membership: {
                include: { user: { select: { id: true, name: true, avatar: true } } },
              },
            },
          },
        },
      },
      actContributions: {
        orderBy: { paidAt: "desc" },
        take: 50,
        include: {
          membership: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
      },
      subscriptions: {
        include: {
          membership: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
      },
      _count: { select: { subscriptions: true, actSessions: true, actContributions: true } },
    },
  });

  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  return NextResponse.json({ activity });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, actId } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!hasPermission(session, membership, "MANAGE_ACTIVITIES")) {
    return NextResponse.json({ error: "Permission MANAGE_ACTIVITIES requise" }, { status: 403 });
  }

  const activity = await checkActivity(actId, id);
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  const body = await req.json();
  const {
    name, description, status, conditionMonths, contributionAmount, contributionUnit,
    contributionFrequency, distributionMode, partAmount, maxPartsPerSession,
    beneficiaryAmountPerShare, minShareFraction, maxSharesPerMember,
    maxBeneficiarySharesPerSession, allowPartialShares, allowSameBeneficiaryMultipleShares,
    cycleMode, cycleSessions, cycleStart, cycleEnd, cycleConfig,
    penaltyLateAmount, penaltyLatePercent, penaltyGraceDays, maxRetards,
    loanRate1, loanRate2, loanMaxPerMember, loanApprovalMode, loanMaxActive,
    paymentMethods, natureCatalog, collectionAmount, frequencyConfig, sortOrder,
  } = body;

  const updated = await prisma.associationActivity.update({
    where: { id: actId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(conditionMonths !== undefined && { conditionMonths }),
      ...(contributionAmount !== undefined && { contributionAmount }),
      ...(contributionUnit !== undefined && { contributionUnit }),
      ...(contributionFrequency !== undefined && { contributionFrequency }),
      ...(distributionMode !== undefined && { distributionMode }),
      ...(partAmount !== undefined && { partAmount }),
      ...(maxPartsPerSession !== undefined && { maxPartsPerSession }),
      ...(beneficiaryAmountPerShare !== undefined && { beneficiaryAmountPerShare }),
      ...(minShareFraction !== undefined && { minShareFraction }),
      ...(maxSharesPerMember !== undefined && { maxSharesPerMember }),
      ...(maxBeneficiarySharesPerSession !== undefined && { maxBeneficiarySharesPerSession }),
      ...(allowPartialShares !== undefined && { allowPartialShares }),
      ...(allowSameBeneficiaryMultipleShares !== undefined && { allowSameBeneficiaryMultipleShares }),
      ...(cycleMode !== undefined && { cycleMode }),
      ...(cycleSessions !== undefined && { cycleSessions }),
      ...(cycleStart !== undefined && { cycleStart: cycleStart ? new Date(cycleStart) : null }),
      ...(cycleEnd !== undefined && { cycleEnd: cycleEnd ? new Date(cycleEnd) : null }),
      ...(cycleConfig !== undefined && { cycleConfig: cycleConfig ? JSON.stringify(cycleConfig) : null }),
      ...(penaltyLateAmount !== undefined && { penaltyLateAmount }),
      ...(penaltyLatePercent !== undefined && { penaltyLatePercent }),
      ...(penaltyGraceDays !== undefined && { penaltyGraceDays }),
      ...(maxRetards !== undefined && { maxRetards }),
      ...(loanRate1 !== undefined && { loanRate1 }),
      ...(loanRate2 !== undefined && { loanRate2 }),
      ...(loanMaxPerMember !== undefined && { loanMaxPerMember }),
      ...(loanApprovalMode !== undefined && { loanApprovalMode }),
      ...(loanMaxActive !== undefined && { loanMaxActive }),
      ...(paymentMethods !== undefined && { paymentMethods: JSON.stringify(paymentMethods) }),
      ...(natureCatalog !== undefined && { natureCatalog: natureCatalog ? JSON.stringify(natureCatalog) : null }),
      ...(collectionAmount !== undefined && { collectionAmount }),
      ...(frequencyConfig !== undefined && { frequencyConfig: JSON.stringify(frequencyConfig) }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json({ activity: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, actId } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership || !["PRESIDENT", "FOUNDER"].includes(membership.role)) {
    return NextResponse.json({ error: "Réservé au président ou fondateur" }, { status: 403 });
  }

  const activity = await checkActivity(actId, id);
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  await prisma.associationActivity.delete({ where: { id: actId } });

  return NextResponse.json({ success: true });
}
