import { prisma } from "@/lib/prisma";

export type DividendSharePreview = {
  membershipId: string;
  memberName: string;
  memberNumber: string | null;
  capital: number;
  interestShare: number;
  eligible: boolean;
  reason?: string;
};

export type DividendPreview = {
  year: number;
  totalInterest: number;
  totalCapital: number;
  eligibleCount: number;
  excludedCount: number;
  shares: DividendSharePreview[];
};

const SAVINGS_TYPES = ["EPARGNE", "INVESTISSEMENT", "SAVINGS"];

function roundFcfa(value: number): number {
  return Math.round(value);
}

/**
 * Répartit des intérêts en unités mineures sans perte d'arrondi.
 * Les centimes restants sont attribués aux plus forts restes, avec un
 * départage stable par identifiant de membre.
 */
export function allocateDividendMinor(
  totalInterestMinor: number,
  capitalByMember: Map<string, number>,
  eligibleMembershipIds: string[]
): Map<string, number> {
  const allocation = new Map<string, number>();
  if (totalInterestMinor <= 0 || eligibleMembershipIds.length === 0) {
    return allocation;
  }

  const totalCapital = eligibleMembershipIds.reduce(
    (sum, id) => sum + Math.max(0, capitalByMember.get(id) ?? 0),
    0
  );
  if (totalCapital <= 0) return allocation;

  const remainders: Array<{ membershipId: string; remainder: number }> = [];
  let allocated = 0;
  for (const membershipId of eligibleMembershipIds) {
    const capital = Math.max(0, capitalByMember.get(membershipId) ?? 0);
    const raw = (totalInterestMinor * capital) / totalCapital;
    const base = Math.floor(raw);
    allocation.set(membershipId, base);
    allocated += base;
    remainders.push({ membershipId, remainder: raw - base });
  }

  let remainder = totalInterestMinor - allocated;
  remainders.sort((a, b) => b.remainder - a.remainder || a.membershipId.localeCompare(b.membershipId));
  for (const entry of remainders) {
    if (remainder <= 0) break;
    allocation.set(entry.membershipId, (allocation.get(entry.membershipId) ?? 0) + 1);
    remainder -= 1;
  }
  return allocation;
}

/**
 * Module 6.5 — Répartition des bénéfices.
 * Quote-part = intérêts encaissés sur l'exercice × (capital du membre / capital total éligible).
 * Les membres ayant un prêt actif ou en défaut sur la période sont exclus du capital
 * disponible (règle NDI) : ils apparaissent avec une quote-part nulle et un motif.
 */
export async function computeDividendPreview(
  associationId: string,
  year: number
): Promise<DividendPreview> {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

  const [memberships, repayments, contributions, borrowingLoans] = await Promise.all([
    prisma.associationMembership.findMany({
      where: { associationId, status: { notIn: ["LEFT", "EXPELLED"] } },
      include: { user: { select: { name: true } } },
    }),
    prisma.assocLoanRepayment.findMany({
      where: {
        paidAt: { gte: start, lt: end },
        loan: { activity: { associationId } },
      },
      select: { amount: true, principal: true, interest: true },
    }),
    prisma.activityContribution.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: start, lt: end },
        activity: { associationId, type: { in: SAVINGS_TYPES } },
      },
      select: { membershipId: true, amount: true },
    }),
    prisma.assocLoan.findMany({
      where: {
        activity: { associationId },
        OR: [
          { status: { in: ["ACTIVE", "DEFAULTED"] } },
          { disbursedAt: { gte: start, lt: end } },
        ],
      },
      select: { borrowerMembershipId: true, status: true },
    }),
  ]);

  const totalInterest = roundFcfa(
    repayments.reduce((sum, r) => {
      if (r.interest != null) return sum + r.interest;
      const principal = r.principal ?? 0;
      return sum + Math.max(0, r.amount - principal);
    }, 0)
  );

  const capitalByMember = new Map<string, number>();
  for (const c of contributions) {
    capitalByMember.set(c.membershipId, (capitalByMember.get(c.membershipId) ?? 0) + c.amount);
  }

  const excluded = new Map<string, string>();
  for (const loan of borrowingLoans) {
    excluded.set(
      loan.borrowerMembershipId,
      loan.status === "DEFAULTED" ? "Prêt en défaut" : "Prêt en cours sur la période"
    );
  }

  const eligibleMembers = memberships.filter((m) => !excluded.has(m.id));
  const totalCapital = roundFcfa(
    eligibleMembers.reduce((sum, m) => sum + (capitalByMember.get(m.id) ?? 0), 0)
  );

  // Répartition en unités mineures (centimes) avec la méthode du plus fort
  // reste : la somme des quotes-parts est exactement égale aux intérêts.
  const totalInterestMinor = Math.round(totalInterest * 100);
  const allocMinor = allocateDividendMinor(
    totalInterestMinor,
    capitalByMember,
    eligibleMembers.map((member) => member.id)
  );

  const shares: DividendSharePreview[] = memberships
    .map((m) => {
      const capital = roundFcfa(capitalByMember.get(m.id) ?? 0);
      const isExcluded = excluded.has(m.id);
      const interestShare = isExcluded ? 0 : (allocMinor.get(m.id) ?? 0) / 100;
      return {
        membershipId: m.id,
        memberName: m.user?.name ?? "Membre",
        memberNumber: m.memberNumber,
        capital,
        interestShare,
        eligible: !isExcluded,
        reason: excluded.get(m.id),
      };
    })
    .sort((a, b) => b.interestShare - a.interestShare);

  return {
    year,
    totalInterest,
    totalCapital,
    eligibleCount: eligibleMembers.length,
    excludedCount: excluded.size,
    shares,
  };
}
