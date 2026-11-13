// Types du cadre ARP (Association Resource Planning).
// Référentiel : Tchoua ARP, édition du 13 novembre 2026, 36 domaines.

export const ARP_DIMENSION_KEYS = [
  "organisation",
  "adhesion",
  "cotisation",
  "tontine",
  "credit",
  "aide",
  "canal",
  "devise",
  "connexion",
  "validation",
] as const;

export type ArpDimensionKey = (typeof ARP_DIMENSION_KEYS)[number];

export type ArpOrganisation = "autonome" | "section" | "federation";
export type ArpAdhesion = "individuelle" | "familiale" | "institutionnelle";
export type ArpCotisation = "fixe" | "parts" | "nature";
export type ArpTontine = "aucune" | "rotation" | "tirage" | "encheres";
export type ArpCredit = "aucun" | "zero" | "amortissable";
export type ArpAide = "aucune" | "forfait" | "jours";
export type ArpCanal = "especes" | "banque" | "mobile_money";
export type ArpDevise = "unique" | "conversion";
export type ArpConnexion = "en_ligne" | "hors_ligne";
export type ArpValidationMode = "simple" | "double";

export type ArpDimensions = {
  organisation: ArpOrganisation;
  adhesion: ArpAdhesion;
  cotisation: ArpCotisation;
  tontine: ArpTontine;
  credit: ArpCredit;
  aide: ArpAide;
  canal: ArpCanal;
  devise: ArpDevise;
  connexion: ArpConnexion;
  validation: ArpValidationMode;
};

export type ArpConditionCode = "C01" | "C02" | "C03" | "C04" | "C05" | "C06";

export type ArpQualification =
  | "sans condition supplementaire du catalogue"
  | "conditionnelle";

export type ArpCombination = {
  dimensions: ArpDimensions;
  conditions: ArpConditionCode[];
  qualification: ArpQualification;
  compatible: boolean;
};

export type ArpStructure = "AUTONOME" | "SECTION" | "FEDERATION" | "COLLECTIF";
export type ArpStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type ArpOrigin = "MANUAL" | "BACKFILL" | "TEMPLATE";
export type ArpMembershipMode = "INDIVIDUELLE" | "FAMILIALE" | "INSTITUTIONNELLE" | "MIXTE";
export type ArpTerritory = "LOCAL" | "REGIONAL" | "NATIONAL" | "DIASPORA";
export type ArpDuration = "ILLIMITEE" | "PROJET" | "CYCLE";
export type ArpMajority = "RELATIVE" | "ABSOLUE" | "QUALIFIEE" | "UNANIMITE";
export type ArpAdmissionMode = "OUVERTE" | "INVITATION" | "PARRAINAGE" | "COMMISSION";
export type ArpFamilyCapUnit = "MEMBRE" | "MENAGE" | "AYANT_DROIT";

export type ArpModuleKey =
  | "tontine"
  | "savings"
  | "credit"
  | "socialAid"
  | "nature"
  | "meetings"
  | "projects"
  | "stocks"
  | "events"
  | "community"
  | "investment"
  | "collation";

export type ArpCapability =
  | "TONTINE"
  | "SAVINGS"
  | "CREDIT"
  | "SOCIAL_AID"
  | "NATURE"
  | "MEETINGS"
  | "PROJECTS"
  | "STOCKS"
  | "EVENTS"
  | "COMMUNITY"
  | "INVESTMENT"
  | "COLLATION";

export type ArpIdentity = {
  purposes: string[];
  legalStatus: string;
  legalStatusProof: string;
  country: string;
  currency: string;
  timezone: string;
  startModel: string;
  parentId: string | null;
  creationDate: string | null;
};

export type ArpGovernance = {
  quorumPct: number;
  majority: ArpMajority;
  convocationDays: number;
  mandateYears: number;
  maxRenewals: number;
  separationOfDuties: boolean;
  proxyMax: number;
  officersDeclared: boolean;
  creationDecisionRef: string;
};

export type ArpMembership = {
  admissionMode: ArpAdmissionMode;
  admissionFeeMinor: number;
  sponsorshipRequired: boolean;
  sponsorshipCount: number;
  ageMin: number;
  familyCapUnit: ArpFamilyCapUnit;
  householdDefinition: string;
  exitNoticeDays: number;
};

export type ArpFinance = {
  doubleValidationThresholdMinor: number;
  requireSupportingDocument: boolean;
  enforceBalancedJournal: boolean;
  allowNegativeFund: boolean;
  idempotentPayments: boolean;
  reservationExpiryDays: number;
};

