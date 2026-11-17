import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMeetingBureau } from "@/lib/association/meetings";

function accountAmount(row: any, account: string) {
  if (account === "CASH") return Number(row.cashAmount ?? 0);
  if (account === "MOBILE_MONEY" || row.method === "MOBILE_MONEY") return Number(row.mobileMoneyAmount ?? 0);
  if (account === "BANK" || row.method === "BANK" || row.method === "BANK_TRANSFER") return Number(row.bankTransferAmount ?? 0);
  return Number(row.totalAmount ?? row.amount ?? 0);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId, meetingId } = await params;
  const me = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: { not: "LEFT" } },
    select: { id: true, role: true },
  });
  if (!me) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  const meeting = await prisma.assocMeeting.findFirst({ where: { id: meetingId, associationId } });
  if (!meeting) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const canManage = isMeetingBureau(me.role);
  const search = new URL(req.url).searchParams;
  const requestedMember = search.get("membershipId");
  const membershipFilter = canManage && requestedMember ? requestedMember : me.id;
  const activityId = search.get("activityId");
  const account = (search.get("account") ?? "ALL").toUpperCase();
  const from = meeting.openedAt ?? meeting.scheduledAt;
  const to = meeting.closedAt ?? new Date(from.getTime() + 12 * 60 * 60 * 1000);

  const [sessionContributions, activityContributions, memberTransactions, activities, allMembers] = await Promise.all([
    prisma.assocSessionContribution.findMany({
      where: { meetingId, ...(membershipFilter ? { membershipId: membershipFilter } : {}) },
      include: { membership: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { paidAt: "asc" },
    }),
    prisma.activityContribution.findMany({
      where: {
        activity: { associationId, ...(activityId ? { id: activityId } : {}) },
        paidAt: { gte: from, lte: to },
        ...(membershipFilter ? { membershipId: membershipFilter } : {}),
        ...(account === "CASH" ? { paymentMethod: "CASH" } : {}),
        ...(account === "MOBILE_MONEY" ? { paymentMethod: "MOBILE_MONEY" } : {}),
        ...(account === "BANK" ? { paymentMethod: { in: ["BANK", "BANK_TRANSFER", "VIREMENT"] } } : {}),
      },
      include: { activity: { select: { id: true, name: true } }, membership: { include: { user: { select: { name: true } } } } },
      orderBy: { paidAt: "asc" },
    }),
    prisma.associationMemberTransaction.findMany({
      where: { associationId, sessionId: meetingId, ...(membershipFilter ? { membershipId: membershipFilter } : {}), ...(activityId ? { activityId } : {}) },
      include: { membership: { include: { user: { select: { name: true } } } }, activity: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.associationActivity.findMany({ where: { associationId, ...(activityId ? { id: activityId } : {}) }, select: { id: true, name: true, type: true, caisseBalance: true } }),
    canManage ? prisma.associationMembership.findMany({ where: { associationId, status: { not: "LEFT" } }, select: { id: true, memberNumber: true, user: { select: { name: true, email: true } } }, orderBy: { joinedAt: "asc" } }) : Promise.resolve([]),
  ]);

  const selectedSession = sessionContributions.map((row) => {
    const amount = accountAmount(row, account);
    return { ...row, amount, account };
  }).filter((row) => row.amount > 0);
  const selectedActivity = activityContributions.map((row) => ({ ...row, amount: Number(row.amount), account: row.paymentMethod ?? "CASH" }));
  const selectedLedger = memberTransactions.filter((row) => account === "ALL" || account === "WALLET" ? true : account === "ACTIVITY" ? row.method === "ACTIVITY" : row.method === account);

  const totalSession = selectedSession.reduce((sum, row) => sum + row.amount, 0);
  const totalActivity = selectedActivity.reduce((sum, row) => sum + row.amount, 0);
  const cash = selectedSession.reduce((sum, row) => sum + Number(row.cashAmount ?? 0), 0);
  const mobile = selectedSession.reduce((sum, row) => sum + Number(row.mobileMoneyAmount ?? 0), 0);
  const bank = selectedSession.reduce((sum, row) => sum + Number(row.bankTransferAmount ?? 0), 0);

  return NextResponse.json({
    meeting: {
      id: meeting.id, title: meeting.title, scheduledAt: meeting.scheduledAt, openedAt: meeting.openedAt,
      closedAt: meeting.closedAt, status: meeting.status, modality: meeting.modality, location: meeting.location,
    },
    canManage,
    target: membershipFilter,
    filters: { activityId: activityId || null, account },
    summary: { totalCollected: totalSession + totalActivity, totalSession, totalActivity, cash, mobile, bank, members: new Set(selectedSession.map((r) => r.membershipId)).size },
    contributions: selectedSession,
    activityContributions: selectedActivity,
    memberTransactions: selectedLedger,
    activities,
    members: allMembers,
  });
}
