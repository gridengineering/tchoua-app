import { createHash, randomInt } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export type AuctionBidInput = {
  membershipId: string;
  bidAmount: number;
};

export type DesignationCandidate = {
  membershipId: string;
  userId: string;
  name: string;
  partsCount: number;
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
  netDistributed: number;
  winningBid: number;
  winner: {
    membershipId: string;
    userId: string;
    name: string;
    partsCount: number;
  };
  proof: {
    algorithm: string;
    timestamp: string;
    hash: string;
    candidateCount: number;
  };
  candidates: DesignationCandidate[];
};

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
 * Moteur serveur de désignation automatique des bénéficiaires (R1 - Étude ARP).
 * Vérifie l'éligibilité, applique le mode d'attribution (rotation, tirage, enchères, mérite),
 * produit une preuve cryptographique et journalise l'opération si `finalize` est vrai.
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
    finalize?: boolean;
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
    finalize = false,
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
      select: { membershipId: true },
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

  const servedCount = new Map<string, number>();
  for (const b of priorBeneficiaries) {
    servedCount.set(b.membershipId, (servedCount.get(b.membershipId) ?? 0) + 1);
  }
  const sanctionSet = new Set(pendingSanctions.map((s) => s.membershipId));
  const sessionPaidSet = new Set(session.contributions.map((c) => c.membershipId));
  const paidCountMap = new Map(paidCounts.map((p) => [p.membershipId, p._count.id]));

  const minServed = subscriptions.reduce((min, s) => {
    const c = servedCount.get(s.membershipId) ?? 0;
    return c < min ? c : min;
  }, Infinity);

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
    const timesServed = servedCount.get(sub.membershipId) ?? 0;
    if (timesServed >= sub.partsCount && !allowCycleWrap) {
      reasons.push("Déjà servi pour toutes ses parts");
    } else if (timesServed > minServed) {
      reasons.push("Déjà servi sur le cycle courant");
    }

    const paidScore = paidCountMap.get(sub.membershipId) ?? 0;
    const trust = sub.membership.reliabilityScore ?? 50;

    return {
      membershipId: sub.membershipId,
      userId: sub.membership.user.id,
      name: sub.membership.user.name ?? "Membre",
      partsCount: sub.partsCount,
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
  const nowIso = new Date().toISOString();

  let winner: DesignationCandidate;
  let winningBid = 0;
  let algorithm = mode;

  if (mode === "AUCTION") {
    const eligibleIds = new Set(eligiblePool.map((c) => c.membershipId));
    const minPct = session.activity.auctionMinBidPct ?? 0;
    const minBid = Math.round((potAmount * minPct) / 100);
    const minBidders = session.activity.auctionMinBidders ?? 1;

    const validBids = bids
      .filter((b) => eligibleIds.has(b.membershipId) && Number.isFinite(b.bidAmount) && b.bidAmount >= minBid)
      .sort((a, b) => b.bidAmount - a.bidAmount);

    if (validBids.length < minBidders) {
      throw new Error(`AUCTION_MIN_BIDDERS:${minBidders}`);
    }
    const top = validBids[0];
    winner = eligiblePool.find((c) => c.membershipId === top.membershipId)!;
    winningBid = top.bidAmount;
    algorithm = "SERVER_SEALED_AUCTION";
  } else if (mode === "LOTTERY_MONTHLY" || mode === "LOTTERY_UNIQUE" || mode === "TIRAGE") {
    const idx = randomInt(0, eligiblePool.length);
    winner = eligiblePool[idx];
    algorithm = "CSPRNG_RANDOM_INT";
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

  const netDistributed = Math.max(0, potAmount - winningBid);
  const proofHash = createHash("sha256")
    .update(
      JSON.stringify({
        sessionId,
        activityId,
        algorithm,
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
      timestamp: nowIso,
      hash: proofHash,
      beneficiaries: [
        {
          membershipId: winner.membershipId,
          name: winner.name,
          amount: netDistributed,
          partsCount: winner.partsCount,
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
            bidders: bids,
          })
        : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.activitySession.update({
        where: { id: sessionId },
        data: {
          drawMethod: mode,
          drawResult: mode === "AUCTION" ? undefined : drawPayload,
          auctionResult: auctionPayload,
          potAmount,
          distributed: netDistributed,
          reliquat: Math.max(0, potAmount - netDistributed - winningBid),
          status: "HELD",
          heldAt: new Date(),
        },
      });

      await tx.activityBeneficiary.create({
        data: {
          sessionId,
          membershipId: winner.membershipId,
          partsCount: winner.partsCount,
          amount: netDistributed,
          paidAt: new Date(),
          notes: `Désignation auto (${algorithm}) · Preuve ${proofHash.slice(0, 12)}`,
        },
      });

      if (winningBid > 0) {
        await tx.associationActivity.update({
          where: { id: activityId },
          data: { caisseBalance: { increment: winningBid } },
        });
      }

      await tx.associationAuditLog.create({
        data: {
          associationId,
          userId: actorUserId,
          action: "BENEFICIARY_DESIGNATED",
          entity: "ActivitySession",
          entityId: sessionId,
          details: `Bénéficiaire ${winner.name} désigné (${algorithm}), net=${netDistributed}, enchère=${winningBid}, hash=${proofHash}`,
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
    netDistributed,
    winningBid,
    winner: {
      membershipId: winner.membershipId,
      userId: winner.userId,
      name: winner.name,
      partsCount: winner.partsCount,
    },
    proof: {
      algorithm,
      timestamp: nowIso,
      hash: proofHash,
      candidateCount: eligiblePool.length,
    },
    candidates,
  };
}
