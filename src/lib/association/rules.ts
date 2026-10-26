import { PrismaClient } from "@prisma/client";

// ─── Annexe B : Codes d'Erreur API (SPECIFICATION_ASSOCIATION.md) ──────────
export const API_ERROR_CODES = {
  ASSOC_001: {
    code: "ASSOC_001",
    httpStatus: 409,
    message: "Une association avec ce nom existe déjà",
  },
  ASSOC_002: {
    code: "ASSOC_002",
    httpStatus: 400,
    message: "L'association ne peut pas être activée sans les rôles obligatoires",
  },
  ASSOC_003: {
    code: "ASSOC_003",
    httpStatus: 409,
    message: "Cette association a déjà une association mère",
  },
  ASSOC_004: {
    code: "ASSOC_004",
    httpStatus: 400,
    message: "Limite de 20 associations filles atteinte",
  },
  ASSOC_005: {
    code: "ASSOC_005",
    httpStatus: 400,
    message: "Vous avez atteint la limite de 10 associations actives",
  },
  ASSOC_006: {
    code: "ASSOC_006",
    httpStatus: 400,
    message: "L'encours des prêts dépasse 80% des fonds disponibles",
  },
  ASSOC_007: {
    code: "ASSOC_007",
    httpStatus: 403,
    message: "Ce montant nécessite une double validation",
  },
  ASSOC_008: {
    code: "ASSOC_008",
    httpStatus: 400,
    message: "L'association doit être active depuis au moins 90 jours pour devenir un template",
  },
  ASSOC_009: {
    code: "ASSOC_009",
    httpStatus: 403,
    message: "Les templates système ne peuvent pas être forkés",
  },
  ASSOC_010: {
    code: "ASSOC_010",
    httpStatus: 403,
    message: "La génération de rapports est bloquée pour une association suspendue",
  },
} as const;

export function generateNameSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── R-001 : Validation du nom / slug ─────────────────────────────────────
export async function validateAssociationName(
  name: string,
  prisma: PrismaClient
): Promise<{ valid: boolean; error?: string; code?: string }> {
  const slug = generateNameSlug(name);

  if (!slug || slug.length < 2) {
    return { valid: false, error: "Nom trop court ou slug invalide" };
  }

  const existing = await prisma.association.findFirst({
    where: { nameSlug: slug },
  });

  if (existing) {
    return { valid: false, error: "Une association avec ce slug existe déjà" };
  }

  return { valid: true };
}

