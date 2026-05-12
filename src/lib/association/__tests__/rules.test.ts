import { mockDeep } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import {
  validateAssociationName,
  validateActivationRequirements,
  validateMaxAssociationsPerMember,
  validateLoanToFundRatio,
  validateDoubleValidation,
  validateTemplateConversionEligibility,
  validateStatusTransition,
} from "@/lib/association/rules";

const prisma = mockDeep<PrismaClient>();

describe("rules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateAssociationName", () => {
    it("accepts a valid unique name", async () => {
      prisma.association.findFirst.mockResolvedValue(null);
      const result = await validateAssociationName("Mon Association", prisma);
      expect(result).toEqual({ valid: true });
    });

    it("rejects a name that is too short", async () => {
      const result = await validateAssociationName("A", prisma);
      expect(result).toEqual({
        valid: false,
        error: "Nom trop court ou slug invalide",
      });
      expect(prisma.association.findFirst).not.toHaveBeenCalled();
    });

    it("rejects a name with special characters resulting in short slug", async () => {
      const result = await validateAssociationName("!@#$%", prisma);
      expect(result).toEqual({
        valid: false,
        error: "Nom trop court ou slug invalide",
      });
    });

    it("rejects a non-unique name", async () => {
      prisma.association.findFirst.mockResolvedValue({ id: "1" } as any);
      const result = await validateAssociationName("Mon Association", prisma);
      expect(result).toEqual({
        valid: false,
        error: "Une association avec ce slug existe déjà",
      });
    });
  });

  describe("validateActivationRequirements", () => {
    it("succeeds when all 3 required roles are present", async () => {
      prisma.associationMembership.findMany.mockResolvedValue([
        { role: "PRESIDENT" },
        { role: "SECRETARY" },
        { role: "TREASURER" },
      ] as any);
      const result = await validateActivationRequirements("assoc-1", prisma);
      expect(result).toEqual({ valid: true });
    });

    it("fails when TREASURER is missing", async () => {
      prisma.associationMembership.findMany.mockResolvedValue([
        { role: "PRESIDENT" },
        { role: "SECRETARY" },
      ] as any);
      const result = await validateActivationRequirements("assoc-1", prisma);
      expect(result).toEqual({
        valid: false,
        error: "Rôles manquants pour activation : TREASURER",
      });
    });
  });

  describe("validateMaxAssociationsPerMember", () => {
    it("succeeds when member has fewer than 10 active associations", async () => {
      prisma.associationMembership.count.mockResolvedValue(9);
      const result = await validateMaxAssociationsPerMember("user-1", prisma);
      expect(result).toEqual({ valid: true });
    });

    it("fails when member already has exactly 10 active associations", async () => {
      prisma.associationMembership.count.mockResolvedValue(10);
      const result = await validateMaxAssociationsPerMember("user-1", prisma);
      expect(result).toEqual({
        valid: false,
        error: "Limite de 10 associations actives atteinte",
      });
    });

    it("fails when member has more than 10 active associations", async () => {
      prisma.associationMembership.count.mockResolvedValue(11);
      const result = await validateMaxAssociationsPerMember("user-1", prisma);
      expect(result).toEqual({
        valid: false,
        error: "Limite de 10 associations actives atteinte",
      });
    });
  });

  describe("validateLoanToFundRatio", () => {
    it("succeeds when ratio is below 80%", async () => {
      prisma.associationActivity.findMany.mockResolvedValue([
        { caisseBalance: 1000 },
      ]);
      prisma.assocLoan.findMany.mockResolvedValue([{ amount: 500 }]);
      const result = await validateLoanToFundRatio("assoc-1", prisma);
      expect(result).toEqual({ valid: true });
    });

    it("fails when ratio exceeds 80%", async () => {
      prisma.associationActivity.findMany.mockResolvedValue([
        { caisseBalance: 1000 },
      ]);
      prisma.assocLoan.findMany.mockResolvedValue([{ amount: 900 }]);
      const result = await validateLoanToFundRatio("assoc-1", prisma);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("90.0%");
      expect(result.error).toContain("dépasse la limite de 80%");
    });

    it("succeeds when no funds and no loans", async () => {
      prisma.associationActivity.findMany.mockResolvedValue([]);
      prisma.assocLoan.findMany.mockResolvedValue([]);
      const result = await validateLoanToFundRatio("assoc-1", prisma);
      expect(result).toEqual({ valid: true });
    });
  });

  describe("validateDoubleValidation", () => {
    it("succeeds for amount below 500k with 1 validator", () => {
      const result = validateDoubleValidation(400_000, ["user-1"]);
      expect(result).toEqual({ valid: true });
    });

    it("fails for amount above 500k with only 1 validator", () => {
      const result = validateDoubleValidation(600_000, ["user-1"]);
      expect(result).toEqual({
        valid: false,
        error: "Montant supérieur à 500 000 FCFA : 2 validateurs requis",
      });
    });

    it("succeeds for amount above 500k with 2 validators", () => {
      const result = validateDoubleValidation(600_000, ["user-1", "user-2"]);
      expect(result).toEqual({ valid: true });
    });
  });

  describe("validateTemplateConversionEligibility", () => {
    it("fails when association is active for less than 90 days", async () => {
      const activatedAt = new Date();
      activatedAt.setDate(activatedAt.getDate() - 30);
      prisma.association.findUnique.mockResolvedValue({
        status: "ACTIVE",
        activatedAt,
      });
      const result = await validateTemplateConversionEligibility(
        "assoc-1",
        prisma
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("30");
      expect(result.error).toContain("minimum 90 requis");
    });

    it("succeeds when association is active for more than 90 days", async () => {
      const activatedAt = new Date();
      activatedAt.setDate(activatedAt.getDate() - 100);
      prisma.association.findUnique.mockResolvedValue({
        status: "ACTIVE",
        activatedAt,
      });
      const result = await validateTemplateConversionEligibility(
        "assoc-1",
        prisma
      );
      expect(result).toEqual({ valid: true });
    });

    it("fails when association is not found", async () => {
      prisma.association.findUnique.mockResolvedValue(null);
      const result = await validateTemplateConversionEligibility(
        "assoc-1",
        prisma
      );
      expect(result).toEqual({
        valid: false,
        error: "Association introuvable",
      });
    });

    it("fails when association is not ACTIVE", async () => {
      prisma.association.findUnique.mockResolvedValue({
        status: "DRAFT",
        activatedAt: new Date(),
      });
      const result = await validateTemplateConversionEligibility(
        "assoc-1",
        prisma
      );
      expect(result).toEqual({
        valid: false,
        error: "L'association doit être ACTIVE",
      });
    });
  });

  describe("validateStatusTransition", () => {
    it("allows DRAFT → PENDING", () => {
      expect(validateStatusTransition("DRAFT", "PENDING")).toBe(true);
    });

    it("allows PENDING → ACTIVE", () => {
      expect(validateStatusTransition("PENDING", "ACTIVE")).toBe(true);
    });

    it("allows ACTIVE → SUSPENDED", () => {
      expect(validateStatusTransition("ACTIVE", "SUSPENDED")).toBe(true);
    });

    it("allows ACTIVE → DISSOLVED", () => {
      expect(validateStatusTransition("ACTIVE", "DISSOLVED")).toBe(true);
    });

    it("forbids DISSOLVED → ACTIVE", () => {
      expect(validateStatusTransition("DISSOLVED", "ACTIVE")).toBe(false);
    });

    it("forbids unknown transitions", () => {
      expect(validateStatusTransition("DRAFT", "ACTIVE")).toBe(false);
    });
  });
});
