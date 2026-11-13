import type { PrismaClient } from "@prisma/client";

export type CapitalEntry = {
  membershipId: string;
  memberName: string;
  date: Date;
  amount: number;
};

export type InterestAllocation = {
  membershipId: string;
  memberName: string;
  capital: number;
  totalCapital: number;
  ratio: number;
  amount: number;
};

export async function loadCapitalEntries(prisma: PrismaClient, associationId: string): Promise<CapitalEntry[]> {
  const contributions = await prisma.activityContribution.findMany({
    where: { activity: { associationId }, status: "PAID" },
    include: { membership: { include: { user: { select: { name: true } } } } },
    orderBy: { paidAt: "asc" },
  });
  return contributions.map((c) => ({
    membershipId: c.membershipId,
    memberName: c.membership.user.name,
    date: c.paidAt ?? c.createdAt,
    amount: Number(c.amount) || 0,
  }));
}

export function capitalAt(entries: CapitalEntry[], membershipId: string, date: Date): number {
  return entries
    .filter((e) => e.membershipId === membershipId && e.date.getTime() <= date.getTime())
    .reduce((sum, e) => sum + e.amount, 0);
}

export function allocateInterest(entries: CapitalEntry[], totalInterest: number, date: Date): InterestAllocation[] {
  const ids = Array.from(new Set(entries.map((e) => e.membershipId)));
  const rows = ids
    .map((id) => {
      const memberName = entries.find((e) => e.membershipId === id)?.memberName ?? "Membre";
      const capital = capitalAt(entries, id, date);
      return { membershipId: id, memberName, capital };
    })
    .filter((r) => r.capital > 0);

  const totalCapital = rows.reduce((s, r) => s + r.capital, 0);
  if (totalCapital <= 0 || totalInterest <= 0) return [];

  return rows.map((r) => ({
    ...r,
    totalCapital,
    ratio: r.capital / totalCapital,
    amount: Math.round(totalInterest * (r.capital / totalCapital) * 100) / 100,
  }));
}
