import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; actId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId, actId } = await params;
  const membership = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: { not: "LEFT" } },
  });
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const activity = await prisma.associationActivity.findFirst({
    where: { id: actId, associationId },
    include: {
      actSessions: { orderBy: { sessionNumber: "asc" } },
      actContributions: { include: { membership: { include: { user: { select: { name: true } } } } } },
      subscriptions: { include: { membership: { include: { user: { select: { name: true } } } } } },
    },
  });
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  const sessions = activity.actSessions;
  const beneficiaries = await prisma.activityBeneficiary.findMany({
    where: { session: { activityId: actId } },
    include: { membership: { include: { user: { select: { name: true } } } }, session: true },
    orderBy: { createdAt: "asc" },
  });

  const cycleStart = activity.cycleStart ?? sessions[0]?.scheduledAt ?? activity.createdAt;
  const cycleEnd = activity.cycleEnd ?? null;

  const contributions = activity.actContributions.filter((c) => c.status === "PAID" || c.status === "LATE");
  const totalContributions = contributions.reduce((s, c) => s + Number(c.amount), 0);
  const totalDistributed = beneficiaries.reduce((s, b) => s + Number(b.amount), 0);

  const memberMap = new Map<string, { membershipId: string; name: string; contributed: number; received: number; parts: number; receivedParts: number }>();
  const ensure = (id: string, name: string) => {
    const row = memberMap.get(id) ?? { membershipId: id, name, contributed: 0, received: 0, parts: 0, receivedParts: 0 };
    memberMap.set(id, row);
    return row;
  };
  for (const sub of activity.subscriptions) ensure(sub.membershipId, sub.membership.user.name).parts += Number(sub.partsCount ?? 1);
  for (const c of contributions) ensure(c.membershipId, c.membership.user.name).contributed += Number(c.amount);
  for (const b of beneficiaries) {
    const row = ensure(b.membershipId, b.membership.user.name);
    row.received += Number(b.amount);
    row.receivedParts += Number(b.partsCount ?? 1);
  }

  const totalParts = activity.subscriptions.reduce((s, sub) => s + Number(sub.partsCount ?? 1), 0);
  const distributedParts = beneficiaries.reduce((s, b) => s + Number(b.partsCount ?? 1), 0);
  const plannedSessions = activity.cycleSessions ?? (activity.cycleMode === "FIXED_SESSIONS" ? sessions.length : null);
  const heldSessions = sessions.filter((s) => s.status === "HELD").length;

  const sessionHistory = sessions.map((s) => {
    const sc = contributions.filter((c) => c.sessionId === s.id).reduce((sum, c) => sum + Number(c.amount), 0);
    const sb = beneficiaries.filter((b) => b.sessionId === s.id).reduce((sum, b) => sum + Number(b.amount), 0);
    return {
      id: s.id, number: s.sessionNumber, date: s.scheduledAt.toISOString(), status: s.status,
      contributions: sc, distributions: sb, balance: sc - sb, pot: Number(s.potAmount ?? 0),
    };
  });

  const progress = activity.cycleMode === "FIXED_SESSIONS" && plannedSessions
    ? Math.min(100, Math.round((heldSessions / plannedSessions) * 100))
    : totalParts > 0 ? Math.min(100, Math.round((distributedParts / totalParts) * 100)) : 0;

  return NextResponse.json({
    activity: {
      id: activity.id, name: activity.name, type: activity.type, distributionMode: activity.distributionMode,
      partAmount: activity.partAmount, contributionAmount: activity.contributionAmount,
      beneficiaryAmountPerShare: activity.beneficiaryAmountPerShare,
      maxPartsPerSession: activity.maxPartsPerSession, minShareFraction: activity.minShareFraction,
      allowPartialShares: activity.allowPartialShares,
      allowSameBeneficiaryMultipleShares: activity.allowSameBeneficiaryMultipleShares,
      maxBeneficiarySharesPerSession: activity.maxBeneficiarySharesPerSession,
      cycleMode: activity.cycleMode, cycleSessions: activity.cycleSessions,
      cycleStart: cycleStart.toISOString(), cycleEnd: cycleEnd?.toISOString() ?? null,
    },
    summary: {
      totalContributions, totalDistributed, balance: totalContributions - totalDistributed,
      totalParts, distributedParts, remainingParts: Math.max(totalParts - distributedParts, 0),
      plannedSessions, heldSessions, progress,
    },
    members: Array.from(memberMap.values()).map((m) => ({ ...m, net: m.contributed - m.received })),
    sessions: sessionHistory,
    beneficiaries: beneficiaries.map((b) => ({
      id: b.id, member: b.membership.user.name, membershipId: b.membershipId,
      session: b.session.sessionNumber, parts: b.partsCount, amount: Number(b.amount),
      date: (b.paidAt ?? b.session.heldAt ?? b.session.scheduledAt).toISOString(),
    })),
  });
}
