import { mockDeep } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { transitionAssociation } from "@/lib/association/lifecycle";

const prisma = mockDeep<PrismaClient>();

describe("transitionAssociation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("performs valid transition DRAFT → PENDING", async () => {
    const mockAssoc = { id: "assoc-1", status: "DRAFT", activatedAt: null };
    prisma.association.findUnique.mockResolvedValue(mockAssoc as any);
    prisma.$transaction.mockResolvedValue([
      { ...mockAssoc, status: "PENDING" },
      { id: "event-1" },
      { id: "audit-1" },
    ] as any);

    const result = await transitionAssociation(
      "assoc-1",
      "DRAFT",
      "PENDING",
      "user-1",
      undefined,
      prisma
    );

    expect(result.association.status).toBe("PENDING");
    expect(prisma.association.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "assoc-1" },
        data: { status: "PENDING" },
      })
    );
    expect(prisma.associationLifecycleEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: "DRAFT",
          toStatus: "PENDING",
        }),
      })
    );
    expect(prisma.associationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "STATUS_TRANSITION" }),
      })
    );
  });

  it("performs valid transition PENDING → ACTIVE and sets activatedAt", async () => {
    const mockAssoc = { id: "assoc-1", status: "PENDING", activatedAt: null };
    prisma.association.findUnique.mockResolvedValue(mockAssoc as any);
    prisma.$transaction.mockResolvedValue([
      { ...mockAssoc, status: "ACTIVE", activatedAt: new Date() },
      { id: "event-2" },
      { id: "audit-2" },
    ] as any);

    const result = await transitionAssociation(
      "assoc-1",
      "PENDING",
      "ACTIVE",
      "user-1",
      undefined,
      prisma
    );

    expect(result.association.status).toBe("ACTIVE");
    expect(prisma.association.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "assoc-1" },
        data: expect.objectContaining({
          status: "ACTIVE",
          activatedAt: expect.any(Date),
        }),
      })
    );
  });

  it("performs valid transition ACTIVE → DISSOLVED and sets dissolvedAt", async () => {
    const mockAssoc = {
      id: "assoc-1",
      status: "ACTIVE",
      activatedAt: new Date(),
    };
    prisma.association.findUnique.mockResolvedValue(mockAssoc as any);
    prisma.$transaction.mockResolvedValue([
      { ...mockAssoc, status: "DISSOLVED", dissolvedAt: new Date() },
      { id: "event-3" },
      { id: "audit-3" },
    ] as any);

    const result = await transitionAssociation(
      "assoc-1",
      "ACTIVE",
      "DISSOLVED",
      "user-1",
      "Dissolution reason",
      prisma
    );

    expect(result.association.status).toBe("DISSOLVED");
    expect(prisma.association.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "assoc-1" },
        data: expect.objectContaining({
          status: "DISSOLVED",
          dissolvedAt: expect.any(Date),
          dissolutionReason: "Dissolution reason",
        }),
      })
    );
  });

  it("throws on invalid transition", async () => {
    const mockAssoc = { id: "assoc-1", status: "DRAFT" };
    prisma.association.findUnique.mockResolvedValue(mockAssoc as any);

    await expect(
      transitionAssociation(
        "assoc-1",
        "DRAFT",
        "DISSOLVED",
        "user-1",
        undefined,
        prisma
      )
    ).rejects.toThrow("Transition invalide : DRAFT → DISSOLVED");
  });

  it("throws when association is not found", async () => {
    prisma.association.findUnique.mockResolvedValue(null);

    await expect(
      transitionAssociation(
        "assoc-1",
        "DRAFT",
        "PENDING",
        "user-1",
        undefined,
        prisma
      )
    ).rejects.toThrow("Association introuvable");
  });

  it("throws when current status does not match", async () => {
    prisma.association.findUnique.mockResolvedValue({
      id: "assoc-1",
      status: "ACTIVE",
    } as any);

    await expect(
      transitionAssociation(
        "assoc-1",
        "DRAFT",
        "PENDING",
        "user-1",
        undefined,
        prisma
      )
    ).rejects.toThrow(
      "Statut actuel incorrect : ACTIVE (attendu : DRAFT)"
    );
  });

  it("creates lifecycle event and audit log", async () => {
    const mockAssoc = {
      id: "assoc-1",
      status: "SUSPENDED",
      activatedAt: new Date(),
    };
    prisma.association.findUnique.mockResolvedValue(mockAssoc as any);
    prisma.$transaction.mockResolvedValue([
      { ...mockAssoc, status: "ACTIVE" },
      { id: "event-4" },
      { id: "audit-4" },
    ] as any);

    await transitionAssociation(
      "assoc-1",
      "SUSPENDED",
      "ACTIVE",
      "user-2",
      "Reason",
      prisma
    );

    expect(prisma.associationLifecycleEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          associationId: "assoc-1",
          fromStatus: "SUSPENDED",
          toStatus: "ACTIVE",
          triggeredBy: "USER",
          userId: "user-2",
          reason: "Reason",
        }),
      })
    );

    expect(prisma.associationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          associationId: "assoc-1",
          userId: "user-2",
          action: "STATUS_TRANSITION",
          entity: "ASSOCIATION",
          entityId: "assoc-1",
          changes: JSON.stringify({ from: "SUSPENDED", to: "ACTIVE" }),
          details: "Reason",
        }),
      })
    );
  });

  it("uses default details when reason is not provided", async () => {
    const mockAssoc = { id: "assoc-1", status: "DRAFT" };
    prisma.association.findUnique.mockResolvedValue(mockAssoc as any);
    prisma.$transaction.mockResolvedValue([
      { ...mockAssoc, status: "PENDING" },
      { id: "event-5" },
      { id: "audit-5" },
    ] as any);

    await transitionAssociation(
      "assoc-1",
      "DRAFT",
      "PENDING",
      "user-1",
      undefined,
      prisma
    );

    expect(prisma.associationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: "Transition DRAFT → PENDING",
        }),
      })
    );
  });
});
