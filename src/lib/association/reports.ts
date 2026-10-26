import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  startOfDay,
  startOfMonth,
  getDay,
} from "date-fns";

export function computeReportChecksum(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toDateFilter(parameters?: any) {
  const filter: any = {};
  if (parameters?.startDate) filter.gte = new Date(parameters.startDate);
  if (parameters?.endDate) filter.lte = new Date(parameters.endDate);
  return Object.keys(filter).length ? filter : undefined;
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return null;
  const date = new Date(d);
  return date.toISOString();
}

function safeSum(arr: { amount?: number | null }[]) {
  return arr.reduce((s, x) => s + (x.amount ?? 0), 0);
}

// ─── Report Generators ─────────────────────────────────────────────────────

async function generateActivityReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const where: any = { associationId };
  if (parameters?.activityId) where.id = parameters.activityId;

  const activities = await prisma.associationActivity.findMany({
    where,
    include: {
      subscriptions: { select: { id: true, status: true } },
      actSessions: { include: { beneficiaries: true } },
      actContributions: true,
      loans: true,
    },
  });

  const rows = activities.map((act) => {
    const activeSubs = act.subscriptions.filter((s) => s.status === "ACTIVE").length;
    const sessionCount = act.actSessions.length;
    const paidContribs = act.actContributions.filter((c) => c.status === "PAID");
    const totalCollected = paidContribs.reduce((s, c) => s + c.amount, 0);
    const totalDefaults = act.actContributions.filter((c) =>
      ["LATE", "ABSENT"].includes(c.status)
    ).length;
    const totalBeneficiaries = act.actSessions.reduce((sum, s) => sum + (s.beneficiaries?.length ?? 0), 0);
    const expectedPayments = activeSubs * Math.max(sessionCount, 1);
    const participationRate =
      expectedPayments > 0 ? (paidContribs.length / expectedPayments) * 100 : 0;

    return {
      activityId: act.id,
      activityName: act.name,
      type: act.type,
      status: act.status,
      participation: act.participation,
      activeSubscriptions: activeSubs,
      sessionCount,
      contributionCount: paidContribs.length,
      totalCollected,
      totalDefaults,
      totalBeneficiaries,
      participationRate: Math.round(participationRate * 10) / 10,
      caisseBalance: act.caisseBalance,
    };
  });

  return {
    type: "ACTIVITY",
    associationId,
    generatedAt: new Date().toISOString(),
    activities: rows,
    grandTotal: rows.reduce((s, r) => s + r.totalCollected, 0),
    totalBeneficiaries: rows.reduce((s, r) => s + r.totalBeneficiaries, 0),
    totalDefaults: rows.reduce((s, r) => s + r.totalDefaults, 0),
  };
}

async function generateMemberReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const membershipWhere: any = { associationId, status: { not: "LEFT" } };
  if (parameters?.membershipId) membershipWhere.id = parameters.membershipId;

  const memberships = await prisma.associationMembership.findMany({
    where: membershipWhere,
    include: {
      user: { select: { name: true, email: true } },
      contributions: {
        include: { activity: { select: { name: true, type: true } } },
      },
      beneficiaries: {
        include: {
          session: { include: { activity: { select: { name: true } } } },
        },
      },
      loans: { include: { repayments: true, activity: { select: { name: true } } } },
      activitySubs: {
        include: { activity: { select: { name: true, type: true } } },
      },
    },
  });

  const rows = memberships.map((m) => {
    const totalContributed = m.contributions.reduce((s, c) => s + c.amount, 0);
    const totalReceived = m.beneficiaries.reduce((s, b) => s + b.amount, 0);
    const totalLoaned = m.loans.reduce((s, l) => s + l.amount, 0);
    const totalRepaid = m.loans
      .flatMap((l) => l.repayments)
      .reduce((s, r) => s + r.amount, 0);
    const activeLoans = m.loans.filter((l) => l.status === "ACTIVE").length;

    return {
      membershipId: m.id,
      memberNumber: m.memberNumber,
      name: m.user.name || m.user.email,
      role: m.role,
      status: m.status,
      reliabilityScore: m.reliabilityScore,
      joinedAt: fmtDate(m.joinedAt),
      totalContributed,
      totalReceived,
      totalLoaned,
      totalRepaid,
      activeLoans,
      loanBalance: Math.max(0, totalLoaned - totalRepaid),
      netBalance: totalReceived - totalContributed,
      activities: m.activitySubs.map((sub) => ({
        activityName: sub.activity.name,
        type: sub.activity.type,
        partsCount: sub.partsCount,
        status: sub.status,
      })),
    };
  });

  return {
    type: "MEMBER",
    associationId,
    generatedAt: new Date().toISOString(),
    members: rows,
    summary: {
      count: rows.length,
      totalContributed: rows.reduce((s, r) => s + r.totalContributed, 0),
      totalReceived: rows.reduce((s, r) => s + r.totalReceived, 0),
      totalLoaned: rows.reduce((s, r) => s + r.totalLoaned, 0),
      totalRepaid: rows.reduce((s, r) => s + r.totalRepaid, 0),
    },
  };
}