// ─── R-003 : Vérifie la présence des 3 rôles clés pour activation ─────────
export async function validateActivationRequirements(
  associationId: string,
  prisma: PrismaClient
): Promise<{ valid: boolean; error?: string; code?: string }> {
  const requiredRoles = ["PRESIDENT", "SECRETARY", "TREASURER"];

  const memberships = await prisma.associationMembership.findMany({
    where: {
      associationId,
      status: "ACTIVE",
      role: { in: requiredRoles },
    },
  });

  const presentRoles = new Set(memberships.map((m) => m.role));
  const missing = requiredRoles.filter((r) => !presentRoles.has(r));

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Rôles manquants pour activation : ${missing.join(", ")}`,
    };
  }

  return { valid: true };
}

// ─── R-004 : Une association ne peut pas avoir plus d'1 association mère ───
export async function validateSingleParent(
  associationId: string,
  prisma: PrismaClient
): Promise<{ valid: boolean; error?: string; code?: string }> {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { parentId: true },
  });

  if (association?.parentId) {
    return {
      valid: false,
      code: API_ERROR_CODES.ASSOC_003.code,
      error: API_ERROR_CODES.ASSOC_003.message,
    };
  }

  const existingParentRelation = await prisma.associationRelation.findFirst({
    where: {
      status: "ACTIVE",
      OR: [
        { sourceId: associationId, type: "CHILD" },
        { targetId: associationId, type: "MOTHER" },
      ],
    },
  });

  if (existingParentRelation) {
    return {
      valid: false,
      code: API_ERROR_CODES.ASSOC_003.code,
      error: API_ERROR_CODES.ASSOC_003.message,
    };
  }

  return { valid: true };
}

// ─── R-005 : Une association mère peut avoir au maximum 20 filles ──────────
export async function validateMaxChildAssociations(
  parentId: string,
  prisma: PrismaClient,
  maxChildren = 20
): Promise<{ valid: boolean; error?: string; code?: string }> {
  const activeChildRelations = await prisma.associationRelation.count({
    where: {
      status: "ACTIVE",
      OR: [
        { sourceId: parentId, type: "MOTHER" },
        { targetId: parentId, type: "CHILD" },
      ],
    },
  });

  if (activeChildRelations >= maxChildren) {
    return {
      valid: false,
      code: API_ERROR_CODES.ASSOC_004.code,
      error: API_ERROR_CODES.ASSOC_004.message,
    };
  }

  return { valid: true };
}

// ─── R-016 : Max 10 associations actives par membre ───────────────────────
export async function getMemberActiveAssociationCount(
  userId: string,
  prisma: PrismaClient
): Promise<number> {
  return prisma.associationMembership.count({
    where: {
      userId,
      status: "ACTIVE",
      association: { status: "ACTIVE" },
    },
  });
}

export async function validateMaxAssociationsPerMember(
  userId: string,
  prisma: PrismaClient
): Promise<{ valid: boolean; error?: string }> {
  const count = await getMemberActiveAssociationCount(userId, prisma);
  if (count >= 10) {
    return { valid: false, error: "Limite de 10 associations actives atteinte" };
  }
  return { valid: true };
}

// ─── R-018 : Un membre suspendu dans une association ne peut pas en créer ─
export async function validateNotSuspendedInAnyAssociation(
  userId: string,
  prisma: PrismaClient
): Promise<{ valid: boolean; error?: string }> {
  const suspendedCount = await prisma.associationMembership.count({
    where: {
      userId,
      status: { in: ["SUSPENDED", "BLACKLISTED"] },
    },
  });

  if (suspendedCount > 0) {
    return {
      valid: false,
      error:
        "Un membre suspendu ou sur liste noire dans une association ne peut pas créer une nouvelle association",
    };
  }

  return { valid: true };
}

// ─── R-020 : Départ volontaire bloqué en cas de dettes / prêts actifs ──────
export async function validateMemberCanLeave(
  membershipId: string,
  prisma: PrismaClient
): Promise<{ valid: boolean; error?: string }> {
  const activeLoans = await prisma.assocLoan.count({
    where: {
      borrowerMembershipId: membershipId,
      status: { in: ["PENDING", "APPROVED", "ACTIVE", "OVERDUE", "DEFAULTED"] },
    },
  });

  if (activeLoans > 0) {
    return {
      valid: false,
      error:
        "Départ impossible : le membre possède des prêts actifs ou impayés à solder au préalable",
    };
  }

  const unpaidSanctions = await prisma.assocSanction.count({
    where: {
      membershipId,
      status: { in: ["PENDING", "APPLIED"] },
    },
  });

  if (unpaidSanctions > 0) {
    return {
      valid: false,
      error:
        "Départ impossible : le membre possède des amendes ou sanctions impayées",
    };
  }

  return { valid: true };
}

// ─── R-021 : Total prêts actifs ≤ 80 % des fonds totaux ───────────────────
export async function validateLoanToFundRatio(
  associationId: string,
  prisma: PrismaClient,
  additionalLoanAmount = 0
): Promise<{ valid: boolean; error?: string }> {
  const activities = await prisma.associationActivity.findMany({
    where: { associationId },
    select: { caisseBalance: true },
  });

  const totalFunds = activities.reduce(
    (sum, a) => sum + (a.caisseBalance ?? 0),
    0
  );

  const loans = await prisma.assocLoan.findMany({
    where: {
      activity: { associationId },
      status: { in: ["ACTIVE", "APPROVED"] },
    },
    select: { amount: true },
  });

  const totalLoans =
    loans.reduce((sum, l) => sum + (l.amount ?? 0), 0) +
    Math.max(0, additionalLoanAmount);

  if (totalFunds <= 0) {
    if (totalLoans > 0) {
      return {
        valid: false,
        error: "Pas de fonds disponibles mais des prêts actifs existent",
      };
    }
    return { valid: true };
  }

  const ratio = totalLoans / totalFunds;
  if (ratio > 0.8) {
    return {
      valid: false,
      error: `Ratio prêts/fonds de ${(ratio * 100).toFixed(1)}% dépasse la limite de 80%`,
    };
  }

  return { valid: true };
}

// ─── R-022 : Taux d'intérêt plafonnés à 10%/mois par défaut ──────────────
export function validateInterestRateCap(
  interestRate: number,
  maxRate = 10
): { valid: boolean; error?: string } {
  if (interestRate < 0) {
    return { valid: false, error: "Le taux d'intérêt ne peut pas être négatif" };
  }
  if (interestRate > maxRate) {
    return {
      valid: false,
      error: `Taux d'intérêt (${interestRate}%) supérieur au plafond autorisé de ${maxRate}%/mois`,
    };
  }
  return { valid: true };
}

