import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAssociationEligibility, eligibilityJson } from "@/lib/association/eligibility";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, actId } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Vous n'êtes pas membre de cette association" }, { status: 403 });

  const activity = await prisma.associationActivity.findFirst({
    where: { id: actId, associationId: id },
  });
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  if (activity.participation === "MANDATORY") {
    return NextResponse.json({ error: "L'adhésion à cette activité est automatique" }, { status: 400 });
  }

  const eligibility = await checkAssociationEligibility(session.user.id, id, {
    amount: activity.contributionAmount ?? undefined,
  });
  if (!eligibility.ok) {
    return NextResponse.json(eligibilityJson(eligibility), { status: 403 });
  }

  const existing = await prisma.activitySubscription.findFirst({
    where: { membershipId: membership.id, activityId: actId },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return NextResponse.json({ error: "Déjà abonné à cette activité" }, { status: 409 });
    }
    const sub = await prisma.activitySubscription.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", cancelledAt: null },
    });
    return NextResponse.json({ subscription: sub });
  }

  const body = await req.json().catch(() => ({}));
  const partsCount = body.partsCount ?? 1;

  const subscription = await prisma.activitySubscription.create({
    data: {
      membershipId: membership.id,
      activityId: actId,
      status: "ACTIVE",
      partsCount,
      subscribedAt: new Date(),
    },
  });

  return NextResponse.json({ subscription }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, actId } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Vous n'êtes pas membre de cette association" }, { status: 403 });

  const activity = await prisma.associationActivity.findFirst({
    where: { id: actId, associationId: id },
  });
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  if (activity.participation === "MANDATORY") {
    return NextResponse.json({ error: "Impossible de se désabonner d'une activité obligatoire" }, { status: 400 });
  }

  const existing = await prisma.activitySubscription.findFirst({
    where: { membershipId: membership.id, activityId: actId, status: "ACTIVE" },
  });

  if (!existing) return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });

  await prisma.activitySubscription.update({
    where: { id: existing.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
