import { prisma } from "@/lib/prisma";

export type SolidarityPreview = {
  year: number;
  totalIn: number;
  totalOut: number;
  balance: number;
  deficit: number;
  membersCount: number;
  perMember: number;
  activities: Array<{ id: string; name: string }>;
  contributionsCount: number;
  aidsCount: number;
};

const SOLIDARITY_TYPES = ["AIDE_SOLIDAIRE", "SOLIDARITY"];

function round(value: number): number {
  return Math.round(value);
}

/**
 * Module 5.1 — Reconstitution annuelle du fonds de solidarité.
 * Bilan de l'exercice : cotisations encaissées - aides décaissées.
 * En cas de déficit, le montant est réparti à parts égales entre les membres actifs.
 */
export async function computeSolidarityPreview(
  associationId: string,
  year: number
): Promise<SolidarityPreview> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const [activities, membersCount] = await Promise.all([
    prisma.associationActivity.findMany({
      where: { associationId, type: { in: SOLIDARITY_TYPES } },
      select: { id: true, name: true },
    }),
    prisma.associationMembership.count({ where: { associationId, status: "ACTIVE" } }),
  ]);

  const activityIds = activities.map((a) => a.id);

  const [contributions, aids] = await Promise.all([
    activityIds.length
      ? prisma.activityContribution.findMany({
          where: {
            activityId: { in: activityIds },
            status: "PAID",
            paidAt: { gte: start, lt: end },
          },
          select: { amount: true },
        })
      : Promise.resolve([]),
    prisma.assocSocialAidRequest.findMany({
      where: {
        associationId,
        status: "PAID",
        paidAt: { gte: start, lt: end },
      },
      select: { approvedAmount: true, requestedAmount: true },
    }),
  ]);

  const totalIn = round(contributions.reduce((s, c) => s + c.amount, 0));
  const totalOut = round(
    aids.reduce((s, a) => s + (a.approvedAmount ?? a.requestedAmount ?? 0), 0)
  );
  const balance = totalIn - totalOut;
  const deficit = Math.max(0, -balance);
  const perMember = deficit > 0 && membersCount > 0 ? Math.ceil(deficit / membersCount) : 0;

  return {
    year,
    totalIn,
    totalOut,
    balance,
    deficit,
    membersCount,
    perMember,
    activities,
    contributionsCount: contributions.length,
    aidsCount: aids.length,
  };
}
