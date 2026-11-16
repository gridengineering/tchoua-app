import { distributeContribution } from "@/lib/distribution-engine";

const tx = {
  assocSessionContribution: { create: jest.fn() },
  assocSanction: { create: jest.fn(), update: jest.fn() },
  activityContribution: { create: jest.fn() },
  associationActivity: { update: jest.fn() },
  assocLoanRepayment: { create: jest.fn() },
  assocLoan: { update: jest.fn() },
  associationMembership: { update: jest.fn() },
};

jest.mock("@/lib/prisma", () => ({
  prisma: {
    associationMembership: { findUnique: jest.fn() },
    activitySubscription: { findMany: jest.fn() },
    assocLoan: { findMany: jest.fn() },
    assocSanction: { findMany: jest.fn() },
    $transaction: jest.fn(async (callback: any) => callback(tx)),
  },
}));

import { prisma } from "@/lib/prisma";

const activity = (id: string, type: string, participation: string, amount: number) => ({
  id, name: id, type, participation, contributionAmount: amount, status: "ACTIVE", associationId: "assoc",
});
const sub = (id: string, act: any, allocationType = "NONE", allocationValue: number | null = null) => ({
  id: `sub-${id}`, activityId: id, activity: act, partsCount: 1, allocationType, allocationValue, status: "ACTIVE",
});

describe("clé de répartition — parcours du membre", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.assocSanction.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.assocLoan.findMany as jest.Mock).mockResolvedValue([]);
  });

  it("ventile 220 000 F : tontine, ration, investissement, solidarité puis prêt résiduel", async () => {
    (prisma.associationMembership.findUnique as jest.Mock).mockResolvedValue({ loanRepaymentMode: "RESIDUAL" });
    (prisma.activitySubscription.findMany as jest.Mock).mockResolvedValue([
      sub("tontine", activity("tontine", "TONTINE_ROTATIVE", "MANDATORY", 100_000)),
      sub("ration", activity("ration", "COLLECTION", "OPTIONAL", 0), "FIXED", 5_000),
      sub("invest", activity("invest", "INVESTISSEMENT", "MANDATORY", 10_000)),
      sub("solidarite", activity("solidarite", "AIDE_SOLIDAIRE", "MANDATORY", 10_000)),
      sub("epargne", activity("epargne", "EPARGNE", "OPTIONAL", 0), "NONE"),
    ]);
    (prisma.assocLoan.findMany as jest.Mock).mockResolvedValue([
      { id: "loan", activityId: "invest", activity: { name: "Prêt" }, totalDue: 95_000, repayments: [] },
    ]);

    const result = await distributeContribution("assoc", "member", 220_000);
    expect(result.success).toBe(true);
    const byName = Object.fromEntries(result.allocations.map((a) => [a.id, a.amountAllocated]));
    expect(byName.tontine).toBe(100_000);
    expect(byName.ration).toBe(5_000);
    expect(byName.invest).toBe(10_000);
    expect(byName.solidarite).toBe(10_000);
    expect(byName.loan).toBe(95_000);
    expect(byName.excess).toBeUndefined();
    expect(result.remainingBalance).toBe(0);
  });

  it("prêt en priorité 1 passe avant la ration quand le solde dû est élevé", async () => {
    (prisma.associationMembership.findUnique as jest.Mock).mockResolvedValue({ loanRepaymentMode: "PRIORITY" });
    (prisma.activitySubscription.findMany as jest.Mock).mockResolvedValue([
      sub("tontine", activity("tontine", "TONTINE_ROTATIVE", "MANDATORY", 100_000)),
      sub("ration", activity("ration", "COLLECTION", "OPTIONAL", 0), "FIXED", 5_000),
      sub("invest", activity("invest", "INVESTISSEMENT", "MANDATORY", 10_000)),
      sub("solidarite", activity("solidarite", "AIDE_SOLIDAIRE", "MANDATORY", 10_000)),
    ]);
    (prisma.assocLoan.findMany as jest.Mock).mockResolvedValue([
      { id: "loan", activityId: "invest", activity: { name: "Prêt" }, totalDue: 200_000, repayments: [] },
    ]);

    const result = await distributeContribution("assoc", "member", 220_000);
    const byName = Object.fromEntries(result.allocations.map((a) => [a.id, a.amountAllocated]));
    expect(byName.loan).toBe(110_000);
    expect(byName.ration).toBe(0);
    expect(result.remainingBalance).toBe(0);
  });

  it("reporte l'excédent sur le solde personnel", async () => {
    (prisma.associationMembership.findUnique as jest.Mock).mockResolvedValue({ loanRepaymentMode: "PRIORITY" });
    (prisma.activitySubscription.findMany as jest.Mock).mockResolvedValue([
      sub("tontine", activity("tontine", "TONTINE_ROTATIVE", "MANDATORY", 10_000)),
    ]);
    const result = await distributeContribution("assoc", "member", 15_000);
    expect(result.remainingBalance).toBe(5_000);
    expect(result.allocations.find((a) => a.type === "EXCESS")?.amountAllocated).toBe(5_000);
  });
});
