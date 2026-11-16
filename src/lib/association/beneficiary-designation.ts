import { createHash, createHmac, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export type AuctionBidInput = {
  membershipId: string;
  bidAmount: number;
  receivedAt?: string;
};

export type DesignationCandidate = {
  membershipId: string;
  userId: string;
  name: string;
  partsCount: number;
  remainingRights: number;
  eligible: boolean;
  reasons: string[];
  score: number;
};

export type DesignationOutput = {
  sessionId: string;
  activityId: string;
  mode: string;
  finalized: boolean;
  potAmount: number;
  partsAwarded: number;
  grossRight: number;
  netDistributed: number;
  winningBid: number;
  reliquat: number;
  payoutStatus: "TO_PAY" | "PAID" | "CANCELLED";
  winner: {
    membershipId: string;
    userId: string;
    name: string;
    partsCount: number;
  };
  proof: {
    algorithm: string;
    seed?: string;
    ranks?: Array<{ membershipId: string; rank: string }>;
    timestamp: string;
    hash: string;
    candidateCount: number;
  };
  candidates: DesignationCandidate[];
};

/**
 * ATT01 : Calcule les parts finançables et le report (reliquat).
 * Refuse une demande excédant les droits restants (ex: 0,5 part restante vs 1 part demandée).
 */
export function computeFinancableParts(params: {
  potAmount: number;
  partAmount: number;
  maxPartsPerSession?: number;
  remainingRights: number;
  requestedParts?: number;
  allowFractional?: boolean;
}): {
  ok: boolean;
  error?: string;
  partsAwarded: number;
  grossRight: number;
  reliquat: number;
} {
  const {
    potAmount,
    partAmount,
    maxPartsPerSession = Infinity,
    remainingRights,
    requestedParts,
    allowFractional = false,
  } = params;

  if (requestedParts !== undefined && requestedParts > remainingRights) {
    return {
      ok: false,
      error: "EXCESS_PARTS_REQUESTED",
      partsAwarded: 0,
      grossRight: 0,
      reliquat: potAmount,
    };
  }

  if (partAmount <= 0) {
    return { ok: true, partsAwarded: 1, grossRight: potAmount, reliquat: 0 };
  }

  const financableByPot = allowFractional
    ? potAmount / partAmount
    : Math.floor(potAmount / partAmount);
  const effectiveRights = allowFractional ? remainingRights : Math.floor(remainingRights);
  const partsAwarded = Math.max(0, Math.min(maxPartsPerSession, financableByPot, effectiveRights));

  if (partsAwarded <= 0) {
    return {
      ok: false,
      error: "INSUFFICIENT_POT",
      partsAwarded: 0,
      grossRight: 0,
      reliquat: potAmount,
    };
  }

  const grossRight = Math.round(partsAwarded * partAmount);
  const reliquat = Math.max(0, potAmount - grossRight);
  return { ok: true, partsAwarded, grossRight, reliquat };
}

/**
 * ATT03 : Tirage vérifiable et rejouable par HMAC-SHA256(seed, membershipId).
 * Le plus petit rang l'emporte.
 */
export function rankCandidatesByHmac(
  seed: string,
  candidateIds: string[]
): Array<{ membershipId: string; rank: string }> {
  return [...candidateIds]
    .map((membershipId) => ({
      membershipId,
      rank: createHmac("sha256", seed).update(membershipId).digest("hex"),
    }))
    .sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0));
}

/**
 * ENC01–ENC04 : Évalue les offres d'enchères horodatées serveur.
 * - Minimum = max(minBidAbs, pct * assiette) où assiette = cotisation OU droit brut
 * - Égalité tranchée par horodatage serveur le plus ancien
 * - Conserve toutes les offres perdantes (ENC04)
 * - La décote reste dans la trésorerie sans double encaissement (ENC02)
 */
