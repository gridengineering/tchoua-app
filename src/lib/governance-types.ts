/**
 * Configuration de gouvernance de la plateforme.
 *
 * Toutes les règles métier administrables (KYC, confiance, quarantaine,
 * messagerie, wallet, RBAC/IAM/ACL, notifications, OpenAPI) sont décrites ici.
 * Les valeurs par défaut reproduisent le comportement historique ; le stockage
 * réel se fait dans SystemSetting sous la clé GOVERNANCE_CONFIG.
 */

export type KycAccess = {
  deposit: boolean;
  withdrawal: boolean;
  transfer: boolean;
  video: boolean;
  chat: boolean;
  loan: boolean;
  socialAid: boolean;
  createAssociation: boolean;
  joinAssociation: boolean;
};

export type KycLevelRule = {
  level: number;
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  requirements: string[];
  documents: string[];
  channels: string[];
  approval: "AUTO" | "BUREAU" | "ADMIN";
  validityDays: number;
  maxAmountPerTx: number;
  maxDaily: number;
  maxMonthly: number;
  access: KycAccess;
};

export type TrustCriterionRule = {
  key: string;
  label: string;
  max: number;
  enabled: boolean;
};

export type TrustLevelRule = {
  level: number;
  label: string;
  min: number;
  max: number;
};

export type QuarantineRule = {
  id: string;
  label: string;
  enabled: boolean;
  trigger: "TRUST_SCORE" | "KYC_FAILED" | "REPORTS" | "MANUAL";
  threshold: number;
  durationDays: number;
  blockLogin: boolean;
  blockWallet: boolean;
  blockAssociations: boolean;
  blockRtc: boolean;
  notify: boolean;
};

export type EmailAccount = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

export type EmailConfig = {
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtp: EmailAccount;
  imap: EmailAccount;
  pop3: EmailAccount;
};

export type PaymentProvider = {
  id: string;
  label: string;
  type: "MOBILE_MONEY" | "CARD" | "BANK" | "PAYPAL" | "CASH" | "WALLET";
  enabled: boolean;
  feePct: number;
  feeFixed: number;
  min: number;
  max: number;
  requiresKycLevel: number;
  instructions: string;
  config: Record<string, string>;
};

export type WalletConfig = {
  enabled: boolean;
  oneWalletPerMember: boolean;
  associationWalletEnabled: boolean;
  allowDeposit: boolean;
  allowWithdrawal: boolean;
  allowTransfer: boolean;
  allowAssociationFunding: boolean;
  depositMaxTx: number;
  depositMaxDay: number;
  withdrawalMaxTx: number;
  withdrawalMaxDay: number;
  transferMaxTx: number;
  transferMaxDay: number;
  otpWithdrawalThreshold: number;
  otpTransferThreshold: number;
  currency: string;
  providers: PaymentProvider[];
};

export type AclRule = {
  id: string;
  resource: string;
  actions: string[];
  roles: string[];
  description: string;
};

export type RbacConfig = {
  enabled: boolean;
  defaultDeny: boolean;
  roles: string[];
  acl: AclRule[];
  iamPolicies: Array<{
    id: string;
    name: string;
    effect: "ALLOW" | "DENY";
    subject: string;
    resource: string;
    actions: string[];
    condition: string;
  }>;
};

export type NotificationEventRule = {
  key: string;
  label: string;
  enabled: boolean;
  channels: Array<"IN_APP" | "CHAT" | "MEET" | "EMAIL" | "TURN">;
};

export type NotificationConfig = {
  enabled: boolean;
  mobileAppName: string;
  events: NotificationEventRule[];
};

export type OpenApiConfig = {
  enabled: boolean;
  version: "3.1.0";
  title: string;
  description: string;
  baseUrl: string;
  contactName: string;
  contactEmail: string;
  auth: "NONE" | "API_KEY" | "OAUTH2";
  apiKeyHeader: string;
  scopes: string[];
};

export type GovernanceConfig = {
  kyc: {
    enabled: boolean;
    levels: KycLevelRule[];
    // Si false (défaut), le KYC par montant n'est pas imposé automatiquement :
    // chaque association/activité définit son propre niveau requis.
    amountThresholdsEnabled: boolean;
    amountThresholds: Array<{ amount: number; level: number }>;
    allowSelfUpgrade: boolean;
    requireConsents: boolean;
  };
  trust: {
    enabled: boolean;
    levels: TrustLevelRule[];
    criteria: TrustCriterionRule[];
    quarantineBelow: number;
    recalculateOnKyc: boolean;
  };
  quarantine: {
    enabled: boolean;
    requireReason: boolean;
    rules: QuarantineRule[];
  };
  email: EmailConfig;
  wallet: WalletConfig;
  rbac: RbacConfig;
  notifications: NotificationConfig;
  openapi: OpenApiConfig;
};

