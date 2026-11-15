import type { PrismaClient } from "@prisma/client";

export type SectionConsolidation = {
  associationId: string;
  name: string;
  status: string;
  currency: string;
  activeMembers: number;
  treasuryActivities: number;
  arpFundsBalance: number;
  paidContributions: number;
  pendingArrears: number;
  activeLoansCount: number;
  outstandingLoans: number;
  pendingSocialAids: number;
  meetingsHeld: number;
  pendingSanctions: number;
  healthStatus: "GREEN" | "AMBER" | "RED";
};

export type FederationConsolidatedReport = {
  type: "FEDERATION_CONSOLIDATION";
  generatedAt: string;
  federation: {
    id: string;
    name: string;
    currency: string;
  };
  totals: {
    sectionsCount: number;
    activeMembers: number;
    treasuryActivities: number;
    arpFundsBalance: number;
    paidContributions: number;
    pendingArrears: number;
    activeLoansCount: number;
    outstandingLoans: number;
    pendingSocialAids: number;
    meetingsHeld: number;
    pendingSanctions: number;
    arrearsRatePct: number;
  };
  sections: SectionConsolidation[];
};

/**
 * R3 (Étude ARP) : Consolidation fédérale des sections sans fusionner leurs comptes.
 */
export async function generateFederationReport(
  prisma: PrismaClient,
  federationId: string
): Promise<FederationConsolidatedReport> {
  const [federation, directChildren, childLinks, motherLinks] = await Promise.all([
    prisma.association.findUnique({
      where: { id: federationId },
      select: { id: true, name: true },
    }),
    prisma.association.findMany({
      where: { parentId: federationId },
      select: { id: true },
    }),
    prisma.associationRelation.findMany({
      where: { sourceId: federationId, type: "CHILD", status: "ACTIVE" },
      select: { targetId: true },
    }),
    prisma.associationRelation.findMany({
      where: { targetId: federationId, type: "MOTHER", status: "ACTIVE" },
      select: { sourceId: true },
    }),
  ]);

  if (!federation) {
    throw new Error("FEDERATION_NOT_FOUND");
  }

  const sectionIds = Array.from(
    new Set([
      ...directChildren.map((c) => c.id),
      ...childLinks.map((c) => c.targetId),
      ...motherLinks.map((m) => m.sourceId),
    ])
  ).filter((id) => id !== federationId);

  const sectionsMeta = sectionIds.length
    ? await prisma.association.findMany({
        where: { id: { in: sectionIds } },
        select: { id: true, name: true, status: true },
        orderBy: { name: "asc" },
      })
    : [];

  const sections: SectionConsolidation[] = await Promise.all(
    sectionsMeta.map(async (sec) => {
      const [
        activeMembers,
        activities,
        arpFunds,
        paidContribs,
        pendingContribs,
        activeLoans,
        pendingSocialAids,
        meetingsHeld,
        pendingSanctions,
      ] = await Promise.all([
        prisma.associationMembership.count({
          where: { associationId: sec.id, status: "ACTIVE" },
        }),
        prisma.associationActivity.findMany({
          where: { associationId: sec.id },
          select: { caisseBalance: true },
        }),
        prisma.arpFund.findMany({
          where: { associationId: sec.id, status: "ACTIVE" },
          select: {
            currency: true,
            movements: { select: { direction: true, amountMinor: true } },
          },
        }),
        prisma.activityContribution.aggregate({
          where: { activity: { associationId: sec.id }, status: "PAID" },
          _sum: { amount: true },
        }),
        prisma.activityContribution.aggregate({
          where: { activity: { associationId: sec.id }, status: { in: ["PENDING", "LATE"] } },
          _sum: { amount: true },
        }),
        prisma.assocLoan.findMany({
          where: { activity: { associationId: sec.id }, status: { in: ["ACTIVE", "APPROVED"] } },
          include: { repayments: { select: { amount: true } } },
        }),
        prisma.assocSocialAidRequest.count({
          where: { associationId: sec.id, status: "PENDING" },
        }),
        prisma.assocMeeting.count({
          where: { associationId: sec.id, status: "COMPLETED" },
        }),
        prisma.assocSanction.count({
          where: { meeting: { associationId: sec.id }, status: "PENDING" },
        }),
      ]);

      const treasuryActivities = activities.reduce((s, a) => s + a.caisseBalance, 0);
      const arpFundsBalance = arpFunds.reduce((s, f) => {
        const netMinor = f.movements.reduce(
          (ms, m) => ms + (m.direction === "CREDIT" ? Number(m.amountMinor) : -Number(m.amountMinor)),
          0
        );
        return s + netMinor / 100;
      }, 0);
      const secCurrency = arpFunds[0]?.currency ?? "XAF";
      const paidContributions = paidContribs._sum.amount ?? 0;
      const pendingArrears = pendingContribs._sum.amount ?? 0;
      const outstandingLoans = activeLoans.reduce((s, l) => {
        const repaid = l.repayments.reduce((rs, r) => rs + r.amount, 0);
        return s + Math.max(0, l.totalDue - repaid);
      }, 0);

      const denom = paidContributions + pendingArrears;
      const arrearsRatio = denom > 0 ? pendingArrears / denom : 0;
      let healthStatus: "GREEN" | "AMBER" | "RED" = "GREEN";
      if (sec.status !== "ACTIVE" || arrearsRatio > 0.35 || pendingSanctions > 10) {
        healthStatus = "RED";
      } else if (arrearsRatio > 0.15 || pendingSanctions > 3) {
        healthStatus = "AMBER";
      }

      return {
        associationId: sec.id,
        name: sec.name,
        status: sec.status,
        currency: secCurrency,
        activeMembers,
        treasuryActivities,
        arpFundsBalance,
        paidContributions,
        pendingArrears,
        activeLoansCount: activeLoans.length,
        outstandingLoans,
        pendingSocialAids,
        meetingsHeld,
        pendingSanctions,
        healthStatus,
      };
    })
  );

  const totals = sections.reduce(
    (acc, s) => ({
      sectionsCount: acc.sectionsCount + 1,
      activeMembers: acc.activeMembers + s.activeMembers,
      treasuryActivities: acc.treasuryActivities + s.treasuryActivities,
      arpFundsBalance: acc.arpFundsBalance + s.arpFundsBalance,
      paidContributions: acc.paidContributions + s.paidContributions,
      pendingArrears: acc.pendingArrears + s.pendingArrears,
      activeLoansCount: acc.activeLoansCount + s.activeLoansCount,
      outstandingLoans: acc.outstandingLoans + s.outstandingLoans,
      pendingSocialAids: acc.pendingSocialAids + s.pendingSocialAids,
      meetingsHeld: acc.meetingsHeld + s.meetingsHeld,
      pendingSanctions: acc.pendingSanctions + s.pendingSanctions,
      arrearsRatePct: 0,
    }),
    {
      sectionsCount: 0,
      activeMembers: 0,
      treasuryActivities: 0,
      arpFundsBalance: 0,
      paidContributions: 0,
      pendingArrears: 0,
      activeLoansCount: 0,
      outstandingLoans: 0,
      pendingSocialAids: 0,
      meetingsHeld: 0,
      pendingSanctions: 0,
      arrearsRatePct: 0,
    }
  );

  const totalDue = totals.paidContributions + totals.pendingArrears;
  totals.arrearsRatePct = totalDue > 0 ? Math.round((totals.pendingArrears / totalDue) * 1000) / 10 : 0;

  return {
    type: "FEDERATION_CONSOLIDATION",
    generatedAt: new Date().toISOString(),
    federation: {
      id: federation.id,
      name: federation.name,
      currency: sections[0]?.currency ?? "XAF",
    },
    totals,
    sections,
  };
}

export function federationReportToCsv(report: FederationConsolidatedReport): string {
  const header = [
    "Section",
    "Statut",
    "Devise",
    "Membres actifs",
    "Trésorerie activités",
    "Fonds ARP",
    "Cotisations encaissées",
    "Arriérés",
    "Prêts actifs",
    "Encours prêts",
    "Aides en attente",
    "Réunions tenues",
    "Sanctions en attente",
    "Santé",
  ].join(";");

  const rows = report.sections.map((s) =>
    [
      `"${s.name.replace(/"/g, '""')}"`,
      s.status,
      s.currency,
      s.activeMembers,
      s.treasuryActivities,
      s.arpFundsBalance,
      s.paidContributions,
      s.pendingArrears,
      s.activeLoansCount,
      s.outstandingLoans,
      s.pendingSocialAids,
      s.meetingsHeld,
      s.pendingSanctions,
      s.healthStatus,
    ].join(";")
  );

  return "\uFEFF" + [header, ...rows].join("\r\n");
}
