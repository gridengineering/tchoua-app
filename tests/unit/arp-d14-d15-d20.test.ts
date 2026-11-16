import {
  computeFinancableParts,
  evaluateAuctionBids,
  rankCandidatesByHmac,
} from "@/lib/association/beneficiary-designation";
import {
  allocateLoanRepayment,
  buildRestructuredSchedule,
  calculateCappedPenalty,
  recordPostLossRecovery,
} from "@/lib/association/loan-restructuring";

describe("D14 — Attributions, rotations et tirages (ATT01–ATT04)", () => {
  it("Cas 1 : Pot 650 000, droit 300 000, plafond 2 parts -> 2 parts max et report 50 000", () => {
    const res = computeFinancableParts({
      potAmount: 650_000,
      partAmount: 300_000,
      maxPartsPerSession: 2,
      remainingRights: 3,
    });
    expect(res.ok).toBe(true);
    expect(res.partsAwarded).toBe(2);
    expect(res.grossRight).toBe(600_000);
    expect(res.reliquat).toBe(50_000);
  });

  it("Cas 2 : Pot 250 000, droit fixe 300 000 sans fraction -> aucune attribution payable", () => {
    const res = computeFinancableParts({
      potAmount: 250_000,
      partAmount: 300_000,
      maxPartsPerSession: 1,
      remainingRights: 1,
      allowFractional: false,
    });
    expect(res.ok).toBe(false);
    expect(res.partsAwarded).toBe(0);
    expect(res.grossRight).toBe(0);
    expect(res.reliquat).toBe(250_000);
  });

  it("Cas 3 : Membre avec 0,5 part restante demandant 1 part -> refus de l'excédent", () => {
    const res = computeFinancableParts({
      potAmount: 300_000,
      partAmount: 300_000,
      remainingRights: 0.5,
      requestedParts: 1,
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("EXCESS_PARTS_REQUESTED");
  });

  it("Cas 4 : Tirage HMAC déterministe et vérifiable par seed public", () => {
    const r1 = rankCandidatesByHmac("seed-2026-11", ["m1", "m2", "m3"]);
    const r2 = rankCandidatesByHmac("seed-2026-11", ["m3", "m1", "m2"]);
    expect(r1).toEqual(r2);
    expect(r1).toHaveLength(3);
  });
});

describe("D15 — Enchères, décotes et partage du produit (ENC01–ENC04)", () => {
  it("Cas 1 : Droit 600 000, décote 30 000, sans frais -> net 570 000 et retenue 30 000", () => {
    const res = evaluateAuctionBids({
      grossRight: 600_000,
      minBidPct: 5,
      basis: "GROSS_RIGHT",
      eligibleIds: new Set(["m1", "m2"]),
      bids: [
        { membershipId: "m1", bidAmount: 30_000, receivedAt: "2026-11-15T10:00:00.000Z" },
      ],
    });
    expect(res.ok).toBe(true);
    expect(res.netAmount).toBe(570_000);
    expect(res.retainedDecote).toBe(30_000);
  });

  it("Cas 2 & 3 : 5% sur assiette cotisation (25 000 -> 1 250) vs droit brut (600 000 -> 30 000)", () => {
    const contribBasis = evaluateAuctionBids({
      grossRight: 600_000,
      contributionAmount: 25_000,
      minBidPct: 5,
      basis: "CONTRIBUTION",
      eligibleIds: new Set(["m1"]),
      bids: [{ membershipId: "m1", bidAmount: 1_250 }],
    });
    expect(contribBasis.ok).toBe(true);
    expect(contribBasis.minRequiredBid).toBe(1_250);

    const grossBasis = evaluateAuctionBids({
      grossRight: 600_000,
      contributionAmount: 25_000,
      minBidPct: 5,
      basis: "GROSS_RIGHT",
      eligibleIds: new Set(["m1"]),
      bids: [{ membershipId: "m1", bidAmount: 1_250 }],
    });
    expect(grossBasis.ok).toBe(false);
    expect(grossBasis.minRequiredBid).toBe(30_000);
  });

  it("Cas 4 : Deux offres au même montant -> gagnant tranché par horodatage serveur le plus ancien", () => {
    const res = evaluateAuctionBids({
      grossRight: 600_000,
      minBidPct: 5,
      eligibleIds: new Set(["m1", "m2"]),
      bids: [
        { membershipId: "m2", bidAmount: 40_000, receivedAt: "2026-11-15T10:00:05.000Z" },
        { membershipId: "m1", bidAmount: 40_000, receivedAt: "2026-11-15T10:00:01.000Z" },
      ],
    });
    expect(res.ok).toBe(true);
    expect(res.winner?.membershipId).toBe("m1");
    expect(res.allBids).toHaveLength(2);
  });
});

describe("D20 — Remboursements, retards et restructurations (REC01–REC04)", () => {
  it("Cas 1 : Échéance 43 600, reçu 20 000, intérêts 3 600 -> principal 16 400, reliquat 23 600", () => {
    const res = allocateLoanRepayment({
      dueAmount: 43_600,
      interestDue: 3_600,
      receivedAmount: 20_000,
    });
    expect(res.ok).toBe(true);
    expect(res.interestPaid).toBe(3_600);
    expect(res.principalPaid).toBe(16_400);
    expect(res.remainingDue).toBe(23_600);
  });

  it("Cas 2 : Double affectation d'un même paiement refusée", () => {
    const res = allocateLoanRepayment({
      dueAmount: 23_600,
      interestDue: 0,
      receivedAmount: 20_000,
      alreadyAllocated: 20_000,
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("PAYMENT_ALREADY_ALLOCATED");
  });

  it("Cas 3 : Report de 3 mois -> ancien échéancier, retards et paiements réels conservés", () => {
    const sched = buildRestructuredSchedule({
      previousVersion: 1,
      originalDueDate: "2026-08-01T00:00:00.000Z",
      originalAmount: 100_000,
      paidSoFar: 30_000,
      arrears: 15_000,
      extensionMonths: 3,
      newRate: 4,
    });
    expect(sched.version).toBe(2);
    expect(sched.original.arrears).toBe(15_000);
    expect(sched.original.paidSoFar).toBe(30_000);
    expect(sched.newSchedule.remainingPrincipal).toBe(70_000);
  });

  it("Cas 4 : Pénalité théorique 7 000 plafonnée à 5 000", () => {
    expect(calculateCappedPenalty({ baseAmount: 100_000, ratePct: 7, capAmount: 5_000 })).toBe(5_000);
  });

  it("Cas 5 : Recouvrement après passage en perte tracé explicitement", () => {
    const rec = recordPostLossRecovery({
      loanId: "loan-1",
      writtenOffAmount: 50_000,
      recoveredAmount: 10_000,
      reference: "REC-2026-01",
    });
    expect(rec.type).toBe("POST_LOSS_RECOVERY");
    expect(rec.amount).toBe(10_000);
    expect(rec.remainingWrittenOff).toBe(40_000);
  });
});
