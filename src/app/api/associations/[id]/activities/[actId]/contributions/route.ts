import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAssociationEligibility, eligibilityJson } from "@/lib/association/eligibility";

const TREASURER_ROLES = ["PRESIDENT", "FOUNDER", "TREASURER"];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
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

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const membershipId = searchParams.get("membershipId");
  const status = searchParams.get("status");

  const contributions = await prisma.activityContribution.findMany({
    where: {
      activityId: actId,
      ...(sessionId && { sessionId }),
      ...(membershipId && { membershipId }),
      ...(status && { status }),
    },
    include: {
      membership: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      session: { select: { id: true, sessionNumber: true, scheduledAt: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json({ contributions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, actId } = await params;

  const callerMembership = await getMembership(session.user.id, id);
  if (!callerMembership || !TREASURER_ROLES.includes(callerMembership.role)) {
    return NextResponse.json({ error: "Réservé au trésorier ou président" }, { status: 403 });
  }

  const activity = await prisma.associationActivity.findFirst({
    where: { id: actId, associationId: id },
  });
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  const body = await req.json();
  const { membershipId, amount, paymentMethod, reference, sessionId, paidAt, unit, notes } = body;

  if (!membershipId || !amount) {
    return NextResponse.json({ error: "membershipId et amount sont requis" }, { status: 400 });
  }

  const targetMembership = await prisma.associationMembership.findFirst({
    where: { id: membershipId, associationId: id },
  });
  if (!targetMembership) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const eligibility = await checkAssociationEligibility(targetMembership.userId, id, {
    amount: Number(amount),
  });
  if (!eligibility.ok) {
    return NextResponse.json(eligibilityJson(eligibility), { status: 403 });
  }

  const contribution = await prisma.activityContribution.create({
    data: {
      activityId: actId,
      membershipId,
      amount,
      unit: unit ?? activity.contributionUnit ?? "CASH",
      status: "PAID",
      paymentMethod,
      reference,
      sessionId,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes,
    },
    include: {
      membership: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });

  // Update caisse balance if applicable
  if (activity.type === "CAISSE") {
    await prisma.associationActivity.update({
      where: { id: actId },
      data: { caisseBalance: { increment: amount } },
    });
  }

  return NextResponse.json({ contribution }, { status: 201 });
}
