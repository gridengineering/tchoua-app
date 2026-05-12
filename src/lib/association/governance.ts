import { PrismaClient } from "@prisma/client";

export function getVotingThreshold(level: string): number {
  switch (level) {
    case "ROUTINE": return 0.33;
    case "STANDARD": return 0.50;
    case "IMPORTANT": return 0.66;
    case "CRITICAL": return 0.75;
    case "CONSTITUTIONAL": return 1.0;
    default: return 0.50;
  }
}

export async function createElection(
  data: {
    associationId: string;
    title: string;
    type: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    quorumRequired?: number | null;
    createdById: string;
  },
  prisma: PrismaClient
) {
  return prisma.election.create({
    data: {
      associationId: data.associationId,
      title: data.title,
      type: data.type,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      quorumRequired: data.quorumRequired ?? null,
      createdById: data.createdById,
      status: "DRAFT",
    },
  });
}

export async function openElection(electionId: string, prisma: PrismaClient) {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { candidates: true },
  });
  if (!election) throw new Error("Élection introuvable");
  if (election.status !== "DRAFT") throw new Error("L'élection doit être en DRAFT");
  if (election.candidates.length === 0) throw new Error("Au moins un candidat est requis");

  const totalMembers = await prisma.associationMembership.count({
    where: { associationId: election.associationId, status: { not: "LEFT" } },
  });
  if (election.quorumRequired && election.quorumRequired > totalMembers) {
    throw new Error("Le quorum requis dépasse le nombre de membres actifs");
  }

  return prisma.election.update({
    where: { id: electionId },
    data: { status: "OPEN" },
  });
}

export async function closeElection(electionId: string, prisma: PrismaClient) {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { candidates: true, votes: true, mandate: true },
  });
  if (!election) throw new Error("Élection introuvable");
  if (election.status !== "OPEN") throw new Error("L'élection doit être en OPEN");

  // Agréger les votes par candidat
  const voteCounts = new Map<string, number>();
  for (const candidate of election.candidates) {
    voteCounts.set(candidate.id, 0);
  }
  for (const vote of election.votes) {
    const current = voteCounts.get(vote.candidateId) ?? 0;
    voteCounts.set(vote.candidateId, current + vote.value);
  }

  // Mettre à jour votesCount pour chaque candidat
  for (const [candidateId, count] of voteCounts.entries()) {
    await prisma.electionCandidate.update({
      where: { id: candidateId },
      data: { votesCount: count },
    });
  }

  // Déterminer les gagnants par position (majorité simple)
  const candidatesByPosition = new Map<string, typeof election.candidates>();
  for (const candidate of election.candidates) {
    const list = candidatesByPosition.get(candidate.position) ?? [];
    list.push(candidate);
    candidatesByPosition.set(candidate.position, list);
  }

  const winners: { candidateId: string; position: string }[] = [];
  for (const [position, candidates] of candidatesByPosition.entries()) {
    let best: typeof election.candidates[0] | null = null;
    for (const c of candidates) {
      const count = voteCounts.get(c.id) ?? 0;
      if (!best || count > (voteCounts.get(best.id) ?? 0)) {
        best = c;
      }
    }
    if (best) {
      winners.push({ candidateId: best.id, position });
    }
  }

  // Marquer les gagnants et créer les mandats
  for (const winner of winners) {
    await prisma.electionCandidate.update({
      where: { id: winner.candidateId },
      data: { isElected: true },
    });

    const candidate = election.candidates.find((c) => c.id === winner.candidateId)!;
    await prisma.mandatePeriod.create({
      data: {
        electionId: election.id,
        associationId: election.associationId,
        membershipId: candidate.membershipId,
        role: winner.position,
        startDate: new Date(),
        isActive: true,
      },
    });
  }

  // Mettre à jour quorumReached et status
  const totalVotes = election.votes.length;
  const quorumReached = election.quorumRequired ? totalVotes >= election.quorumRequired : true;

  return prisma.election.update({
    where: { id: electionId },
    data: {
      status: "CLOSED",
      quorumReached,
    },
  });
}

export async function canVote(
  electionId: string,
  membershipId: string,
  prisma: PrismaClient
): Promise<boolean> {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
  });
  if (!election) return false;
  if (election.status !== "OPEN") return false;

  const now = new Date();
  if (election.startDate && new Date(election.startDate) > now) return false;
  if (election.endDate && new Date(election.endDate) < now) return false;

  const membership = await prisma.associationMembership.findFirst({
    where: { id: membershipId, associationId: election.associationId, status: "ACTIVE" },
  });
  if (!membership) return false;

  const existingVote = await prisma.electionVote.findUnique({
    where: { electionId_membershipId: { electionId, membershipId } },
  });
  if (existingVote) return false;

  return true;
}

export async function evaluateApprovalRequest(requestId: string, prisma: PrismaClient) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { workflow: { include: { steps: true } }, votes: true },
  });
  if (!request) throw new Error("Demande introuvable");
  if (request.status !== "PENDING") return request;

  const workflow = request.workflow;

  // Compter les membres actifs de l'association
  const totalMembers = await prisma.associationMembership.count({
    where: { associationId: workflow.associationId, status: { not: "LEFT" } },
  });

  const threshold = getVotingThreshold(workflow.votingLevel);
  const votesFor = request.votesFor;
  const votesAgainst = request.votesAgainst;

  let approved = false;
  let rejected = false;

  if (workflow.minVotesRequired) {
    approved = votesFor >= workflow.minVotesRequired;
    rejected = votesAgainst >= workflow.minVotesRequired;
  } else {
    const base = Math.max(totalMembers, 1);
    approved = votesFor / base >= threshold;
    rejected = votesAgainst / base >= threshold;
  }

  if (approved) {
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", decidedAt: new Date() },
    });
  }

  if (rejected) {
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", decidedAt: new Date() },
    });
  }

  // Vérifier expiration
  if (request.deadline && new Date(request.deadline) < new Date()) {
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: "EXPIRED", decidedAt: new Date() },
    });
  }

  return request;
}