async function generateFinancialReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const dateFilter = toDateFilter(parameters);

  const [contributions, repayments, fines, aids, loansDisbursed, benefits] =
    await Promise.all([
      prisma.activityContribution.findMany({
        where: {
          activity: { associationId },
          status: "PAID",
          ...(dateFilter && { paidAt: dateFilter }),
        },
        select: { amount: true, paidAt: true, unit: true },
      }),
      prisma.assocLoanRepayment.findMany({
        where: {
          loan: { activity: { associationId } },
          ...(dateFilter && { paidAt: dateFilter }),
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.assocMeetingFine.findMany({
        where: {
          meeting: { associationId },
          paid: true,
          ...(dateFilter && { paidAt: dateFilter }),
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.assocSocialAidRequest.findMany({
        where: {
          associationId,
          status: "PAID",
          ...(dateFilter && { paidAt: dateFilter }),
        },
        select: { approvedAmount: true, paidAt: true },
      }),
      prisma.assocLoan.findMany({
        where: {
          activity: { associationId },
          status: { in: ["APPROVED", "ACTIVE", "REPAID", "DEFAULTED"] },
          ...(dateFilter && { disbursedAt: dateFilter }),
        },
        select: { amount: true, disbursedAt: true },
      }),
      prisma.activityBeneficiary.findMany({
        where: {
          session: { activity: { associationId } },
          ...(dateFilter && { paidAt: dateFilter }),
        },
        select: { amount: true, paidAt: true },
      }),
    ]);

  const totalIn =
    safeSum(contributions) +
    safeSum(repayments) +
    safeSum(fines);
  const totalOut =
    safeSum(aids.map((a) => ({ amount: a.approvedAmount }))) +
    safeSum(loansDisbursed) +
    safeSum(benefits);

  return {
    type: "FINANCIAL",
    associationId,
    generatedAt: new Date().toISOString(),
    period: dateFilter ? { start: parameters.startDate, end: parameters.endDate } : null,
    entries: {
      contributions: safeSum(contributions),
      loanRepayments: safeSum(repayments),
      fines: safeSum(fines),
      total: totalIn,
    },
    exits: {
      socialAids: safeSum(aids.map((a) => ({ amount: a.approvedAmount }))),
      loansDisbursed: safeSum(loansDisbursed),
      benefitsDistributed: safeSum(benefits),
      total: totalOut,
    },
    balance: totalIn - totalOut,
  };
}

async function generateBilanReport(
  associationId: string,
  prisma: PrismaClient
) {
  const activities = await prisma.associationActivity.findMany({
    where: { associationId },
    select: { caisseBalance: true },
  });
  const treasury = activities.reduce((s, a) => s + a.caisseBalance, 0);

  const pendingContributions = await prisma.activityContribution.findMany({
    where: { activity: { associationId }, status: "PENDING" },
    select: { amount: true },
  });
  const receivablesContrib = pendingContributions.reduce((s, c) => s + c.amount, 0);

  const activeLoans = await prisma.assocLoan.findMany({
    where: {
      activity: { associationId },
      status: { in: ["ACTIVE", "APPROVED"] },
    },
    include: { repayments: true },
  });
  const receivablesLoans = activeLoans.reduce((s, l) => {
    const repaid = l.repayments.reduce((rs, r) => rs + r.amount, 0);
    return s + Math.max(0, l.totalDue - repaid);
  }, 0);

  const approvedAids = await prisma.assocSocialAidRequest.findMany({
    where: { associationId, status: "APPROVED" },
    select: { approvedAmount: true },
  });
  const debtsAids = approvedAids.reduce((s, a) => s + (a.approvedAmount ?? 0), 0);

  const allTimeIn = await prisma.activityContribution.findMany({
    where: { activity: { associationId }, status: "PAID" },
    select: { amount: true },
  });
  const allTimeOut = await prisma.activityBeneficiary.findMany({
    where: { session: { activity: { associationId } } },
    select: { amount: true },
  });
  const capital =
    allTimeIn.reduce((s, c) => s + c.amount, 0) -
    allTimeOut.reduce((s, b) => s + b.amount, 0);

  return {
    type: "BILAN",
    associationId,
    generatedAt: new Date().toISOString(),
    actif: {
      immobilisations: 0,
      creancesMembres: receivablesLoans + receivablesContrib,
      tresorerie: treasury,
      total: treasury + receivablesLoans + receivablesContrib,
    },
    passif: {
      capitauxPropres: Math.max(0, capital),
      dettes: debtsAids,
      resultatExercice: 0,
      total: Math.max(0, capital) + debtsAids,
    },
    note: "Bilan comptable simplifié. Les immobilisations ne sont pas suivies dans ce modèle.",
  };
}

async function generateCompteResultatReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const dateFilter = toDateFilter(parameters);

  const [contributions, loanRepayments, fines, aids, benefits, defaultedLoans] =
    await Promise.all([
      prisma.activityContribution.findMany({
        where: { activity: { associationId }, status: "PAID", ...(dateFilter && { paidAt: dateFilter }) },
        select: { amount: true },
      }),
      prisma.assocLoanRepayment.findMany({
        where: { loan: { activity: { associationId } }, ...(dateFilter && { paidAt: dateFilter }) },
        select: { interest: true },
      }),
      prisma.assocMeetingFine.findMany({
        where: { meeting: { associationId }, paid: true, ...(dateFilter && { paidAt: dateFilter }) },
        select: { amount: true },
      }),
      prisma.assocSocialAidRequest.findMany({
        where: { associationId, status: "PAID", ...(dateFilter && { paidAt: dateFilter }) },
        select: { approvedAmount: true },
      }),
      prisma.activityBeneficiary.findMany({
        where: { session: { activity: { associationId } }, ...(dateFilter && { paidAt: dateFilter }) },
        select: { amount: true },
      }),
      prisma.assocLoan.findMany({
        where: {
          activity: { associationId },
          status: "DEFAULTED",
        },
        include: { repayments: true },
      }),
    ]);

  const recettes =
    safeSum(contributions) +
    safeSum(loanRepayments.map((r) => ({ amount: r.interest }))) +
    safeSum(fines);

  const pertesLoans = defaultedLoans.reduce((s, l) => {
    const repaid = l.repayments.reduce((rs, r) => rs + r.amount, 0);
    return s + Math.max(0, l.totalDue - repaid);
  }, 0);

  const depenses =
    safeSum(aids.map((a) => ({ amount: a.approvedAmount }))) +
    safeSum(benefits) +
    pertesLoans;

  return {
    type: "COMPTE_RESULTAT",
    associationId,
    generatedAt: new Date().toISOString(),
    period: dateFilter ? { start: parameters.startDate, end: parameters.endDate } : null,
    recettes: {
      cotisations: safeSum(contributions),
      interetsPrets: safeSum(loanRepayments.map((r) => ({ amount: r.interest }))),
      amendes: safeSum(fines),
      total: recettes,
    },
    depenses: {
      aidesSociales: safeSum(aids.map((a) => ({ amount: a.approvedAmount }))),
      beneficesDistribues: safeSum(benefits),
      pertesPrets: pertesLoans,
      total: depenses,
    },
    resultat: recettes - depenses,
  };
}

async function generateTresorerieReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const dateFilter = toDateFilter(parameters);

  const [contributions, repayments, fines, aids, loansDisbursed, benefits] =
    await Promise.all([
      prisma.activityContribution.findMany({
        where: { activity: { associationId }, status: "PAID", ...(dateFilter && { paidAt: dateFilter }) },
        select: { amount: true, paidAt: true },
      }),
      prisma.assocLoanRepayment.findMany({
        where: { loan: { activity: { associationId } }, ...(dateFilter && { paidAt: dateFilter }) },
        select: { amount: true, paidAt: true },
      }),
      prisma.assocMeetingFine.findMany({
        where: { meeting: { associationId }, paid: true, ...(dateFilter && { paidAt: dateFilter }) },
        select: { amount: true, paidAt: true },
      }),
      prisma.assocSocialAidRequest.findMany({
        where: { associationId, status: "PAID", ...(dateFilter && { paidAt: dateFilter }) },
        select: { approvedAmount: true, paidAt: true },
      }),
      prisma.assocLoan.findMany({
        where: {
          activity: { associationId },
          status: { in: ["APPROVED", "ACTIVE", "REPAID", "DEFAULTED"] },
          ...(dateFilter && { disbursedAt: dateFilter }),
        },
        select: { amount: true, disbursedAt: true },
      }),
      prisma.activityBeneficiary.findMany({
        where: { session: { activity: { associationId } }, ...(dateFilter && { paidAt: dateFilter }) },
        select: { amount: true, paidAt: true },
      }),
    ]);

  function groupByMonth(items: { paidAt: Date | null; amount: number }[]) {
    const map = new Map<string, number>();
    for (const item of items) {
      if (!item.paidAt) continue;
      const key = item.paidAt.toISOString().slice(0, 7); // YYYY-MM
      map.set(key, (map.get(key) ?? 0) + item.amount);
    }
    return Array.from(map.entries()).map(([month, amount]) => ({ month, amount }));
  }

  const entries = groupByMonth([
    ...contributions.map((c) => ({ paidAt: c.paidAt, amount: c.amount })),
    ...repayments.map((c) => ({ paidAt: c.paidAt, amount: c.amount })),
    ...fines.map((c) => ({ paidAt: c.paidAt, amount: c.amount })),
  ]);

  const exits = groupByMonth([
    ...aids.map((c) => ({ paidAt: c.paidAt, amount: c.approvedAmount ?? 0 })),
    ...loansDisbursed.map((c) => ({ paidAt: c.disbursedAt, amount: c.amount })),
    ...benefits.map((c) => ({ paidAt: c.paidAt, amount: c.amount })),
  ]);

  const allMonths = Array.from(new Set([...entries.map((e) => e.month), ...exits.map((e) => e.month)])).sort();

  const flux = allMonths.map((month) => {
    const en = entries.find((e) => e.month === month)?.amount ?? 0;
    const ex = exits.find((e) => e.month === month)?.amount ?? 0;
    return { month, entries: en, exits: ex, net: en - ex };
  });

  const totalEntries = entries.reduce((s, e) => s + e.amount, 0);
  const totalExits = exits.reduce((s, e) => s + e.amount, 0);

  return {
    type: "TRESORERIE",
    associationId,
    generatedAt: new Date().toISOString(),
    period: dateFilter ? { start: parameters.startDate, end: parameters.endDate } : null,
    flux,
    totalEntries,
    totalExits,
    netFlux: totalEntries - totalExits,
  };
}

async function generateOhadaReport(
  associationId: string,
  prisma: PrismaClient
) {
  const activities = await prisma.associationActivity.findMany({
    where: { associationId },
    select: { caisseBalance: true },
  });
  const treasury = activities.reduce((s, a) => s + a.caisseBalance, 0);

  const pendingContribs = await prisma.activityContribution.findMany({
    where: { activity: { associationId }, status: "PENDING" },
    select: { amount: true },
  });
  const creances = pendingContribs.reduce((s, c) => s + c.amount, 0);

  const activeLoans = await prisma.assocLoan.findMany({
    where: { activity: { associationId }, status: { in: ["ACTIVE", "APPROVED"] } },
    include: { repayments: true },
  });
  const creancesLoans = activeLoans.reduce((s, l) => {
    const repaid = l.repayments.reduce((rs, r) => rs + r.amount, 0);
    return s + Math.max(0, l.totalDue - repaid);
  }, 0);

  const approvedAids = await prisma.assocSocialAidRequest.findMany({
    where: { associationId, status: "APPROVED" },
    select: { approvedAmount: true },
  });
  const dettes = approvedAids.reduce((s, a) => s + (a.approvedAmount ?? 0), 0);

  const allContribs = await prisma.activityContribution.findMany({
    where: { activity: { associationId }, status: "PAID" },
    select: { amount: true },
  });
  const allBenefits = await prisma.activityBeneficiary.findMany({
    where: { session: { activity: { associationId } } },
    select: { amount: true },
  });
  const ca = allContribs.reduce((s, c) => s + c.amount, 0);
  const charges = allBenefits.reduce((s, b) => s + b.amount, 0);
  const resultat = ca - charges;

  return {
    type: "OHADA_SYSCOHADA",
    associationId,
    generatedAt: new Date().toISOString(),
    conformite: "Structure minimale OHADA / SYSCOHADA",
    bilan: {
      actifNonCourant: 0,
      actifCourant: {
        creancesClients: creances + creancesLoans,
        tresorerie: treasury,
      },
      totalActif: treasury + creances + creancesLoans,
      capitauxPropres: Math.max(0, resultat),
      passifNonCourant: 0,
      passifCourant: {
        dettesFournisseurs: dettes,
        autresDettes: 0,
      },
      totalPassif: Math.max(0, resultat) + dettes,
    },
    compteResultat: {
      chiffreAffaires: ca,
      chargesExploitation: charges,
      resultatExploitation: resultat,
      resultatNet: resultat,
    },
  };
}

async function generateCrossReport(
  associationId: string,
  prisma: PrismaClient
) {
  const activities = await prisma.associationActivity.findMany({
    where: { associationId },
    include: {
      actContributions: true,
      loans: { include: { repayments: true } },
      actSessions: { include: { beneficiaries: true } },
    },
  });

  const rows = activities.map((act) => {
    const totalCollected = act.actContributions
      .filter((c) => c.status === "PAID")
      .reduce((s, c) => s + c.amount, 0);
    const totalBenefits = act.actSessions.reduce((sum, s) => sum + s.beneficiaries.reduce((sb, b) => sb + b.amount, 0), 0);
    const totalLoans = act.loans.reduce((s, l) => s + l.amount, 0);
    const totalRepaid = act.loans
      .flatMap((l) => l.repayments)
      .reduce((s, r) => s + r.amount, 0);

    return {
      activityId: act.id,
      activityName: act.name,
      type: act.type,
      totalCollected,
      totalBenefits,
      totalLoans,
      totalRepaid,
      caisseBalance: act.caisseBalance,
      sessionCount: act.actSessions.length,
    };
  });

  return {
    type: "CROSS",
    associationId,
    generatedAt: new Date().toISOString(),
    activities: rows,
    summary: {
      totalCollected: rows.reduce((s, r) => s + r.totalCollected, 0),
      totalBenefits: rows.reduce((s, r) => s + r.totalBenefits, 0),
      totalLoans: rows.reduce((s, r) => s + r.totalLoans, 0),
      totalRepaid: rows.reduce((s, r) => s + r.totalRepaid, 0),
      globalCaisse: rows.reduce((s, r) => s + r.caisseBalance, 0),
    },
  };
}

async function generateInvestmentReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const activityTypes = ["INVESTISSEMENT", "PRET"];
  if (parameters?.activityId) {
    // single activity override
  }

  const activities = await prisma.associationActivity.findMany({
    where: { associationId, type: { in: activityTypes } },
    select: { id: true, type: true },
  });
  const investActIds = activities.filter((a) => a.type === "INVESTISSEMENT").map((a) => a.id);
  const loanActIds = activities.filter((a) => a.type === "PRET").map((a) => a.id);

  const targetIds = parameters?.activityId
    ? [parameters.activityId]
    : investActIds.length
    ? investActIds
    : loanActIds;

  const [capitalContribs, loans, members] = await Promise.all([
    prisma.activityContribution.findMany({
      where: { activityId: { in: targetIds }, status: "PAID" },
      select: { membershipId: true, amount: true, paidAt: true },
    }),
    prisma.assocLoan.findMany({
      where: { activityId: { in: loanActIds.length ? loanActIds : targetIds } },
      include: {
        repayments: true,
        borrowerMembership: {
          select: {
            id: true,
            memberNumber: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { disbursedAt: "asc" },
    }),
    prisma.associationMembership.findMany({
      where: { associationId, status: "ACTIVE" },
      select: {
        id: true,
        memberNumber: true,
        joinedAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const capitalTotal = capitalContribs.reduce((s, c) => s + c.amount, 0);
  const pretCumule = loans.reduce((s, l) => s + l.amount, 0);
  const pretEnCours = loans
    .filter((l) => l.status === "ACTIVE" || l.status === "APPROVED")
    .reduce((s, l) => s + l.amount, 0);
  const allRepayments = loans.flatMap((l) => l.repayments);
  const remboursementsRecus = allRepayments.reduce((s, r) => s + r.amount, 0);
  const interetsGeneres = allRepayments.reduce((s, r) => s + (r.interest ?? 0), 0);
  const soldeDisponible = capitalTotal + remboursementsRecus - pretCumule;

  const capitalByMembership: Record<string, number> = {};
  for (const c of capitalContribs) {
    capitalByMembership[c.membershipId] = (capitalByMembership[c.membershipId] ?? 0) + c.amount;
  }

  // SPECIFICATION.md §6.5 : Exclusion du partage des intérêts pour les membres ayant emprunté durant la période
  const borrowerMembershipIds = new Set(
    loans
      .filter((l) => ["APPROVED", "ACTIVE", "REPAID", "DEFAULTED", "OVERDUE"].includes(l.status))
      .map((l) => l.borrowerMembership.id)
  );

  const eligibleCapitalTotal = members.reduce((sum, m) => {
    if (borrowerMembershipIds.has(m.id)) return sum;
    return sum + (capitalByMembership[m.id] ?? 0);
  }, 0);

  const effectiveDividendCapital = eligibleCapitalTotal > 0 ? eligibleCapitalTotal : capitalTotal;

  const memberRows = members
    .map((m) => {
      const versement = capitalByMembership[m.id] ?? 0;
      const excludedFromDividends = borrowerMembershipIds.has(m.id) && eligibleCapitalTotal > 0;
      const part = capitalTotal > 0 ? versement / capitalTotal : 0;
      const dividendShare =
        excludedFromDividends || effectiveDividendCapital <= 0
          ? 0
          : versement / effectiveDividendCapital;
      const gainInteret = interetsGeneres * dividendShare;
      return {
        membershipId: m.id,
        memberNumber: m.memberNumber,
        name: m.user.name || m.user.email,
        joinedAt: fmtDate(m.joinedAt),
        versementInitial: versement,
        excludedFromDividends,
        gainInteret: Math.round(gainInteret * 100) / 100,
        capitalCumule: Math.round((versement + gainInteret) * 100) / 100,
        partPct: Math.round(part * 10000) / 100,
      };
    })
    .sort((a, b) => b.versementInitial - a.versementInitial);

  const loanRows = loans.map((l) => {
    const repaid = l.repayments.reduce((s, r) => s + r.amount, 0);
    return {
      id: l.id,
      member: l.borrowerMembership.user.name || l.borrowerMembership.user.email,
      amount: l.amount,
      rate: l.interestRate,
      duration: l.duration,
      disbursedAt: fmtDate(l.disbursedAt),
      dueDate: fmtDate(l.dueDate),
      interest: Math.max(0, l.totalDue - l.amount),
      totalDue: l.totalDue,
      repaid,
      encours: Math.max(0, l.totalDue - repaid),
      status: l.status,
    };
  });

  return {
    type: "INVESTMENT",
    associationId,
    generatedAt: new Date().toISOString(),
    dashboard: {
      capitalTotal,
      eligibleCapitalTotal,
      pretEnCours,
      pretCumule,
      remboursementsRecus,
      interetsGeneres,
      soldeDisponible,
    },
    members: memberRows,
    loans: loanRows,
  };
}

// ─── §12.1 : Rapport de Solidarité (SOLIDARITY) ────────────────────────────
async function generateSolidarityReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const dateFilter = toDateFilter(parameters);

  const [solidarityActivities, aidRequests] = await Promise.all([
    prisma.associationActivity.findMany({
      where: { associationId, type: "SOLIDARITE" },
      include: { actContributions: { where: { status: "PAID" } } },
    }),
    prisma.assocSocialAidRequest.findMany({
      where: {
        associationId,
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        membership: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCollected = solidarityActivities.reduce(
    (s, a) => s + a.actContributions.reduce((sc, c) => sc + c.amount, 0),
    0
  );
  const caisseBalance = solidarityActivities.reduce((s, a) => s + a.caisseBalance, 0);
  const paidAids = aidRequests.filter((r) => r.status === "PAID" || r.status === "APPROVED");
  const totalDisbursed = paidAids.reduce(
    (s, r) => s + (r.approvedAmount ?? r.requestedAmount ?? 0),
    0
  );

  return {
    type: "SOLIDARITY",
    associationId,
    generatedAt: new Date().toISOString(),
    summary: {
      totalCollected,
      totalDisbursed,
      caisseBalance,
      requestCount: aidRequests.length,
      approvedCount: paidAids.length,
    },
    requests: aidRequests.map((r) => ({
      id: r.id,
      member: r.membership.user.name || r.membership.user.email,
      category: r.category,
      requestedAmount: r.requestedAmount,
      approvedAmount: r.approvedAmount,
      status: r.status,
      createdAt: fmtDate(r.createdAt),
      paidAt: fmtDate(r.paidAt),
    })),
  };
}

// ─── §12.1 : Rapport de Prêts (LOANS) ──────────────────────────────────────
async function generateLoansReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const dateFilter = toDateFilter(parameters);
  const loans = await prisma.assocLoan.findMany({
    where: {
      activity: { associationId },
      ...(dateFilter && { createdAt: dateFilter }),
    },
    include: {
      repayments: true,
      activity: { select: { name: true } },
      borrowerMembership: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = loans.map((l) => {
    const repaid = l.repayments.reduce((s, r) => s + r.amount, 0);
    const interestPaid = l.repayments.reduce((s, r) => s + (r.interest ?? 0), 0);
    return {
      loanId: l.id,
      activityName: l.activity.name,
      borrower: l.borrowerMembership.user.name || l.borrowerMembership.user.email,
      amount: l.amount,
      interestRate: l.interestRate,
      totalDue: l.totalDue,
      repaid,
      interestPaid,
      remainingDue: Math.max(0, l.totalDue - repaid),
      status: l.status,
      dueDate: fmtDate(l.dueDate),
    };
  });

  const totalLoaned = rows.reduce((s, r) => s + r.amount, 0);
  const totalRepaid = rows.reduce((s, r) => s + r.repaid, 0);
  const totalDue = rows.reduce((s, r) => s + r.totalDue, 0);

  return {
    type: "LOANS",
    associationId,
    generatedAt: new Date().toISOString(),
    summary: {
      count: rows.length,
      totalLoaned,
      totalRepaid,
      totalRemaining: rows.reduce((s, r) => s + r.remainingDue, 0),
      recoveryRatePct: totalDue > 0 ? Math.round((totalRepaid / totalDue) * 1000) / 10 : 100,
    },
    loans: rows,
  };
}

// ─── §12.1 : Rapport de Présence (ATTENDANCE) ──────────────────────────────
async function generateAttendanceReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const dateFilter = toDateFilter(parameters);
  const meetings = await prisma.assocMeeting.findMany({
    where: {
      associationId,
      ...(dateFilter && { scheduledAt: dateFilter }),
    },
    include: {
      attendances: {
        include: {
          membership: { include: { user: { select: { name: true, email: true } } } },
        },
      },
      fines: true,
    },
    orderBy: { scheduledAt: "desc" },
  });

  const memberStatsMap = new Map<
    string,
    {
      membershipId: string;
      name: string;
      present: number;
      late: number;
      excused: number;
      absent: number;
      totalFines: number;
    }
  >();

  for (const mtg of meetings) {
    for (const att of mtg.attendances) {
      const current = memberStatsMap.get(att.membershipId) ?? {
        membershipId: att.membershipId,
        name: att.membership.user.name || att.membership.user.email,
        present: 0,
        late: 0,
        excused: 0,
        absent: 0,
        totalFines: 0,
      };
      if (att.status === "PRESENT") current.present += 1;
      else if (att.status === "LATE") current.late += 1;
      else if (att.status === "EXCUSED") current.excused += 1;
      else current.absent += 1;
      memberStatsMap.set(att.membershipId, current);
    }
    for (const fine of mtg.fines) {
      const current = memberStatsMap.get(fine.membershipId);
      if (current) {
        current.totalFines += fine.amount;
      }
    }
  }

  const totalMeetings = meetings.length;
  const members = Array.from(memberStatsMap.values()).map((m) => ({
    ...m,
    attendanceRatePct:
      totalMeetings > 0
        ? Math.round(((m.present + m.late) / totalMeetings) * 1000) / 10
        : 100,
  }));

  return {
    type: "ATTENDANCE",
    associationId,
    generatedAt: new Date().toISOString(),
    totalMeetings,
    members,
  };
}

// ─── §12.1 & R-038 : Rapport d'Audit (AUDIT) ───────────────────────────────
async function generateAuditReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const dateFilter = toDateFilter(parameters);
  const logs = await prisma.associationAuditLog.findMany({
    where: {
      associationId,
      ...(dateFilter && { createdAt: dateFilter }),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return {
    type: "AUDIT",
    associationId,
    generatedAt: new Date().toISOString(),
    totalEntries: logs.length,
    logs: logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details,
      createdAt: fmtDate(l.createdAt),
    })),
  };
}

// ─── §12.1 & R-042 : Attestation de Cotisation avec QR/Hash (ATTESTATION) ─
async function generateContributionAttestation(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { id: true, name: true },
  });

  const membershipWhere: any = { associationId };
  if (parameters?.membershipId) membershipWhere.id = parameters.membershipId;

  const membership = await prisma.associationMembership.findFirst({
    where: membershipWhere,
    include: {
      user: { select: { name: true, email: true } },
      contributions: { where: { status: "PAID" } },
    },
  });

  const totalPaid = membership
    ? membership.contributions.reduce((s, c) => s + c.amount, 0)
    : 0;
  const generatedAt = new Date().toISOString();
  const verificationHash = computeReportChecksum({
    associationId,
    membershipId: membership?.id ?? null,
    totalPaid,
    generatedAt,
  });

  return {
    type: "ATTESTATION",
    associationId,
    associationName: association?.name ?? "",
    currency: "XAF",
    generatedAt,
    member: membership
      ? {
          membershipId: membership.id,
          memberNumber: membership.memberNumber,
          name: membership.user.name || membership.user.email,
          status: membership.status,
          totalPaid,
          contributionsCount: membership.contributions.length,
        }
      : null,
    verificationHash,
    qrCodePayload: `TCHOUA-ATTESTATION:${associationId}:${membership?.id ?? "ALL"}:${verificationHash.slice(0, 16)}`,
  };
}

// ─── §12.1 & R-041 : Rapport Consolidé Multi-Associations (CONSOLIDATED) ──
async function generateConsolidatedReport(
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  const relations = await prisma.associationRelation.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { sourceId: associationId, type: "MOTHER" },
        { targetId: associationId, type: "CHILD" },
      ],
    },
  });

  const childIds = Array.from(
    new Set(
      relations.map((r) => (r.sourceId === associationId ? r.targetId : r.sourceId))
    )
  );
  const allAssociationIds = [associationId, ...childIds];

  const associations = await prisma.association.findMany({
    where: { id: { in: allAssociationIds } },
    include: {
      activities: { select: { caisseBalance: true } },
      _count: { select: { memberships: true, activities: true } },
    },
  });

  const breakdown = await Promise.all(
    associations.map(async (assoc) => {
      const fin = await generateFinancialReport(assoc.id, parameters, prisma);
      const caisseTotal = assoc.activities.reduce((s, a) => s + a.caisseBalance, 0);
      return {
        associationId: assoc.id,
        name: assoc.name,
        roleInHierarchy: assoc.id === associationId ? "MOTHER" : "CHILD",
        memberCount: assoc._count.memberships,
        activityCount: assoc._count.activities,
        caisseTotal,
        entriesTotal: fin.entries.total,
        exitsTotal: fin.exits.total,
        netBalance: fin.balance,
      };
    })
  );

  return {
    type: "CONSOLIDATED",
    associationId,
    generatedAt: new Date().toISOString(),
    childCount: childIds.length,
    associations: breakdown,
    consolidatedTotals: {
      totalMembers: breakdown.reduce((s, b) => s + b.memberCount, 0),
      totalActivities: breakdown.reduce((s, b) => s + b.activityCount, 0),
      totalCaisse: breakdown.reduce((s, b) => s + b.caisseTotal, 0),
      totalEntries: breakdown.reduce((s, b) => s + b.entriesTotal, 0),
      totalExits: breakdown.reduce((s, b) => s + b.exitsTotal, 0),
      totalNetBalance: breakdown.reduce((s, b) => s + b.netBalance, 0),
    },
  };
}

async function generateCustomReport(
  _associationId: string,
  parameters: any,
  _prisma: PrismaClient
) {
  return {
    type: "CUSTOM",
    generatedAt: new Date().toISOString(),
    parameters,
    data: null,
    note: "Rapport personnalisé. Les données doivent être définies via les paramètres ou un traitement externe.",
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function generateReportData(
  type: string,
  associationId: string,
  parameters: any,
  prisma: PrismaClient
) {
  let rawReport: Record<string, any>;
  switch (type) {
    case "ACTIVITY":
      rawReport = await generateActivityReport(associationId, parameters, prisma);
      break;
    case "MEMBER":
      rawReport = await generateMemberReport(associationId, parameters, prisma);
      break;
    case "FINANCIAL":
      rawReport = await generateFinancialReport(associationId, parameters, prisma);
      break;
    case "BILAN":
      rawReport = await generateBilanReport(associationId, prisma);
      break;
    case "COMPTE_RESULTAT":
      rawReport = await generateCompteResultatReport(associationId, parameters, prisma);
      break;
    case "TRESORERIE":
      rawReport = await generateTresorerieReport(associationId, parameters, prisma);
      break;
    case "OHADA_SYSCOHADA":
      rawReport = await generateOhadaReport(associationId, prisma);
      break;
    case "CROSS":
      rawReport = await generateCrossReport(associationId, prisma);
      break;
    case "INVESTMENT":
      rawReport = await generateInvestmentReport(associationId, parameters, prisma);
      break;
    case "SOLIDARITY":
      rawReport = await generateSolidarityReport(associationId, parameters, prisma);
      break;
    case "LOANS":
      rawReport = await generateLoansReport(associationId, parameters, prisma);
      break;
    case "ATTENDANCE":
      rawReport = await generateAttendanceReport(associationId, parameters, prisma);
      break;
    case "AUDIT":
      rawReport = await generateAuditReport(associationId, parameters, prisma);
      break;
    case "ATTESTATION":
      rawReport = await generateContributionAttestation(associationId, parameters, prisma);
      break;
    case "CONSOLIDATED":
      rawReport = await generateConsolidatedReport(associationId, parameters, prisma);
      break;
    case "CUSTOM":
      rawReport = await generateCustomReport(associationId, parameters, prisma);
      break;
    default:
      throw new Error(`Type de rapport non supporté: ${type}`);
  }

  // R-039 : Hash d'intégrité SHA-256 pour chaque rapport généré
  const checksum = computeReportChecksum(rawReport);
  return {
    ...rawReport,
    checksum,
  };
}

export function scheduleNextRun(schedule: {
  frequency: string;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  hour?: number | null;
  nextRunAt?: Date | null;
}): Date {
  const base = schedule.nextRunAt ? new Date(schedule.nextRunAt) : new Date();
  const h = schedule.hour ?? 8;
  let next = setHours(setMinutes(setSeconds(setMilliseconds(base, 0), 0), 0), h);

  switch (schedule.frequency) {
    case "DAILY":
      next = addDays(next, 1);
      break;
    case "WEEKLY": {
      const targetDay = schedule.dayOfWeek ?? 1; // Monday default
      next = addWeeks(next, 1);
      const currentDay = getDay(next);
      const diff = targetDay - currentDay;
      next = addDays(next, diff);
      break;
    }
    case "MONTHLY": {
      const targetDom = schedule.dayOfMonth ?? 1;
      next = addMonths(next, 1);
      next.setDate(Math.min(targetDom, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      break;
    }
    case "QUARTERLY": {
      const targetDomQ = schedule.dayOfMonth ?? 1;
      next = addQuarters(next, 1);
      next.setDate(Math.min(targetDomQ, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      break;
    }
    case "YEARLY": {
      next = addYears(next, 1);
      break;
    }
    default:
      next = addDays(next, 1);
  }

  return next;
}

export function exportToCSV(data: any): string {
  if (!data) return "";
  const rows: any[] = Array.isArray(data) ? data : data.activities ?? data.members ?? data.flux ?? [data];
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          // Escape quotes and wrap in quotes if contains semicolon or quote
          if (str.includes(";") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(";")
    ),
  ];
  return "\uFEFF" + lines.join("\n"); // BOM for Excel
}

export function exportToExcel(data: any): Buffer {
  // No xlsx library installed; return a JSON buffer as fallback
  return Buffer.from(JSON.stringify(data, null, 2), "utf-8");
}