export function evaluateAuctionBids(params: {
  grossRight: number;
  contributionAmount?: number;
  minBidPct?: number;
  minBidAbs?: number;
  basis?: "CONTRIBUTION" | "GROSS_RIGHT";
  fees?: number;
  minBidders?: number;
  eligibleIds: Set<string>;
  bids: AuctionBidInput[];
}): {
  ok: boolean;
  error?: string;
  minRequiredBid: number;
  winner?: { membershipId: string; bidAmount: number; receivedAt: string };
  netAmount: number;
  retainedDecote: number;
  validBids: Array<{ membershipId: string; bidAmount: number; receivedAt: string }>;
  allBids: Array<{ membershipId: string; bidAmount: number; receivedAt: string; valid: boolean }>;
} {
  const {
    grossRight,
    contributionAmount = 0,
    minBidPct = 0,
    minBidAbs = 0,
    basis = "GROSS_RIGHT",
    fees = 0,
    minBidders = 1,
    eligibleIds,
    bids,
  } = params;

  const basisAmount = basis === "CONTRIBUTION" && contributionAmount > 0 ? contributionAmount : grossRight;
  const minRequiredBid = Math.max(minBidAbs, Math.round((basisAmount * minBidPct) / 100));

  const nowMs = Date.now();
  const normalized = bids.map((b, idx) => {
    const receivedAt = b.receivedAt ?? new Date(nowMs + idx).toISOString();
    const valid =
      eligibleIds.has(b.membershipId) &&
      Number.isFinite(b.bidAmount) &&
      b.bidAmount >= minRequiredBid;
    return { membershipId: b.membershipId, bidAmount: b.bidAmount, receivedAt, valid };
  });

  const validBids = normalized
    .filter((b) => b.valid)
    .sort((a, b) => {
      if (b.bidAmount !== a.bidAmount) return b.bidAmount - a.bidAmount;
      return a.receivedAt.localeCompare(b.receivedAt);
    });

  if (validBids.length < minBidders) {
    return {
      ok: false,
      error: `AUCTION_MIN_BIDDERS:${minBidders}`,
      minRequiredBid,
      netAmount: 0,
      retainedDecote: 0,
      validBids,
      allBids: normalized,
    };
  }

  const top = validBids[0];
  const netAmount = Math.max(0, grossRight - top.bidAmount - fees);
  return {
    ok: true,
    minRequiredBid,
    winner: top,
    netAmount,
    retainedDecote: top.bidAmount,
    validBids,
    allBids: normalized,
  };
}

