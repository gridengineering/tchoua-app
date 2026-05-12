import { mockDeep } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import {
  getVotingThreshold,
  canVote,
  evaluateApprovalRequest,
} from "@/lib/association/governance";

const prisma = mockDeep<PrismaClient>();

describe("governance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getVotingThreshold", () => {
    it("returns 0.33 for ROUTINE", () => {
      expect(getVotingThreshold("ROUTINE")).toBe(0.33);
    });

    it("returns 0.50 for STANDARD", () => {
      expect(getVotingThreshold("STANDARD")).toBe(0.5);
    });

    it("returns 0.66 for IMPORTANT", () => {
      expect(getVotingThreshold("IMPORTANT")).toBe(0.66);
    });

    it("returns 0.75 for CRITICAL", () => {
      expect(getVotingThreshold("CRITICAL")).toBe(0.75);
    });

    it("returns 1.0 for CONSTITUTIONAL", () => {
      expect(getVotingThreshold("CONSTITUTIONAL")).toBe(1.0);
    });

    it("returns 0.50 for unknown level", () => {
      expect(getVotingThreshold("UNKNOWN")).toBe(0.5);
    });
  });

  describe("canVote", () => {
    it("allows active member to vote in open election", async () => {
      prisma.election.findUnique.mockResolvedValue({
        id: "election-1",
        associationId: "assoc-1",
        status: "OPEN",
        startDate: null,
        endDate: null,
      } as any);
      prisma.associationMembership.findFirst.mockResolvedValue({
        id: "membership-1",
        status: "ACTIVE",
      } as any);
      prisma.electionVote.findUnique.mockResolvedValue(null);

      const result = await canVote("election-1", "membership-1", prisma);
      expect(result).toBe(true);
    });

    it("prevents suspended member from voting", async () => {
      prisma.election.findUnique.mockResolvedValue({
        id: "election-1",
        associationId: "assoc-1",
        status: "OPEN",
        startDate: null,
        endDate: null,
      } as any);
      prisma.associationMembership.findFirst.mockResolvedValue(null);

      const result = await canVote("election-1", "membership-1", prisma);
      expect(result).toBe(false);
    });

    it("prevents voting when election is not OPEN", async () => {
      prisma.election.findUnique.mockResolvedValue({
        id: "election-1",
        associationId: "assoc-1",
        status: "DRAFT",
      } as any);

      const result = await canVote("election-1", "membership-1", prisma);
      expect(result).toBe(false);
    });

    it("prevents voting when member already voted", async () => {
      prisma.election.findUnique.mockResolvedValue({
        id: "election-1",
        associationId: "assoc-1",
        status: "OPEN",
        startDate: null,
        endDate: null,
      } as any);
      prisma.associationMembership.findFirst.mockResolvedValue({
        id: "membership-1",
        status: "ACTIVE",
      } as any);
      prisma.electionVote.findUnique.mockResolvedValue({ id: "vote-1" } as any);

      const result = await canVote("election-1", "membership-1", prisma);
      expect(result).toBe(false);
    });

    it("prevents voting when membership does not exist", async () => {
      prisma.election.findUnique.mockResolvedValue({
        id: "election-1",
        associationId: "assoc-1",
        status: "OPEN",
        startDate: null,
        endDate: null,
      } as any);
      prisma.associationMembership.findFirst.mockResolvedValue(null);

      const result = await canVote("election-1", "membership-1", prisma);
      expect(result).toBe(false);
    });
  });

  describe("evaluateApprovalRequest", () => {
    it("approves request when votesFor meets threshold", async () => {
      prisma.approvalRequest.findUnique.mockResolvedValue({
        id: "request-1",
        status: "PENDING",
        votesFor: 5,
        votesAgainst: 1,
        deadline: null,
        workflow: {
          associationId: "assoc-1",
          votingLevel: "STANDARD",
          minVotesRequired: null,
          steps: [],
        },
        votes: [],
      } as any);
      prisma.associationMembership.count.mockResolvedValue(10);
      prisma.approvalRequest.update.mockResolvedValue({
        id: "request-1",
        status: "APPROVED",
      } as any);

      const result = await evaluateApprovalRequest("request-1", prisma);
      expect(result.status).toBe("APPROVED");
      expect(prisma.approvalRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "request-1" },
          data: expect.objectContaining({
            status: "APPROVED",
            decidedAt: expect.any(Date),
          }),
        })
      );
    });

    it("does not approve when votesFor is below threshold", async () => {
      prisma.approvalRequest.findUnique.mockResolvedValue({
        id: "request-1",
        status: "PENDING",
        votesFor: 2,
        votesAgainst: 1,
        deadline: null,
        workflow: {
          associationId: "assoc-1",
          votingLevel: "STANDARD",
          minVotesRequired: null,
          steps: [],
        },
        votes: [],
      } as any);
      prisma.associationMembership.count.mockResolvedValue(10);

      const result = await evaluateApprovalRequest("request-1", prisma);
      expect(result.status).toBe("PENDING");
      expect(prisma.approvalRequest.update).not.toHaveBeenCalled();
    });

    it("rejects request when votesAgainst meets threshold", async () => {
      prisma.approvalRequest.findUnique.mockResolvedValue({
        id: "request-1",
        status: "PENDING",
        votesFor: 1,
        votesAgainst: 8,
        deadline: null,
        workflow: {
          associationId: "assoc-1",
          votingLevel: "STANDARD",
          minVotesRequired: null,
          steps: [],
        },
        votes: [],
      } as any);
      prisma.associationMembership.count.mockResolvedValue(10);
      prisma.approvalRequest.update.mockResolvedValue({
        id: "request-1",
        status: "REJECTED",
      } as any);

      const result = await evaluateApprovalRequest("request-1", prisma);
      expect(result.status).toBe("REJECTED");
      expect(prisma.approvalRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "request-1" },
          data: expect.objectContaining({ status: "REJECTED" }),
        })
      );
    });

    it("expires request when deadline has passed", async () => {
      prisma.approvalRequest.findUnique.mockResolvedValue({
        id: "request-1",
        status: "PENDING",
        votesFor: 1,
        votesAgainst: 0,
        deadline: new Date("2020-01-01"),
        workflow: {
          associationId: "assoc-1",
          votingLevel: "STANDARD",
          minVotesRequired: null,
          steps: [],
        },
        votes: [],
      } as any);
      prisma.approvalRequest.update.mockResolvedValue({
        id: "request-1",
        status: "EXPIRED",
      } as any);

      const result = await evaluateApprovalRequest("request-1", prisma);
      expect(result.status).toBe("EXPIRED");
    });

    it("throws when request is not found", async () => {
      prisma.approvalRequest.findUnique.mockResolvedValue(null);
      await expect(
        evaluateApprovalRequest("request-1", prisma)
      ).rejects.toThrow("Demande introuvable");
    });
  });
});