// ─── R-023 : Double validation pour les montants > 500 000 FCFA ──────────
export function validateDoubleValidation(
  amount: number,
  validators: string[]
): { valid: boolean; error?: string } {
  if (amount > 500_000 && validators.length < 2) {
    return {
      valid: false,
      error: "Montant supérieur à 500 000 FCFA : 2 validateurs requis",
    };
  }
  return { valid: true };
}

// ─── R-028 : Suppression vs Archivage d'un template (> 10 utilisations) ──
export function validateTemplateDeletionOrArchival(usageCount: number): {
  canDelete: boolean;
  shouldArchive: boolean;
  reason?: string;
} {
  if (usageCount > 10) {
    return {
      canDelete: false,
      shouldArchive: true,
      reason:
        "Un template utilisé par plus de 10 associations ne peut pas être supprimé, il doit être archivé",
    };
  }
  return { canDelete: true, shouldArchive: false };
}

// ─── R-029 & §11.3.2 : Anonymisation des données lors de conversion ──────
export function anonymizeAssociationForTemplate(
  association: Record<string, any>
): Record<string, any> {
  const activities = Array.isArray(association.activities)
    ? association.activities.map((a: Record<string, any>) => ({
        name: a.name,
        type: a.type,
        description: a.description ?? null,
        participation: a.participation ?? "MANDATORY",
        contributionAmount: a.contributionAmount ?? null,
        contributionFrequency: a.contributionFrequency ?? "MONTHLY",
        distributionMode: a.distributionMode ?? "ROTATION",
        penaltyAmount: a.penaltyAmount ?? null,
        gracePeriodDays: a.gracePeriodDays ?? 0,
        minMembers: a.minMembers ?? 2,
        maxMembers: a.maxMembers ?? null,
        solidarityPercent: a.solidarityPercent ?? 0,
        interestRate: a.interestRate ?? null,
        maxLoanMultiplier: a.maxLoanMultiplier ?? 3,
      }))
    : [];

  const regulations = Array.isArray(association.regulations)
    ? association.regulations.map((r: Record<string, any>) => ({
        articleNumber: r.articleNumber,
        title: r.title,
        content: r.content,
      }))
    : [];

  const customRoles = Array.isArray(association.customRoles)
    ? association.customRoles.map((cr: Record<string, any>) => ({
        name: cr.name,
        slug: cr.slug,
        description: cr.description ?? null,
        color: cr.color ?? "#165E39",
        permissions: cr.permissions,
      }))
    : [];

  const workflows = Array.isArray(association.approvalWorkflows)
    ? association.approvalWorkflows.map((wf: Record<string, any>) => ({
        name: wf.name,
        entityType: wf.entityType,
        votingLevel: wf.votingLevel,
        minVotesRequired: wf.minVotesRequired ?? null,
        timeoutHours: wf.timeoutHours ?? 72,
      }))
    : [];

  return {
    type: association.type,
    category: association.category ?? null,
    meetingFrequency: association.meetingFrequency ?? "MONTHLY",
    quorumPercent: association.quorumPercent ?? 50,
    lateThresholdMin: association.lateThresholdMin ?? 15,
    lateFineAmount: association.lateFineAmount ?? 500,
    absenceFineAmount: association.absenceFineAmount ?? 1000,
    defaultFineAmount: association.defaultFineAmount ?? 2000,
    gracePeriodDays: association.gracePeriodDays ?? 3,
    currency: association.currency ?? "XAF",
    activities,
    regulations,
    customRoles,
    workflows,
    // Strictly excluded per R-029: members, bankAccounts, loans, socialAids, caisseBalances, messages, documents
  };
}