export type ArpPrerequisites = {
  exchangeRateSource: string;
  exchangeRateDate: string;
  exchangeMarginPct: number;
  presentationCurrency: string;
  creditThresholdMinor: number;
  creditMaxRatioPct: number;
  creditConflictRule: string;
  natureValuation: string;
  natureSaleLiquidity: string;
  auctionBasis: string;
  auctionCloseRule: string;
  auctionMinBidPct: number;
  offlineOfferPolicy: string;
  offlinePaymentPolicy: string;
  externalConfirmation: boolean;
  paymentProvider: string;
  aideDailyCapMinor: number;
  aideAnnualCapMinor: number;
  inheritanceMode: string;
  delegateRule: string;
};

export type ArpModules = Record<ArpModuleKey, boolean>;

export type ArpControls = {
  isolation: boolean;
  audit: boolean;
  exactMoney: boolean;
  concurrency: boolean;
  immutableVersions: boolean;
};

export type ArpConfig = {
  schemaVersion: 1;
  identity: ArpIdentity;
  governance: ArpGovernance;
  membership: ArpMembership;
  finance: ArpFinance;
  dimensions: ArpDimensions;
  prerequisites: ArpPrerequisites;
  modules: ArpModules;
  controls: ArpControls;
  notes: string;
};

export type ArpIssueSeverity = "error" | "warning";

export type ArpIssue = {
  code: string;
  severity: ArpIssueSeverity;
  field?: string;
  domain?: string;
  message: string;
};

export type ArpValidationContext = {
  hasBureau?: boolean;
  hasRegulation?: boolean;
  hasCreationDecision?: boolean;
  hasParent?: boolean;
  hasExistingMovements?: boolean;
};

export type ArpValidation = {
  ok: boolean;
  errors: ArpIssue[];
  warnings: ArpIssue[];
  conditions: ArpConditionCode[];
  requiredFields: string[];
  completeness: number;
};

export type ArpCapabilities = Record<ArpCapability, boolean>;

export type ArpProfilePayload = {
  id: string;
  associationId: string;
  structure: string;
  status: ArpStatus;
  origin: ArpOrigin;
  version: number;
  config: ArpConfig;
  checks: ArpValidation | null;
  effectiveAt: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArpVersionPayload = {
  id: string;
  version: number;
  status: string;
  origin: string;
  hash: string;
  effectiveAt: string | null;
  createdAt: string;
  approvedById: string | null;
};

export type ArpFundType = "LIBRE" | "AFFECTE" | "RESERVE" | "DEPOT";

export type ArpFundPayload = {
  id: string;
  associationId: string;
  code: string;
  name: string;
  type: ArpFundType;
  currency: string;
  activityId: string | null;
  status: string;
  balanceMinor: string;
  reservedMinor: string;
  availableMinor: string;
  movements?: ArpMovementPayload[];
  reservations?: ArpReservationPayload[];
};

export type ArpMovementPayload = {
  id: string;
  direction: "IN" | "OUT";
  amountMinor: string;
  currency: string;
  valueDate: string;
  occurredAt: string;
  sourceType: string;
  sourceId: string | null;
  description: string;
  createdAt: string;
};

export type ArpReservationPayload = {
  id: string;
  amountMinor: string;
  currency: string;
  purpose: string;
  status: "ACTIVE" | "RELEASED" | "CONSUMED";
  expiresAt: string | null;
  createdAt: string;
};

// ── Référentiel des domaines (JSON généré depuis le document ARP) ────────────

export type ArpDomainOption = { label: string; values: string; note: string };
export type ArpDomainInvariant = { code: string; text: string };
export type ArpDomainFormField = { label: string; type: string; control: string };
export type ArpDomainWorkflowStep = { actor: string; action: string; control: string };
export type ArpDomainException = { case: string; handling: string; detail: string };
export type ArpDomainTest = { case: string; setup: string; expected: string };
export type ArpDomainCombination = { case: string; status: string; detail: string };
export type ArpDomainIndicator = { name: string; formula: string; note: string };

export type ArpDomain = {
  code: string;
  title: string;
  reference: string;
  intro: string;
  options: ArpDomainOption[];
  invariants: ArpDomainInvariant[];
  form: ArpDomainFormField[];
  workflow: ArpDomainWorkflowStep[];
  exceptions: ArpDomainException[];
  tests: ArpDomainTest[];
  combinations: ArpDomainCombination[];
  indicators: ArpDomainIndicator[];
};
