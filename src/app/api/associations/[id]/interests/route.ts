import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allocateInterest, loadCapitalEntries } from "@/lib/association/history";

const BUREAU = ["FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const membership = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: { not: "LEFT" } },
  });
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const isBureau = BUREAU.includes(membership.role);
  let membershipId = sp.get("membershipId") || membership.id;
  if (!isBureau) membershipId = membership.id;

  const from = sp.get("from") ? new Date(sp.get("from") as string) : undefined;
  const to = sp.get("to") ? new Date(sp.get("to") as string) : undefined;
  const groupBy = (sp.get("groupBy") ?? "month").toLowerCase();

  const [capitalEntries, repayments, dividendRun] = await Promise.all([
    loadCapitalEntries(prisma, associationId),
    prisma.assocLoanRepayment.findMany({
      where: { loan: { activity: { associationId } } },
      include: {
        loan: {
          include: {
            activity: { select: { id: true, name: true } },
            borrowerMembership: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { paidAt: "asc" },
    }),
    prisma.associationDividendRun.findFirst({
      where: { associationId, status: "POSTED" },
      include: {
        shares: {
          where: { membershipId },
          include: { membership: { include: { user: { select: { name: true } } } } },
        },
      },
      orderBy: { year: "desc" },
    }),
  ]);

  const rows = repayments
    .filter((r) => (from ? r.paidAt >= from : true))
    .filter((r) => (to ? r.paidAt <= new Date(to.getTime() + 86_400_000 - 1) : true))
    .map((r) => {
      const interestTotal = Number(r.interest ?? Math.max(Number(r.amount) - Number(r.principal ?? 0), 0));
      const date = r.loan.disbursedAt ?? r.loan.createdAt;
      const allocation = allocateInterest(capitalEntries, interestTotal, date);
      const mine = allocation.find((a) => a.membershipId === membershipId);
      return {
        id: r.id,
        date: r.paidAt.toISOString(),
        loanId: r.loanId,
        borrower: r.loan.borrowerMembership.user.name,
        activity: r.loan.activity.name,
        repayment: Number(r.amount),
        interestTotal,
        capital: mine?.capital ?? 0,
        totalCapital: mine?.totalCapital ?? allocation[0]?.totalCapital ?? 0,
        ratio: mine?.ratio ?? 0,
        memberShare: mine?.amount ?? 0,
        allocations: isBureau ? allocation : undefined,
      };
    })
    .filter((r) => r.interestTotal > 0);

  const totals = rows.reduce(
    (acc, r) => {
      acc.interest += r.interestTotal;
      acc.share += r.memberShare;
      return acc;
    },
    { interest: 0, share: 0 }
  );

  const groupsMap = new Map<string, { key: string; label: string; interest: number; share: number; count: number }>();
  for (const r of rows) {
    const key = groupBy === "member" ? r.borrower : r.date.slice(0, 7);
    const label = groupBy === "member" ? r.borrower : new Date(r.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const g = groupsMap.get(key) ?? { key, label, interest: 0, share: 0, count: 0 };
    g.interest += r.interestTotal;
    g.share += r.memberShare;
    g.count += 1;
    groupsMap.set(key, g);
  }

  const member = await prisma.associationMembership.findUnique({
    where: { id: membershipId },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    membershipId,
    memberName: member?.user.name ?? "Membre",
    canViewAll: isBureau,
    totals: { ...totals, dividendInterest: dividendRun?.totalInterest ?? 0, dividendShare: dividendRun?.shares[0]?.interestShare ?? 0, dividendYear: dividendRun?.year ?? null },
    groups: Array.from(groupsMap.values()).sort((a, b) => b.interest - a.interest),
    rows,
  });
}