const ACCESS_NONE: KycAccess = {
  deposit: false, withdrawal: false, transfer: false, video: false, chat: false,
  loan: false, socialAid: false, createAssociation: false, joinAssociation: false,
};
const ACCESS_BASIC: KycAccess = {
  deposit: true, withdrawal: true, transfer: true, video: true, chat: true,
  loan: true, socialAid: true, createAssociation: true, joinAssociation: true,
};
const ACCESS_STRONG: KycAccess = { ...ACCESS_BASIC };
const ACCESS_ENHANCED: KycAccess = { ...ACCESS_BASIC };

export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  kyc: {
    enabled: true,
    allowSelfUpgrade: true,
    requireConsents: true,
    amountThresholdsEnabled: false,
    amountThresholds: [
      { amount: 250_000, level: 1 },
      { amount: 2_000_000, level: 2 },
      { amount: 12_000_000, level: 3 },
    ],
    levels: [
      {
        level: 0, code: "NONE", label: "Non vérifié", shortLabel: "KYC 0",
        description: "Compte créé, identité non vérifiée. Consultation libre, opérations financières bloquées.",
        requirements: ["Compte actif", "Conditions de la plateforme acceptées"],
        documents: [], channels: [], approval: "AUTO", validityDays: 0,
        maxAmountPerTx: 0, maxDaily: 0, maxMonthly: 0, access: { ...ACCESS_NONE },
      },
      {
        level: 1, code: "BASIC", label: "Identité déclarée", shortLabel: "KYC 1",
        description: "Niveau de base pour cotiser, discuter et participer aux activités courantes.",
        requirements: ["Nom légal complet", "Téléphone joignable", "Ville et pays de résidence"],
        documents: [], channels: ["EMAIL", "PHONE", "WHATSAPP"], approval: "AUTO", validityDays: 365,
        maxAmountPerTx: 500_000, maxDaily: 1_000_000, maxMonthly: 5_000_000, access: { ...ACCESS_BASIC },
      },
      {
        level: 2, code: "VERIFIED", label: "Identité vérifiée", shortLabel: "KYC 2",
        description: "Pièce d'identité contrôlée ; accès aux opérations importantes et aux prêts.",
        requirements: ["Pièce d'identité", "Photo récente", "Adresse complète", "Validation bureau ou admin"],
        documents: ["ID_DOCUMENT", "PASSPORT_PHOTO"], channels: [], approval: "BUREAU", validityDays: 730,
        maxAmountPerTx: 5_000_000, maxDaily: 10_000_000, maxMonthly: 50_000_000, access: { ...ACCESS_STRONG },
      },
      {
        level: 3, code: "ENHANCED", label: "Vigilance renforcée", shortLabel: "KYC 3",
        description: "Niveau renforcé pour les montants élevés et les profils à risque (GAFI).",
        requirements: ["Identité vérifiée", "Justificatif de localisation", "Origine des fonds", "Validation renforcée"],
        documents: ["ID_DOCUMENT", "PASSPORT_PHOTO", "LOCATION_PROOF"], channels: [], approval: "ADMIN", validityDays: 365,
        maxAmountPerTx: 50_000_000, maxDaily: 100_000_000, maxMonthly: 500_000_000, access: { ...ACCESS_ENHANCED },
      },
    ],
  },
  trust: {
    enabled: true,
    quarantineBelow: 20,
    recalculateOnKyc: true,
    levels: [
      { level: 0, label: "Non évaluée", min: 0, max: 19 },
      { level: 1, label: "Découverte", min: 20, max: 39 },
      { level: 2, label: "Bronze", min: 40, max: 59 },
      { level: 3, label: "Argent", min: 60, max: 79 },
      { level: 4, label: "Or", min: 80, max: 94 },
      { level: 5, label: "Platine", min: 95, max: 100 },
    ],
    criteria: [
      { key: "fiche", label: "Qualité de la fiche association", max: 10, enabled: true },
      { key: "reglement", label: "Statuts et règlement intérieur", max: 15, enabled: true },
      { key: "preuves", label: "Documents et autorisations", max: 10, enabled: true },
      { key: "activite", label: "Niveau d'activité", max: 15, enabled: true },
      { key: "membres", label: "Membres actifs", max: 15, enabled: true },
      { key: "reunions", label: "Régularité des réunions", max: 10, enabled: true },
      { key: "fiscal", label: "Conformité financière", max: 10, enabled: true },
      { key: "notation", label: "Notation et fiabilité des membres", max: 10, enabled: true },
      { key: "kyc", label: "Couverture KYC / LBC-FT", max: 10, enabled: true },
      { key: "signalements", label: "Absence de signalement", max: 5, enabled: true },
    ],
  },
  quarantine: {
    enabled: true, requireReason: true,
    rules: [
      { id: "trust-critical", label: "Confiance critique", enabled: false, trigger: "TRUST_SCORE", threshold: 20, durationDays: 30, blockLogin: false, blockWallet: true, blockAssociations: true, blockRtc: true, notify: true },
      { id: "kyc-failed", label: "Échec KYC répété", enabled: false, trigger: "KYC_FAILED", threshold: 2, durationDays: 15, blockLogin: false, blockWallet: true, blockAssociations: false, blockRtc: true, notify: true },
      { id: "reports", label: "Signalements multiples", enabled: false, trigger: "REPORTS", threshold: 3, durationDays: 30, blockLogin: false, blockWallet: true, blockAssociations: true, blockRtc: true, notify: true },
      { id: "manual", label: "Décision administrative", enabled: true, trigger: "MANUAL", threshold: 0, durationDays: 0, blockLogin: true, blockWallet: true, blockAssociations: true, blockRtc: true, notify: true },
    ],
  },
  email: {
    enabled: false,
    fromName: "Tchoua",
    fromEmail: "no-reply@tchoua.com",
    replyTo: "support@tchoua.com",
    smtp: { enabled: false, host: "", port: 587, secure: false, user: "", password: "" },
    imap: { enabled: false, host: "", port: 993, secure: true, user: "", password: "" },
    pop3: { enabled: false, host: "", port: 995, secure: true, user: "", password: "" },
  },
  wallet: {
    enabled: true,
    oneWalletPerMember: true,
    associationWalletEnabled: true,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    allowAssociationFunding: true,
    depositMaxTx: 1_000_000,
    depositMaxDay: 2_000_000,
    withdrawalMaxTx: 500_000,
    withdrawalMaxDay: 1_000_000,
    transferMaxTx: 1_000_000,
    transferMaxDay: 2_000_000,
    otpWithdrawalThreshold: 100_000,
    otpTransferThreshold: 200_000,
    currency: "XAF",
    providers: [
      { id: "MTN_MOMO", label: "MTN Mobile Money", type: "MOBILE_MONEY", enabled: true, feePct: 1, feeFixed: 0, min: 100, max: 1_000_000, requiresKycLevel: 1, instructions: "Composez *126# puis validez la demande de paiement.", config: { operator: "MTN" } },
      { id: "ORANGE_MONEY", label: "Orange Money", type: "MOBILE_MONEY", enabled: true, feePct: 1, feeFixed: 0, min: 100, max: 1_000_000, requiresKycLevel: 1, instructions: "Composez #150# puis validez la demande de paiement.", config: { operator: "ORANGE" } },
      { id: "WAVE", label: "Wave", type: "MOBILE_MONEY", enabled: true, feePct: 0.5, feeFixed: 0, min: 100, max: 1_000_000, requiresKycLevel: 1, instructions: "Ouvrez Wave et confirmez la demande.", config: { operator: "WAVE" } },
      { id: "CAMTEL_MOMO", label: "Camtel Mobile Money", type: "MOBILE_MONEY", enabled: true, feePct: 1, feeFixed: 0, min: 100, max: 1_000_000, requiresKycLevel: 1, instructions: "Confirmez la demande sur votre téléphone Camtel.", config: { operator: "CAMTEL" } },
      { id: "VISA", label: "Carte Visa", type: "CARD", enabled: true, feePct: 2.5, feeFixed: 0, min: 500, max: 2_000_000, requiresKycLevel: 2, instructions: "Paiement 3-D Secure.", config: { network: "VISA" } },
      { id: "MASTERCARD", label: "Carte Mastercard", type: "CARD", enabled: true, feePct: 2.5, feeFixed: 0, min: 500, max: 2_000_000, requiresKycLevel: 2, instructions: "Paiement 3-D Secure.", config: { network: "MASTERCARD" } },
      { id: "PAYPAL", label: "PayPal", type: "PAYPAL", enabled: true, feePct: 3.4, feeFixed: 150, min: 1000, max: 5_000_000, requiresKycLevel: 2, instructions: "Redirection vers PayPal.", config: {} },
      { id: "BANK_TRANSFER", label: "Virement bancaire", type: "BANK", enabled: true, feePct: 0, feeFixed: 1000, min: 1000, max: 50_000_000, requiresKycLevel: 2, instructions: "Utilisez le compte bancaire de l'association.", config: {} },
      { id: "CASH", label: "Espèces", type: "CASH", enabled: true, feePct: 0, feeFixed: 500, min: 100, max: 1_000_000, requiresKycLevel: 1, instructions: "Remise au trésorier contre reçu.", config: {} },
    ],
  },
  rbac: {
    enabled: true,
    defaultDeny: true,
    roles: ["Admin Principal", "Administrateur", "Auditeur", "Support", "Lecteur"],
    acl: [
      { id: "acl-users", resource: "USERS", actions: ["READ", "CREATE", "UPDATE", "DELETE"], roles: ["Admin Principal", "Administrateur"], description: "Comptes système" },
      { id: "acl-associations", resource: "ASSOCIATIONS", actions: ["READ", "UPDATE"], roles: ["Admin Principal", "Administrateur", "Auditeur"], description: "Associations" },
      { id: "acl-wallets", resource: "WALLETS", actions: ["READ", "UPDATE"], roles: ["Admin Principal", "Administrateur"], description: "Portefeuilles" },
      { id: "acl-settings", resource: "SETTINGS", actions: ["READ", "UPDATE"], roles: ["Admin Principal"], description: "Paramètres et gouvernance" },
    ],
    iamPolicies: [
      { id: "iam-admin", name: "Administrateur plateforme", effect: "ALLOW", subject: "ROLE:Administrateur", resource: "*", actions: ["READ", "UPDATE"], condition: "MFA_REQUIRED" },
      { id: "iam-auditor", name: "Auditeur lecture seule", effect: "ALLOW", subject: "ROLE:Auditeur", resource: "AUDIT", actions: ["READ"], condition: "" },
    ],
  },
  notifications: {
    enabled: true,
    mobileAppName: "Tchoua Mobile",
    events: [
      { key: "WALLET_DEPOSIT", label: "Dépôt wallet", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "WALLET_WITHDRAWAL", label: "Retrait wallet", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "WALLET_TRANSFER", label: "Virement wallet", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "ASSOC_DEPOSIT", label: "Versement au compte association", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "ASSOC_PENDING", label: "Versement bancaire en attente", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "ASSOC_CONFIRM", label: "Versement bancaire confirmé", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "ASSOC_PAYOUT", label: "Paiement d'un membre", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "ASSOC_SETTLE", label: "Règlement d'un membre", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "ASSOC_ACTIVITY", label: "Bénéfice tontine / activité", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "KYC_APPROVED", label: "KYC approuvé", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "KYC_REJECTED", label: "KYC refusé", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "TRUST_CHANGED", label: "Niveau de confiance modifié", enabled: true, channels: ["IN_APP", "CHAT"] },
      { key: "QUARANTINE", label: "Quarantaine", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "MEETING_REMINDER", label: "Rappel de réunion", enabled: true, channels: ["IN_APP", "CHAT", "MEET"] },
      { key: "CONTRIBUTION_DUE", label: "Cotisation à échéance", enabled: true, channels: ["IN_APP", "CHAT"] },
      { key: "SECURITY_ALERT", label: "Alerte sécurité", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      { key: "MARKETPLACE_INTEREST", label: "Intérêt à une annonce Marketplace", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
    ],
  },
  openapi: {
    enabled: true,
    version: "3.1.0",
    title: "Tchoua Platform API",
    description: "Contrats OpenAPI pour les développeurs externes et partenaires fintech.",
    baseUrl: "https://www.tchoua.com/api",
    contactName: "Direction technique Tchoua",
    contactEmail: "api@tchoua.com",
    auth: "API_KEY",
    apiKeyHeader: "Authorization",
    scopes: ["members:read", "associations:read", "wallets:read", "wallets:write", "notifications:read"],
  },
};

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeGovernance(base: GovernanceConfig, patch: Record<string, any>): GovernanceConfig {
  const result: any = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (!(key in base)) continue;
    if (Array.isArray(value)) result[key] = value;
    else if (isObject(value) && isObject((base as any)[key])) {
      result[key] = { ...(base as any)[key], ...value };
    } else if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as GovernanceConfig;
}

export function kycRuleForLevel(config: GovernanceConfig, level: unknown): KycLevelRule {
  const n = Math.max(0, Math.min(3, Number(level) || 0));
  return config.kyc.levels.find((rule) => rule.level === n) ?? config.kyc.levels[0];
}

export function kycRequiredForAmount(config: GovernanceConfig, amount?: number | null): number {
  // Par défaut, aucun seuil automatique par montant : le KYC est piloté par
  // l'association et par l'activité. L'administration peut réactiver ces seuils.
  if (config.kyc.amountThresholdsEnabled !== true) return 1;
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 1;
  let required = 1;
  for (const threshold of [...config.kyc.amountThresholds].sort((a, b) => a.amount - b.amount)) {
    if (value >= threshold.amount) required = Math.max(required, threshold.level);
  }
  return required;
}

export function trustLevelForScoreWithConfig(config: GovernanceConfig, score: number): TrustLevelRule {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return config.trust.levels.find((level) => value >= level.min && value <= level.max)
    ?? config.trust.levels[0];
}
