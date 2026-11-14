import { prisma } from "@/lib/prisma";
import { normalizeKycLevel, requiredKycForAmount, type KycLevel } from "@/lib/kyc";
import { CONSENT_KEYS, CONSENT_VERSION } from "@/lib/consents";

export type EligibilityFailure = {
  ok: false;
  code:
    | "MEMBERSHIP_REQUIRED"
    | "MEMBERSHIP_INACTIVE"
    | "PLATFORM_CONSENT_REQUIRED"
    | "REGULATION_APPROVAL_REQUIRED"
    | "KYC_LEVEL_REQUIRED";
  error: string;
  currentKyc?: KycLevel;
  requiredKyc?: KycLevel;
  missing?: string[];
};

export type EligibilityResult = { ok: true } | EligibilityFailure;

/**
 * Contrôle commun avant toute participation à une activité ou opération
 * financière : consentements plateforme, statut d'adhésion, KYC minimal et
 * approbation du règlement intérieur. Approche par risque (GAFI), sans
 * bloquer la simple consultation.
 */
export async function checkAssociationEligibility(
  userId: string,
  associationId: string,
  options: { amount?: number | null } = {}
): Promise<EligibilityResult> {
  const [association, membership, consents] = await Promise.all([
    prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        minKycLevel: true,
        requireRegulationApproval: true,
        quarantinedAt: true,
        _count: { select: { regulations: true } },
      },
    }),
    prisma.associationMembership.findUnique({
      where: { userId_associationId: { userId, associationId } },
      select: { id: true, status: true, user: { select: { kycLevel: true, quarantinedAt: true } } },
    }),
    prisma.platformConsent.findMany({
      where: { userId, version: CONSENT_VERSION },
      select: { document: true },
    }),
  ]);

  if (!association) {
    return { ok: false, code: "MEMBERSHIP_REQUIRED", error: "Association introuvable" };
  }
  if (association.quarantinedAt) {
    return { ok: false, code: "MEMBERSHIP_INACTIVE", error: "Cette association est en quarantaine administrative." };
  }
  if (!membership) {
    return { ok: false, code: "MEMBERSHIP_REQUIRED", error: "Vous n'êtes pas membre de cette association" };
  }
  if (membership.user.quarantinedAt) {
    return { ok: false, code: "MEMBERSHIP_INACTIVE", error: "Votre compte est en quarantaine administrative." };
  }

  const accepted = new Set(consents.map((c) => c.document));
  const missingConsents = CONSENT_KEYS.filter((key) => !accepted.has(key));
  if (missingConsents.length > 0) {
    return {
      ok: false,
      code: "PLATFORM_CONSENT_REQUIRED",
      error: "Acceptez les conditions et politiques de la plateforme avant de participer.",
      missing: missingConsents,
    };
  }

  if (!["ACTIVE", "PENDING"].includes(membership.status)) {
    return {
      ok: false,
      code: "MEMBERSHIP_INACTIVE",
      error: "Votre adhésion n'est pas active. Contactez le bureau de l'association.",
    };
  }

  if (association.requireRegulationApproval && association._count.regulations > 0) {
    const approved = await prisma.membershipRegulationApproval.count({
      where: { membershipId: membership.id },
    });
    if (approved < association._count.regulations) {
      return {
        ok: false,
        code: "REGULATION_APPROVAL_REQUIRED",
        error: "Approuvez les statuts et le règlement intérieur avant de participer à une activité.",
      };
    }
  }

  const currentKyc = normalizeKycLevel(membership.user.kycLevel);
  const requestedKyc = Math.max(
    1,
    Number(association.minKycLevel ?? 0),
    options.amount ? requiredKycForAmount(options.amount) : 1
  ) as KycLevel;

  if (currentKyc < requestedKyc) {
    return {
      ok: false,
      code: "KYC_LEVEL_REQUIRED",
      error: `Un niveau KYC ${requestedKyc} est requis pour cette opération (votre niveau actuel : KYC ${currentKyc}).`,
      currentKyc,
      requiredKyc: requestedKyc,
    };
  }

  return { ok: true };
}

export function eligibilityJson(result: EligibilityFailure) {
  return {
    error: result.error,
    code: result.code,
    currentKyc: result.currentKyc,
    requiredKyc: result.requiredKyc,
    missing: result.missing,
  };
}
