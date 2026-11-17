import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; actId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isPlatformAdmin(session)) return NextResponse.json({ error: "Réservé à l'administration système" }, { status: 403 });

  const { id, actId } = await params;
  const activity = await prisma.associationActivity.findFirst({
    where: { id: actId, associationId: id },
    select: { id: true, name: true, status: true },
  });
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  const counts = await prisma.$transaction(async (tx) => {
    const repayments = await tx.assocLoanRepayment.deleteMany({ where: { loan: { activityId: actId } } });
    const approvals = await tx.assocLoanApproval.deleteMany({ where: { loan: { activityId: actId } } });
    const loans = await tx.assocLoan.deleteMany({ where: { activityId: actId } });
    const beneficiaries = await tx.activityBeneficiary.deleteMany({ where: { session: { activityId: actId } } });
    const contributions = await tx.activityContribution.deleteMany({ where: { activityId: actId } });
    const sessions = await tx.activitySession.deleteMany({ where: { activityId: actId } });
    const subscriptions = await tx.activitySubscription.deleteMany({ where: { activityId: actId } });
    const sanctions = await tx.assocSanction.deleteMany({ where: { activityId: actId } });
    const memberTransactions = await tx.associationMemberTransaction.deleteMany({ where: { activityId: actId } });
    await tx.associationActivity.delete({ where: { id: actId } });
    await tx.associationAuditLog.create({
      data: {
        associationId: id,
        userId: session.user.id,
        action: "ACTIVITY_PURGED",
        entity: "ASSOCIATION_ACTIVITY",
        entityId: actId,
        details: `Suppression definitive de l'activite ${activity.name} (${activity.status}) et de ses dependances`,
      },
    }).catch(() => {});
    return {
      repayments: repayments.count,
      approvals: approvals.count,
      loans: loans.count,
      beneficiaries: beneficiaries.count,
      contributions: contributions.count,
      sessions: sessions.count,
      subscriptions: subscriptions.count,
      sanctions: sanctions.count,
      memberTransactions: memberTransactions.count,
      activity: 1,
    };
  });

  return NextResponse.json({ ok: true, activity: activity.name, deleted: counts });
}
