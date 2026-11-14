export type KycLevel = 0 | 1 | 2 | 3;

export type KycLevelInfo = {
  level: KycLevel;
  code: "NONE" | "BASIC" | "VERIFIED" | "ENHANCED";
  label: string;
  shortLabel: string;
  description: string;
  requirements: string[];
  badgeClass: string;
  dotClass: string;
  textClass: string;
};

export const KYC_LEVELS: KycLevelInfo[] = [
  {
    level: 0,
    code: "NONE",
    label: "Non vérifié",
    shortLabel: "KYC 0",
    description: "Compte créé, identité non encore déclarée. Consultation libre, opérations financières bloquées.",
    requirements: ["Compte actif", "Conditions de la plateforme acceptées"],
    badgeClass: "border-slate-300 bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
  },
  {
    level: 1,
    code: "BASIC",
    label: "Identité déclarée",
    shortLabel: "KYC 1",
    description: "Niveau de base pour cotiser et participer aux activités courantes. Vérification automatique des informations déclarées.",
    requirements: ["Nom légal complet", "Téléphone joignable", "Ville et pays de résidence"],
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    dotClass: "bg-sky-500",
    textClass: "text-sky-800",
  },
  {
    level: 2,
    code: "VERIFIED",
    label: "Identité vérifiée",
    shortLabel: "KYC 2",
    description: "Niveau requis pour les prêts et aides importantes. La pièce d'identité est contrôlée par le bureau ou l'administration.",
    requirements: ["Pièce d'identité (CNI, passeport ou titre de séjour)", "Adresse complète", "Validation par un agent habilité"],
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-800",
  },
  {
    level: 3,
    code: "ENHANCED",
    label: "Vigilance renforcée",
    shortLabel: "KYC 3",
    description: "Niveau renforcé pour les opérations élevées ou les profils à risque. Approche par risque conforme aux principes du GAFI.",
    requirements: ["Pièce d'identité vérifiée", "Justificatif d'adresse", "Origine des fonds et profession", "Validation renforcée"],
    badgeClass: "border-violet-200 bg-violet-50 text-violet-800",
    dotClass: "bg-violet-500",
    textClass: "text-violet-800",
  },
];

export function normalizeKycLevel(value: unknown): KycLevel {
  const n = Number(value);
  return n >= 3 ? 3 : n >= 2 ? 2 : n >= 1 ? 1 : 0;
}

export function kycLevelInfo(value: unknown): KycLevelInfo {
  return KYC_LEVELS[normalizeKycLevel(value)];
}

export function nextKycLevel(value: unknown): KycLevelInfo | null {
  const current = normalizeKycLevel(value);
  return current < 3 ? KYC_LEVELS[current + 1] : null;
}

/**
 * Seuils indicatifs, volontairement souples : l'association peut exiger
 * un niveau supérieur, et le bureau peut renforcer l'examen selon le risque.
 */
export function requiredKycForAmount(amount?: number | null): KycLevel {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 1;
  if (value <= 500_000) return 1;
  if (value <= 5_000_000) return 2;
  return 3;
}

export function kycLevelLabel(value: unknown): string {
  const info = kycLevelInfo(value);
  return `${info.shortLabel} · ${info.label}`;
}