function parseRotationOrder(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Moteur serveur de désignation automatique des bénéficiaires (D14 / D15 - Étude ARP).
 */
export async function designateSessionBeneficiary(
  prisma: PrismaClient,
  params: {
    associationId: string;
    activityId: string;
    sessionId: string;
    actorUserId: string;
    modeOverride?: string;
    bids?: AuctionBidInput[];
    requirePaidContribution?: boolean;
    allowCycleWrap?: boolean;
    maxPartsPerSession?: number;
    fees?: number;
    finalize?: boolean;
    payoutConfirmed?: boolean;
  }
): Promise<DesignationOutput> {
  const {
    associationId,
    activityId,
    sessionId,
    actorUserId,
    modeOverride,
    bids = [],
    requirePaidContribution = false,
    allowCycleWrap = true,
    maxPartsPerSession = 1,
    fees = 0,
    finalize = false,
    payoutConfirmed = false,
  } = params;

  const session = await prisma.activitySession.findUnique({
    where: { id: sessionId },
    include: {
      activity: true,
      beneficiaries: true,
      contributions: { where: { status: "PAID" }, select: { membershipId: true, amount: true } },
    },
  });

  if (!session || session.activityId !== activityId || session.activity.associationId !== associationId) {
    throw new Error("SESSION_NOT_FOUND");
  }
  if (session.beneficiaries.length > 0 && finalize) {
    throw new Error("ALREADY_DESIGNATED");
  }

  const [subscriptions, priorBeneficiaries, pendingSanctions, paidCounts] = await Promise.all([
    prisma.activitySubscription.findMany({
      where: { activityId, status: "ACTIVE" },
      include: {
        membership: {
          select: {
            id: true,
            status: true,
            reliabilityScore: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { subscribedAt: "asc" },
    }),
    prisma.activityBeneficiary.findMany({
      where: { session: { activityId } },
      select: { membershipId: true, partsCount: true },
    }),
    prisma.assocSanction.findMany({
      where: { status: "PENDING", meeting: { associationId } },
      select: { membershipId: true },
    }),
    prisma.activityContribution.groupBy({
      by: ["membershipId"],
      where: { activityId, status: "PAID" },
      _count: { id: true },
    }),
  ]);

  const servedParts = new Map<string, number>();
  for (const b of priorBeneficiaries) {
    servedParts.set(b.membershipId, (servedParts.get(b.membershipId) ?? 0) + (b.partsCount || 1));
  }
  const sanctionSet = new Set(pendingSanctions.map((s) => s.membershipId));
  const sessionPaidSet = new Set(session.contributions.map((c) => c.membershipId));
  const paidCountMap = new Map(paidCounts.map((p) => [p.membershipId, p._count.id]));

  const candidates: DesignationCandidate[] = subscriptions.map((sub) => {
    const reasons: string[] = [];
    if (sub.membership.status !== "ACTIVE") {
      reasons.push("Adhésion non active");
    }
    if (sanctionSet.has(sub.membershipId)) {
      reasons.push("Sanction en attente");
    }
    if (requirePaidContribution && !sessionPaidSet.has(sub.membershipId)) {
      reasons.push("Cotisation de séance non réglée");
    }
    const used = servedParts.get(sub.membershipId) ?? 0;
    const remainingRights = Math.max(0, sub.partsCount - used);
    if (remainingRights <= 0 && !allowCycleWrap) {
      reasons.push("Déjà servi pour toutes ses parts");
    } else if (used > 0 && remainingRights <= 0) {
      reasons.push("Déjà servi sur le cycle courant");
    }

    const paidScore = paidCountMap.get(sub.membershipId) ?? 0;
    const trust = sub.membership.reliabilityScore ?? 50;

    return {
      membershipId: sub.membershipId,
      userId: sub.membership.user.id,
      name: sub.membership.user.name ?? "Membre",
      partsCount: sub.partsCount,
      remainingRights: remainingRights > 0 ? remainingRights : allowCycleWrap ? sub.partsCount : 0,
      eligible: reasons.length === 0,
      reasons,
      score: paidScore * 10 + trust,
    };
  });

  const eligiblePool = candidates.filter((c) => c.eligible);
  if (eligiblePool.length === 0) {
    throw new Error("NO_ELIGIBLE_CANDIDATE");
  }

  const mode = (modeOverride || session.activity.distributionMode || "ROTATION").toUpperCase();
  const potAmount =
    session.potAmount ??
    session.contributions.reduce((sum, c) => sum + c.amount, 0);
  const partAmount = session.activity.contributionAmount ?? potAmount;
  const nowIso = new Date().toISOString();

  let winner: DesignationCandidate;
  let winningBid = 0;
  let algorithm = mode;
  let drawSeed: string | undefined;
  let drawRanks: Array<{ membershipId: string; rank: string }> | undefined;
  let auctionEval: ReturnType<typeof evaluateAuctionBids> | undefined;

  if (mode === "AUCTION") {
    const eligibleIds = new Set(eligiblePool.map((c) => c.membershipId));
    const prelimGross = potAmount;
    auctionEval = evaluateAuctionBids({
      grossRight: prelimGross,
      contributionAmount: session.activity.contributionAmount ?? 0,
      minBidPct: session.activity.auctionMinBidPct ?? 0,
      minBidders: session.activity.auctionMinBidders ?? 1,
      fees,
      eligibleIds,
      bids,
    });
    if (!auctionEval.ok || !auctionEval.winner) {
      throw new Error(auctionEval.error || "AUCTION_INVALID");
    }
    winner = eligiblePool.find((c) => c.membershipId === auctionEval!.winner!.membershipId)!;
    winningBid = auctionEval.winner.bidAmount;
    algorithm = "SERVER_SEALED_AUCTION";
  } else if (mode === "LOTTERY_MONTHLY" || mode === "LOTTERY_UNIQUE" || mode === "LOTTERY" || mode === "TIRAGE") {
    drawSeed = `${sessionId}:${randomBytes(16).toString("hex")}`;
    drawRanks = rankCandidatesByHmac(drawSeed, eligiblePool.map((c) => c.membershipId));
    winner = eligiblePool.find((c) => c.membershipId === drawRanks![0].membershipId)!;
    algorithm = "HMAC_SHA256";
  } else if (mode === "MERIT") {
    winner = [...eligiblePool].sort((a, b) => b.score - a.score)[0];
    algorithm = "MERIT_SCORE";
  } else {
    const order = parseRotationOrder(session.activity.rotationOrder);
    const ordered = order
      .map((id) => eligiblePool.find((c) => c.membershipId === id))
      .filter((c): c is DesignationCandidate => Boolean(c));
    winner = ordered[0] ?? eligiblePool[0];
    algorithm = "ROTATION_ORDER";
  }

  const partsCalc = computeFinancableParts({
    potAmount,
    partAmount,
    maxPartsPerSession,
    remainingRights: winner.remainingRights,
  });
  if (!partsCalc.ok) {
    throw new Error(partsCalc.error || "INSUFFICIENT_POT");
  }

  const grossRight = mode === "AUCTION" ? potAmount : partsCalc.grossRight;
  const netDistributed = Math.max(0, grossRight - winningBid - fees);
  const reliquat = mode === "AUCTION" ? winningBid : partsCalc.reliquat;
  const payoutStatus: "TO_PAY" | "PAID" = payoutConfirmed ? "PAID" : "TO_PAY";

  const proofHash = createHash("sha256")
    .update(
      JSON.stringify({
        sessionId,
        activityId,
        algorithm,
        seed: drawSeed,
        timestamp: nowIso,
        candidates: eligiblePool.map((c) => c.membershipId),
        winnerId: winner.membershipId,
        winningBid,
      })
    )
    .digest("hex");

  if (finalize) {
    const drawPayload = JSON.stringify({
      algorithm,
      seed: drawSeed,
      ranks: drawRanks,
      timestamp: nowIso,
      hash: proofHash,
      beneficiaries: [
        {
          membershipId: winner.membershipId,
          name: winner.name,
          amount: netDistributed,
          partsCount: partsCalc.partsAwarded,
        },
      ],
    });

    const auctionPayload =
      mode === "AUCTION"
        ? JSON.stringify({
            winnerId: winner.membershipId,
            winnerName: winner.name,
            winningBid,
            timestamp: nowIso,
            hash: proofHash,
            bidders: auctionEval?.allBids ?? bids,
          })
        : undefined;

    await prisma.$transaction(async (tx) => {
      // ATT02 : Verrou atomique face aux validations concurrentes
      const lock = await tx.activitySession.updateMany({
        where: {
          id: sessionId,
          beneficiaries: { none: {} },
          status: { in: ["PLANNED", "UPCOMING"] },
        },
        data: {
          drawMethod: mode,
          drawResult: mode === "AUCTION" ? undefined : drawPayload,
          auctionResult: auctionPayload,
          potAmount,
          distributed: netDistributed,
          reliquat,
          status: "HELD",
          heldAt: new Date(),
        },
      });

      if (lock.count === 0) {
        throw new Error("ALREADY_DESIGNATED");
      }

      await tx.activityBeneficiary.create({
        data: {
          sessionId,
          membershipId: winner.membershipId,
          partsCount: partsCalc.partsAwarded,
          amount: netDistributed,
          paidAt: payoutConfirmed ? new Date() : null,
          notes: `[${payoutStatus}] Désignation (${algorithm}) · Preuve ${proofHash.slice(0, 12)}`,
        },
      });

      await tx.associationAuditLog.create({
        data: {
          associationId,
          userId: actorUserId,
          action: "BENEFICIARY_DESIGNATED",
          entity: "ActivitySession",
          entityId: sessionId,
          details: `Bénéficiaire ${winner.name} désigné (${algorithm}), net=${netDistributed}, report=${reliquat}, statut=${payoutStatus}, hash=${proofHash}`,
        },
      });
    });
  }

  return {
    sessionId,
    activityId,
    mode,
    finalized: finalize,
    potAmount,
    partsAwarded: partsCalc.partsAwarded,
    grossRight,
    netDistributed,
    winningBid,
    reliquat,
    payoutStatus,
    winner: {
      membershipId: winner.membershipId,
      userId: winner.userId,
      name: winner.name,
      partsCount: partsCalc.partsAwarded,
    },
    proof: {
      algorithm,
      seed: drawSeed,
      ranks: drawRanks,
      timestamp: nowIso,
      hash: proofHash,
      candidateCount: eligiblePool.length,
    },
    candidates,
  };
}
