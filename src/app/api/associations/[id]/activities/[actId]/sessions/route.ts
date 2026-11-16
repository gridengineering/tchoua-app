import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { rankCandidatesByHmac } from "@/lib/association/beneficiary-designation";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
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
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const sessions = await prisma.activitySession.findMany({
    where: { activityId: actId },
    include: {
      beneficiaries: {
        include: {
          membership: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
      },
      _count: { select: { contributions: true } },
    },
    orderBy: { sessionNumber: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(
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

  const activity = await prisma.associationActivity.findFirst({
    where: { id: actId, associationId: id },
  });
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  const body = await req.json();
  const { scheduledAt, notes, potAmount, drawMethod } = body;

  if (!scheduledAt) return NextResponse.json({ error: "scheduledAt est requis" }, { status: 400 });

  const lastSession = await prisma.activitySession.findFirst({
    where: { activityId: actId },
    orderBy: { sessionNumber: "desc" },
    select: { sessionNumber: true },
  });
  const sessionNumber = (lastSession?.sessionNumber ?? 0) + 1;

  let drawResult: string | null = null;

  // Lottery draw if applicable
  if (drawMethod === "LOTTERY_MONTHLY" || activity.distributionMode === "LOTTERY") {
    // Find subscribers who haven't benefited yet
    const pastBeneficiaryIds = await prisma.activityBeneficiary.findMany({
      where: { session: { activityId: actId } },
      select: { membershipId: true },
    });
    const excludedIds = new Set(pastBeneficiaryIds.map((b) => b.membershipId));

    const eligibleSubs = await prisma.activitySubscription.findMany({
      where: {
        activityId: actId,
        status: "ACTIVE",
        membershipId: { notIn: [...excludedIds] },
      },
      include: { membership: { include: { user: { select: { id: true, name: true } } } } },
    });

    if (eligibleSubs.length > 0) {
      const seed = `${actId}:${sessionNumber}:${randomBytes(16).toString("hex")}`;
      const ranks = rankCandidatesByHmac(seed, eligibleSubs.map((s) => s.membershipId));
      const winner = eligibleSubs.find((s) => s.membershipId === ranks[0].membershipId) ?? eligibleSubs[0];
      drawResult = JSON.stringify({
        algorithm: "HMAC_SHA256",
        seed,
        ranks,
        membershipId: winner.membershipId,
        userName: winner.membership.user.name,
      });
    }
  }

  const actSession = await prisma.activitySession.create({
    data: {
      activityId: actId,
      sessionNumber,
      scheduledAt: new Date(scheduledAt),
      status: "PLANNED",
      potAmount,
      distributed: 0,
      drawMethod: drawMethod ?? activity.distributionMode,
      drawResult,
      notes,
    },
  });

  return NextResponse.json({ session: actSession }, { status: 201 });
}
