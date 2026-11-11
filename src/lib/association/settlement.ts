import { prisma } from "@/lib/prisma";

export type SettlementLine = {
  id: string;
  label: string;
  amount: number;
  date?: string | null;
};

export type SettlementPreview = {
  membershipId: string;
  memberName: string;
  memberNumber: string | null;
  assets: number;
  debtFines: number;
  debtSanctions: number;
  debtLoans: number;
  debtCollation: number;
  totalDebts: number;
  net: number;
  savings: SettlementLine[];
  fines: SettlementLine[];
  sanctions: SettlementLine[];
  loans: SettlementLine[];
  collations: SettlementLine[];
};

const SAVINGS_TYPES = ["EPARGNE", "INVESTISSEMENT", "SAVINGS"];

function round(value: number): number {
  return Math.round(value);
}

/**
 * Modules 7.2 & 7.3 — Compensation de dettes et solde de sortie.
 * Avoirs = capital épargne/investissement effectivement versé.
 * Dettes = amendes impayées + sanctions en attente + encours de prêts + collations impayées.
 */
export async function computeMemberSettlement(
  associationId: string,
  membershipId: string
): Promise<SettlementPreview> {
  const membership = await prisma.associationMembership.findFirst({
    where: { id: membershipId, associationId },
    include: { user: { select: { name: true } } },
  });
  if (!membership) throw new Error("Membre introuvable");

  const [savingsRows, fines, sanctions, loans, collations] = await Promise.all([
    prisma.activityContribution.findMany({
      where: {
        membershipId,
        status: "PAID",
        activity: { associationId, type: { in: SAVINGS_TYPES } },
      },
      include: { activity: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
    }),
    prisma.assocMeetingFine.findMany({
      where: { membershipId, paid: false, meeting: { associationId } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assocSanction.findMany({
      where: { membershipId, status: "PENDING", meeting: { associationId } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assocLoan.findMany({
      where: {
        borrowerMembershipId: membershipId,
        activity: { associationId },
        status: { in: ["ACTIVE", "DEFAULTED"] },
      },
      include: { repayments: { select: { amount: true } }, activity: { select: { name: true } } },
    }),
    prisma.assocMeetingCollation.findMany({
      where: { membershipId, paid: false, meeting: { associationId } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const savings: SettlementLine[] = savingsRows.map((c) => ({
    id: c.id,
    label: c.activity.name,
    amount: round(c.amount),
    date: c.paidAt ? c.paidAt.toISOString() : null,
  }));

  const fineLines: SettlementLine[] = fines.map((f) => ({
    id: f.id,
    label: f.reason,
    amount: round(f.amount),
    date: f.createdAt.toISOString(),
  }));

  const sanctionLines: SettlementLine[] = sanctions.map((s) => ({
    id: s.id,
    label: s.description ?? s.failureType,
    amount: round(s.penaltyAmount),
    date: s.createdAt.toISOString(),
  }));

  const loanLines: SettlementLine[] = loans.map((l) => {
    const repaid = l.repayments.reduce((sum, r) => sum + r.amount, 0);
    return {
      id: l.id,
      label: l.activity.name,
      amount: round(Math.max(0, l.totalDue - repaid)),
      date: l.disbursedAt ? l.disbursedAt.toISOString() : null,
    };
  });

  const collationLines: SettlementLine[] = collations.map((c) => ({
    id: c.id,
    label: "Collation impayée",
    amount: round(c.amount),
    date: c.createdAt.toISOString(),
  }));

  const assets = round(savings.reduce((s, l) => s + l.amount, 0));
  const debtFines = round(fineLines.reduce((s, l) => s + l.amount, 0));
  const debtSanctions = round(sanctionLines.reduce((s, l) => s + l.amount, 0));
  const debtLoans = round(loanLines.reduce((s, l) => s + l.amount, 0));
  const debtCollation = round(collationLines.reduce((s, l) => s + l.amount, 0));
  const totalDebts = debtFines + debtSanctions + debtLoans + debtCollation;

  return {
    membershipId,
    memberName: membership.user?.name ?? "Membre",
    memberNumber: membership.memberNumber,
    assets,
    debtFines,
    debtSanctions,
    debtLoans,
    debtCollation,
    totalDebts,
    net: assets - totalDebts,
    savings,
    fines: fineLines,
    sanctions: sanctionLines,
    loans: loanLines,
    collations: collationLines,
  };
}