// ─── §11.5.2 : Algorithme de Score de Popularité d'un Template ───────────
export function calculateTemplatePopularityScore(stats: {
  usageCount: number;
  activeAssociations: number;
  ratingAvg: number;
  ratingCount: number;
  completionRate: number;
}): number {
  const usageScore = Math.min(stats.usageCount / 100, 1) * 30;
  const retentionRate =
    stats.usageCount > 0 ? stats.activeAssociations / stats.usageCount : 0;
  const retentionScore = retentionRate * 25;
  const ratingScore =
    stats.ratingCount >= 3 ? (stats.ratingAvg / 5) * 25 : 12.5;
  const completionScore = (stats.completionRate / 100) * 20;

  return Math.round(
    usageScore + retentionScore + ratingScore + completionScore
  );
}

// ─── R-033 : Éligibilité à la conversion de modèle (90 jours actif) ───────
export async function validateTemplateConversionEligibility(
  associationId: string,
  prisma: PrismaClient
): Promise<{ valid: boolean; error?: string }> {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { status: true, activatedAt: true },
  });

  if (!association) {
    return { valid: false, error: "Association introuvable" };
  }

  if (association.status !== "ACTIVE") {
    return { valid: false, error: "L'association doit être ACTIVE" };
  }

  if (!association.activatedAt) {
    return { valid: false, error: "Date d'activation inconnue" };
  }

  const daysActive =
    (Date.now() - new Date(association.activatedAt).getTime()) /
    (1000 * 60 * 60 * 24);

  if (daysActive < 90) {
    return {
      valid: false,
      error: `L'association est active depuis ${Math.floor(daysActive)} jours (minimum 90 requis)`,
    };
  }

  return { valid: true };
}

// ─── §9.1 : Quorums par défaut selon le type de réunion ──────────────────
export function getDefaultMeetingQuorum(meetingType: string): number | null {
  switch (meetingType) {
    case "REGULAR":
      return 50;
    case "EXTRAORDINARY":
      return 66;
    case "BUREAU_MEETING":
    case "BUREAU":
      return 66;
    case "AG_ORDINARY":
    case "AG_EXTRAORDINARY":
    case "GENERAL":
      return 75;
    case "COMMISSION_MEETING":
    case "THEMATIC":
      return 50;
    case "SPEECH_CIRCLE":
      return null;
    default:
      return 50;
  }
}

// ─── SPECIFICATION.md §3.2 & R-050 : Sanctions progressives d'absence ─────
export function calculateProgressiveAbsenceFine(consecutiveAbsences: number): {
  fineAmount: number;
  action: "NONE" | "FINE" | "WARNING_AND_FINE" | "PROPOSE_RADIATION";
  notifyBureau: boolean;
} {
  if (consecutiveAbsences <= 0) {
    return { fineAmount: 0, action: "NONE", notifyBureau: false };
  }
  if (consecutiveAbsences === 1) {
    return { fineAmount: 1000, action: "FINE", notifyBureau: false };
  }
  if (consecutiveAbsences === 2) {
    return { fineAmount: 3000, action: "FINE", notifyBureau: false };
  }
  if (consecutiveAbsences >= 9) {
    return { fineAmount: 5000, action: "PROPOSE_RADIATION", notifyBureau: true };
  }
  if (consecutiveAbsences >= 6) {
    return { fineAmount: 5000, action: "WARNING_AND_FINE", notifyBureau: true };
  }
  // 3, 4, 5 consecutive absences: R-050 triggers automatic bureau notification at 3
  return {
    fineAmount: 5000,
    action: "FINE",
    notifyBureau: consecutiveAbsences >= 3,
  };
}

// ─── SPECIFICATION.md §6.2 : Algorithme d'Arbitrage & Priorisation Prêts ─
export function calculateLoanPriorityScore(params: {
  reliabilityScore: number; // 0-100
  regularityRate: number; // 0-100 (% cotisations à jour)
  seniorityMonths: number;
  capitalContributed: number;
  totalFundCapital: number;
}): number {
  const regularityComponent = Math.min(Math.max(params.regularityRate, 0), 100) * 0.35;
  const solvencyComponent = Math.min(Math.max(params.reliabilityScore, 0), 100) * 0.30;
  const seniorityComponent = Math.min(params.seniorityMonths / 24, 1) * 100 * 0.15;
  const capitalRatio =
    params.totalFundCapital > 0
      ? Math.min(params.capitalContributed / params.totalFundCapital, 1)
      : 0;
  const capitalComponent = capitalRatio * 100 * 0.20;

  return Math.round(
    (regularityComponent +
      solvencyComponent +
      seniorityComponent +
      capitalComponent) *
      10
  ) / 10;
}

// ─── SPECIFICATION.md §2.2 & §7.3 : Liquidation et Décès (75% / 25%) ─────
export function calculateDeceasedLiquidation(params: {
  totalAssets: number;
  unpaidLoans: number;
  unpaidFines: number;
  solidarityAidAmount?: number;
}): {
  grossAssets: number;
  totalDebts: number;
  netBalance: number;
  solidarityPayout: number;
  totalDistributable: number;
  childrenShare75: number;
  rightfulClaimantsShare25: number;
} {
  const grossAssets = Math.max(0, params.totalAssets);
  const totalDebts = Math.max(0, params.unpaidLoans) + Math.max(0, params.unpaidFines);
  const netBalance = grossAssets - totalDebts;
  const solidarityPayout = Math.max(0, params.solidarityAidAmount ?? 0);
  const totalDistributable = Math.max(0, netBalance + solidarityPayout);
  // Protocole de liquidation : 75% pour les enfants, 25% pour les ayants droit désignés
  const childrenShare75 = Math.round(totalDistributable * 0.75);
  const rightfulClaimantsShare25 = totalDistributable - childrenShare75;

  return {
    grossAssets,
    totalDebts,
    netBalance,
    solidarityPayout,
    totalDistributable,
    childrenShare75,
    rightfulClaimantsShare25,
  };
}

// ─── Matrice de transitions de statut ─────────────────────────────────────
export function validateStatusTransition(
  current: string,
  next: string
): boolean {
  const allowed: Record<string, string[]> = {
    DRAFT: ["PENDING"],
    PENDING: ["ACTIVE", "DRAFT"],
    ACTIVE: ["SUSPENDED", "DISSOLVED"],
    SUSPENDED: ["ACTIVE", "DISSOLVED"],
    DISSOLVED: [],
  };

  return allowed[current]?.includes(next) ?? false;
}
