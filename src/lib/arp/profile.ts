import {
  ARP_DIMENSIONS,
  ARP_DIMENSION_BY_KEY,
  conditionsFor,
  describeCombination,
} from "./catalogue";
import type {
  ArpCapabilities,
  ArpConfig,
  ArpDimensions,
  ArpIssue,
  ArpModuleKey,
  ArpValidation,
  ArpValidationContext,
} from "./types";

export type ArpSeedActivity = {
  type: string;
  distributionMode?: string | null;
  contributionUnit?: string | null;
};

export type ArpSeed = {
  type?: string | null;
  parentId?: string | null;
  currency?: string | null;
  bureauConfig?: string | null;
  reglementHtml?: string | null;
  activities?: ArpSeedActivity[];
};

const MODULE_KEYS: ArpModuleKey[] = [
  "tontine",
  "savings",
  "credit",
  "socialAid",
  "nature",
  "meetings",
  "projects",
  "stocks",
  "events",
  "community",
  "investment",
  "collation",
];

function emptyModules(): Record<ArpModuleKey, boolean> {
  return MODULE_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: false }),
    {} as Record<ArpModuleKey, boolean>
  );
}

function normalizeCurrency(raw: string | null | undefined): string {
  const value = (raw ?? "").trim().toUpperCase();
  if (!value || value === "FCFA" || value === "XAF") return "XAF";
  if (value === "XOF") return "XOF";
  if (/^[A-Z]{3}$/.test(value)) return value;
  return "XAF";
}

function hasBureauConfig(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Boolean(
      parsed &&
        typeof parsed === "object" &&
        Object.values(parsed as Record<string, unknown>).some((value) =>
          Array.isArray(value) ? value.length > 0 : Boolean(value)
        )
    );
  } catch {
    return false;
  }
}

export function defaultArpConfig(seed: ArpSeed = {}): ArpConfig {
  const type = (seed.type ?? "OTHER").toUpperCase();
  const activities = seed.activities ?? [];
  const types = new Set(activities.map((a) => a.type.toUpperCase()));

  const dimensions: ArpDimensions = {
    organisation: seed.parentId ? "section" : "autonome",
    adhesion: "individuelle",
    cotisation: "fixe",
    tontine: "aucune",
    credit: "aucun",
    aide: "aucune",
    canal: "especes",
    devise: "unique",
    connexion: "en_ligne",
    validation: "simple",
  };

  const modules = emptyModules();
  modules.meetings = true;
  modules.community = true;

  const purposes: string[] = ["ENTRAIDE"];

  if (type === "TONTINE_CLUB") {
    dimensions.tontine = "rotation";
    modules.tontine = true;
    purposes.push("EPARGNE");
  }
  if (type === "COOPERATIVE" || type === "AGRICULTURAL") {
    dimensions.cotisation = "nature";
    modules.nature = true;
    modules.stocks = true;
    modules.projects = true;
    purposes.push("DEVELOPPEMENT");
  }
  if (type === "SOLIDARITY" || type === "MUTUAL") {
    dimensions.aide = "forfait";
    modules.socialAid = true;
    purposes.push("ENTRAIDE");
  }
  if (type === "INVESTMENT") {
    modules.investment = true;
    modules.savings = true;
    purposes.push("INVESTISSEMENT", "EPARGNE");
  }
  if (type === "CULTURAL") {
    modules.events = true;
    purposes.push("CULTURE");
  }
  if (type === "PROFESSIONAL") {
    modules.projects = true;
    purposes.push("PROFESSIONNEL");
  }
  if (type === "FEDERATION") {
    dimensions.organisation = "federation";
  }

  for (const activity of activities) {
    const activityType = activity.type.toUpperCase();
    if (activityType.startsWith("TONTINE")) {
      dimensions.tontine =
        activity.distributionMode === "AUCTION" || activityType.includes("ENCHERES")
          ? "encheres"
          : activity.distributionMode === "LOTTERY_MONTHLY" ||
              activity.distributionMode === "LOTTERY_UNIQUE" ||
              activityType.includes("ASCA")
            ? "tirage"
            : "rotation";
      modules.tontine = true;
      if (!purposes.includes("EPARGNE")) purposes.push("EPARGNE");
    }
    if (activityType === "PRET") {
      dimensions.credit = "amortissable";
      modules.credit = true;
    }
    if (activityType === "AIDE_SOLIDAIRE") {
      dimensions.aide = "forfait";
      modules.socialAid = true;
    }
    if (activityType === "EPARGNE") {
      modules.savings = true;
      if (!purposes.includes("EPARGNE")) purposes.push("EPARGNE");
    }
    if (activityType === "NATURE" || activity.contributionUnit === "NATURE") {
      dimensions.cotisation = "nature";
      modules.nature = true;
    }
    if (activityType === "INVESTISSEMENT") {
      modules.investment = true;
      if (!purposes.includes("INVESTISSEMENT")) purposes.push("INVESTISSEMENT");
    }
    if (activityType === "ACHATS_GROUPES") modules.stocks = true;
    if (activityType === "COLLECTION") modules.collation = true;
  }

  if (dimensions.tontine === "encheres") {
    modules.tontine = true;
  }

  const currency = normalizeCurrency(seed.currency);

  return {
    schemaVersion: 1,
    identity: {
      purposes,
      legalStatus: "",
      legalStatusProof: "",
      country: "CM",
      currency,
      timezone: "Africa/Douala",
      startModel: "BLANK",
      parentId: seed.parentId ?? null,
      creationDate: null,
    },
    governance: {
      quorumPct: 60,
      majority: "ABSOLUE",
      convocationDays: 30,
      mandateYears: 3,
      maxRenewals: 2,
      separationOfDuties: true,
      proxyMax: 1,
      officersDeclared: hasBureauConfig(seed.bureauConfig),
      creationDecisionRef: "",
    },
    membership: {
      admissionMode: "OUVERTE",
      admissionFeeMinor: 0,
      sponsorshipRequired: false,
      sponsorshipCount: 0,
      ageMin: 18,
      familyCapUnit: "MENAGE",
      householdDefinition: "",
      exitNoticeDays: 30,
    },
    finance: {
      doubleValidationThresholdMinor: 0,
      requireSupportingDocument: true,
      enforceBalancedJournal: true,
      allowNegativeFund: false,
      idempotentPayments: true,
      reservationExpiryDays: 30,
    },
    dimensions,
    prerequisites: {
      exchangeRateSource: "",
      exchangeRateDate: "",
      exchangeMarginPct: 0,
      presentationCurrency: currency,
      creditThresholdMinor: 0,
      creditMaxRatioPct: 80,
      creditConflictRule: "",
      natureValuation: "",
      natureSaleLiquidity: "",
      auctionBasis: "",
      auctionCloseRule: "",
      auctionMinBidPct: 5,
      offlineOfferPolicy: "",
      offlinePaymentPolicy: "",
      externalConfirmation: false,
      paymentProvider: "",
      aideDailyCapMinor: 0,
      aideAnnualCapMinor: 0,
      inheritanceMode: seed.parentId ? "" : "NONE",
      delegateRule: "",
    },
    modules,
    controls: {
      isolation: true,
      audit: true,
      exactMoney: true,
      concurrency: true,
      immutableVersions: true,
    },
    notes: "",
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeSection<T>(base: T, raw: unknown): T {
  if (!isPlainObject(raw)) return base;
  const merged: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(raw)) {
    if (!(key in merged)) continue;
    const current = merged[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = mergeSection(current, value);
    } else if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged as T;
}

/** Fusionne une configuration partielle avec les valeurs par défaut. */
export function normalizeArpConfig(raw: unknown, seed: ArpSeed = {}): ArpConfig {
  const base = defaultArpConfig(seed);
  if (!isPlainObject(raw)) return base;
  return {
    ...base,
    identity: mergeSection(base.identity, raw.identity),
    governance: mergeSection(base.governance, raw.governance),
    membership: mergeSection(base.membership, raw.membership),
    finance: mergeSection(base.finance, raw.finance),
    dimensions: mergeSection(base.dimensions, raw.dimensions),
    prerequisites: mergeSection(base.prerequisites, raw.prerequisites),
    modules: mergeSection(base.modules, raw.modules),
    controls: mergeSection(base.controls, raw.controls),
    notes: typeof raw.notes === "string" ? raw.notes : base.notes,
  };
}

function check(
  errors: ArpIssue[],
  condition: boolean,
  code: string,
  message: string,
  field?: string,
  domain?: string
) {
  if (!condition) {
    errors.push({ code, severity: "error", message, field, domain });
  }
}

function blank(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

export type ValidateOptions = {
  forActivation?: boolean;
};

export function validateArpConfig(
  config: ArpConfig,
  context: ArpValidationContext = {},
  options: ValidateOptions = {}
): ArpValidation {
  const errors: ArpIssue[] = [];
  const warnings: ArpIssue[] = [];
  const is = (v: unknown) => typeof v === "string" && v.trim().length > 0;

  // Dimensions : valeurs strictement issues du catalogue.
  for (const dimension of ARP_DIMENSIONS) {
    const value = config.dimensions[dimension.key];
    if (!dimension.values.some((v) => v.value === value)) {
      errors.push({
        code: "DIM_INVALID",
        severity: "error",
        field: `dimensions.${dimension.key}`,
        domain: "09",
        message: `Valeur « ${String(value)} » inconnue pour ${dimension.label}.`,
      });
    }
  }

  // Identité et activation (ORG01, ORG02, ORG04).
  if (config.identity.purposes.length === 0) {
    errors.push({
      code: "ORG01_PURPOSE",
      severity: "error",
      field: "identity.purposes",
      domain: "01",
      message: "Au moins une finalité doit être déclarée.",
    });
  }
  check(
    errors,
    /^[A-Z]{3}$/.test(config.identity.currency),
    "INT01_CURRENCY",
    "La devise fonctionnelle doit être un code ISO à trois lettres.",
    "identity.currency",
    "36"
  );
  check(
    errors,
    /^[A-Z]{2}$/.test(config.identity.country),
    "ORG_COUNTRY",
    "Le pays de l'entité doit être un code ISO à deux lettres.",
    "identity.country",
    "01"
  );
  check(
    errors,
    is(config.identity.timezone),
    "REU01_TIMEZONE",
    "Le fuseau horaire de l'association est requis.",
    "identity.timezone",
    "06"
  );
  check(
    errors,
    is(config.identity.startModel),
    "ORG_MODEL",
    "Le modèle de départ doit être identifié.",
    "identity.startModel",
    "01"
  );

  if (config.dimensions.organisation === "section" && !config.identity.parentId) {
    errors.push({
      code: "FED01_SECTION_PARENT",
      severity: "error",
      field: "identity.parentId",
      domain: "02",
      message: "Une section interne doit être rattachée à une association mère.",
    });
  }
  if (config.dimensions.organisation === "section" && blank(config.prerequisites.inheritanceMode)) {
    errors.push({
      code: "FED02_INHERITANCE",
      severity: "error",
      field: "prerequisites.inheritanceMode",
      domain: "02",
      message:
        "Une section doit définir son mode d'héritage (obligatoire, valeur par défaut ou libre).",
    });
  }
  if (config.dimensions.organisation === "federation" && blank(config.prerequisites.delegateRule)) {
    errors.push({
      code: "FED03_DELEGATES",
      severity: "error",
      field: "prerequisites.delegateRule",
      domain: "02",
      message: "Une fédération doit publier sa règle de délégués (taux, arrondi, plafond).",
    });
  }

  // Gouvernance (GOV01–GOV04).
  if (config.governance.quorumPct < 1 || config.governance.quorumPct > 100) {
    errors.push({
      code: "GOV_QUORUM",
      severity: "error",
      field: "governance.quorumPct",
      domain: "05",
      message: "Le quorum doit être compris entre 1 et 100 %.",
    });
  }
  if (config.governance.convocationDays < 1) {
    errors.push({
      code: "REU_CONVOCATION",
      severity: "error",
      field: "governance.convocationDays",
      domain: "06",
      message: "Le délai de convocation doit être d'au moins un jour.",
    });
  }
  if (config.governance.proxyMax < 0) {
    errors.push({
      code: "GOV_PROXY",
      severity: "error",
      field: "governance.proxyMax",
      domain: "05",
      message: "Le nombre de procurations par mandataire ne peut pas être négatif.",
    });
  }
  if (config.dimensions.validation === "double" && !config.governance.separationOfDuties) {
    errors.push({
      code: "SEC_SEPARATION",
      severity: "error",
      field: "governance.separationOfDuties",
      domain: "32",
      message:
        "La double validation exige la séparation des fonctions entre création, approbation et paiement.",
    });
  }

  // Conditions du catalogue.
  const conditions = conditionsFor(config.dimensions);
  const prerequisites = config.prerequisites;

  if (conditions.includes("C01")) {
    check(
      errors,
      is(prerequisites.natureValuation),
      "C01_VALUATION",
      "C01 : la méthode de valorisation des contributions en nature doit être définie.",
      "prerequisites.natureValuation",
      "10"
    );
    check(
      errors,
      is(prerequisites.natureSaleLiquidity),
      "C01_LIQUIDITY",
      "C01 : la règle de liquidité (vente ou financement) doit être définie avant distribution.",
      "prerequisites.natureSaleLiquidity",
      "10"
    );
  }

  if (config.dimensions.tontine === "encheres") {
    check(
      errors,
      is(prerequisites.auctionBasis),
      "C02_BASIS",
      "Enchères : l'assiette de la décote doit être nommée (pot, droit brut, cotisation ou forfait).",
      "prerequisites.auctionBasis",
      "15"
    );
    check(
      errors,
      is(prerequisites.auctionCloseRule),
      "C02_CLOSE",
      "Enchères : la règle de clôture, d'égalité et de prolongation doit être publiée.",
      "prerequisites.auctionCloseRule",
      "15"
    );
    check(
      errors,
      prerequisites.auctionMinBidPct > 0 && prerequisites.auctionMinBidPct <= 100,
      "C02_MIN_BID",
      "Enchères : la mise à prix doit être un pourcentage strictement positif et inférieur ou égal à 100.",
      "prerequisites.auctionMinBidPct",
      "15"
    );
  }
  if (conditions.includes("C02")) {
    check(
      errors,
      is(prerequisites.offlineOfferPolicy),
      "C02_OFFLINE",
      "C02 : en mode hors ligne, la politique d'offre définitive doit être explicite.",
      "prerequisites.offlineOfferPolicy",
      "15"
    );
  }

  if (conditions.includes("C03")) {
    check(
      errors,
      is(prerequisites.paymentProvider),
      "C03_PROVIDER",
      "C03 : le prestataire de paiement et sa preuve de confirmation doivent être identifiés.",
      "prerequisites.paymentProvider",
      "11"
    );
    check(
      errors,
      is(prerequisites.offlinePaymentPolicy),
      "C03_OFFLINE",
      "C03 : la politique de paiement hors ligne doit être définie.",
      "prerequisites.offlinePaymentPolicy",
      "11"
    );
    check(
      errors,
      prerequisites.externalConfirmation,
      "C03_CONFIRMATION",
      "C03 : la confirmation externe est obligatoire avant de rendre le solde disponible.",
      "prerequisites.externalConfirmation",
      "11"
    );
  }

  if (conditions.includes("C04")) {
    check(
      errors,
      is(prerequisites.exchangeRateSource),
      "C04_SOURCE",
      "C04 : la source du cours de change doit être identifiée.",
      "prerequisites.exchangeRateSource",
      "36"
    );
    check(
      errors,
      /^\d{4}-\d{2}-\d{2}$/.test(prerequisites.exchangeRateDate),
      "C04_DATE",
      "C04 : la date de référence du cours doit être renseignée (AAAA-MM-JJ).",
      "prerequisites.exchangeRateDate",
      "36"
    );
    check(
      errors,
      prerequisites.exchangeMarginPct >= 0,
      "C04_MARGIN",
      "C04 : la marge de change ne peut pas être négative.",
      "prerequisites.exchangeMarginPct",
      "36"
    );
    check(
      errors,
      /^[A-Z]{3}$/.test(prerequisites.presentationCurrency),
      "C04_PRESENTATION",
      "C04 : la devise de présentation doit être un code ISO à trois lettres.",
      "prerequisites.presentationCurrency",
      "36"
    );
    if (
      prerequisites.presentationCurrency === config.identity.currency &&
      config.dimensions.devise === "conversion"
    ) {
      warnings.push({
        code: "C04_SAME_CURRENCY",
        severity: "warning",
        field: "prerequisites.presentationCurrency",
        domain: "36",
        message:
          "La conversion est activée alors que la devise de présentation est identique à la devise fonctionnelle.",
      });
    }
  }

  if (conditions.includes("C05")) {
    check(
      errors,
      is(config.membership.householdDefinition),
      "C05_HOUSEHOLD",
      "C05 : la définition du ménage ou de l'ayant droit doit être précisée.",
      "membership.householdDefinition",
      "04"
    );
    check(
      errors,
      ["MEMBRE", "MENAGE", "AYANT_DROIT"].includes(config.membership.familyCapUnit),
      "C05_CAP_UNIT",
      "C05 : l'unité de plafond doit être le membre, le ménage ou l'ayant droit.",
      "membership.familyCapUnit",
      "22"
    );
  }

  if (conditions.includes("C06")) {
    check(
      errors,
      prerequisites.creditThresholdMinor > 0,
      "C06_THRESHOLD",
      "C06 : le seuil de décision du crédit doit être strictement positif.",
      "prerequisites.creditThresholdMinor",
      "18"
    );
    check(
      errors,
      is(prerequisites.creditConflictRule),
      "C06_CONFLICT",
      "C06 : la règle de déport des personnes intéressées doit être définie.",
      "prerequisites.creditConflictRule",
      "18"
    );
  }

  if (config.dimensions.aide === "jours" && prerequisites.aideDailyCapMinor <= 0) {
    errors.push({
      code: "SOL_DAILY_CAP",
      severity: "error",
      field: "prerequisites.aideDailyCapMinor",
      domain: "22",
      message: "Une aide indemnitaire par jour exige un plafond journalier strictement positif.",
    });
  }

  // Modules et capacités cohérents.
  const requiredModules: [boolean, ArpModuleKey, string][] = [
    [config.dimensions.tontine !== "aucune", "tontine", "tontine"],
    [config.dimensions.credit !== "aucun", "credit", "credit"],
    [config.dimensions.aide !== "aucune", "socialAid", "aides sociales"],
    [config.dimensions.cotisation === "nature", "nature", "contributions en nature"],
  ];
  for (const [needed, key, label] of requiredModules) {
    if (needed && !config.modules[key]) {
      errors.push({
        code: "MODULE_DISABLED",
        severity: "error",
        field: `modules.${key}`,
        domain: "09",
        message: `Le module ${label} doit rester actif tant que la dimension correspondante est ouverte.`,
      });
    }
  }
  if (config.dimensions.tontine === "aucune" && config.modules.tontine) {
    warnings.push({
      code: "MODULE_OPEN_NO_DIMENSION",
      severity: "warning",
      field: "modules.tontine",
      domain: "09",
      message: "Le module tontine est ouvert alors qu'aucune tontine n'est autorisée.",
    });
  }

  // Invariants non désactivables (REG04, SEC01–SEC04).
  for (const [key, label] of Object.entries(config.controls)) {
    if (!label) {
      errors.push({
        code: "CONTROL_DISABLED",
        severity: "error",
        field: `controls.${key}`,
        domain: "09",
        message: `Le contrôle « ${key} » est un invariant non désactivable.`,
      });
    }
  }
  if (!config.finance.enforceBalancedJournal) {
    errors.push({
      code: "FIN01_JOURNAL",
      severity: "error",
      field: "finance.enforceBalancedJournal",
      domain: "12",
      message: "Le journal doit rester équilibré : cet invariant ne peut pas être désactivé.",
    });
  }
  if (config.finance.allowNegativeFund) {
    errors.push({
      code: "FIN04_NEGATIVE",
      severity: "error",
      field: "finance.allowNegativeFund",
      domain: "12",
      message: "Aucun fonds ne peut être dépensé au-delà de son disponible autorisé.",
    });
  }

  // Conditions d'activation.
  if (options.forActivation) {
    if (!context.hasBureau && !config.governance.officersDeclared) {
      errors.push({
        code: "ORG02_BUREAU",
        severity: "error",
        field: "governance.officersDeclared",
        domain: "01",
        message:
          "ORG02 : les responsables du bureau doivent être renseignés avant l'activation définitive.",
      });
    }
    if (!context.hasRegulation && !config.identity.legalStatusProof) {
      warnings.push({
        code: "ORG02_RULES",
        severity: "warning",
        field: "identity.legalStatusProof",
        domain: "08",
        message:
          "Aucune preuve de textes (statuts ou règlement) n'est jointe ; l'activation reste possible mais le dossier est incomplet.",
      });
    }
    if (blank(config.governance.creationDecisionRef)) {
      errors.push({
        code: "ORG02_DECISION",
        severity: "error",
        field: "governance.creationDecisionRef",
        domain: "01",
        message: "ORG02 : la référence de la décision de création doit être conservée.",
      });
    }
  }

  if (config.identity.legalStatus === "") {
    warnings.push({
      code: "ORG04_STATUS",
      severity: "warning",
      field: "identity.legalStatus",
      domain: "01",
      message:
        "Le statut juridique déclaré n'est pas renseigné ; le modèle logiciel ne vaut pas statut déposé.",
    });
  }

  const requiredFields = conditions.flatMap((code) => {
    const condition = conditions.find((c) => c === code);
    if (!condition) return [];
    // Les champs requis sont ceux de la définition C01..C06.
    const defs: Record<string, string[]> = {
      C01: ["prerequisites.natureValuation", "prerequisites.natureSaleLiquidity"],
      C02: [
        "prerequisites.auctionBasis",
        "prerequisites.auctionCloseRule",
        "prerequisites.offlineOfferPolicy",
      ],
      C03: [
        "prerequisites.paymentProvider",
        "prerequisites.offlinePaymentPolicy",
        "prerequisites.externalConfirmation",
      ],
      C04: [
        "prerequisites.exchangeRateSource",
        "prerequisites.exchangeRateDate",
        "prerequisites.exchangeMarginPct",
        "prerequisites.presentationCurrency",
      ],
      C05: ["membership.familyCapUnit", "membership.householdDefinition"],
      C06: ["prerequisites.creditThresholdMinor", "prerequisites.creditConflictRule"],
    };
    return defs[condition] ?? [];
  });

  const completeness = computeCompleteness(config);
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    conditions,
    requiredFields: Array.from(new Set(requiredFields)),
    completeness,
  };
}

function readPath(config: ArpConfig, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, config);
}

function isFilled(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value > 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

export function computeCompleteness(config: ArpConfig): number {
  const core = [
    "identity.purposes",
    "identity.currency",
    "identity.country",
    "identity.timezone",
    "identity.startModel",
    "identity.legalStatus",
    "governance.quorumPct",
    "governance.majority",
    "governance.convocationDays",
    "membership.admissionMode",
    "finance.requireSupportingDocument",
  ];
  const conditional = conditionsFor(config.dimensions).flatMap((code) => {
    const map: Record<string, string[]> = {
      C01: ["prerequisites.natureValuation", "prerequisites.natureSaleLiquidity"],
      C02: ["prerequisites.auctionBasis", "prerequisites.auctionCloseRule", "prerequisites.offlineOfferPolicy"],
      C03: ["prerequisites.paymentProvider", "prerequisites.offlinePaymentPolicy", "prerequisites.externalConfirmation"],
      C04: ["prerequisites.exchangeRateSource", "prerequisites.exchangeRateDate", "prerequisites.presentationCurrency"],
      C05: ["membership.householdDefinition"],
      C06: ["prerequisites.creditThresholdMinor", "prerequisites.creditConflictRule"],
    };
    return map[code] ?? [];
  });
  const fields = Array.from(new Set([...core, ...conditional]));
  if (fields.length === 0) return 100;
  const filled = fields.filter((path) => isFilled(readPath(config, path))).length;
  return Math.round((filled / fields.length) * 100);
}

export function deriveCapabilities(config: ArpConfig): ArpCapabilities {
  return {
    TONTINE: config.dimensions.tontine !== "aucune" && config.modules.tontine,
    SAVINGS: config.modules.savings,
    CREDIT: config.dimensions.credit !== "aucun" && config.modules.credit,
    SOCIAL_AID: config.dimensions.aide !== "aucune" && config.modules.socialAid,
    NATURE: config.dimensions.cotisation === "nature" && config.modules.nature,
    MEETINGS: config.modules.meetings,
    PROJECTS: config.modules.projects,
    STOCKS: config.modules.stocks,
    EVENTS: config.modules.events,
    COMMUNITY: config.modules.community,
    INVESTMENT: config.modules.investment,
    COLLATION: config.modules.collation,
  };
}

export function capabilityForActivityType(type: string): keyof ArpCapabilities | null {
  const t = type.toUpperCase();
  if (t.startsWith("TONTINE")) return "TONTINE";
  if (t === "EPARGNE") return "SAVINGS";
  if (t === "PRET") return "CREDIT";
  if (t === "AIDE_SOLIDAIRE") return "SOCIAL_AID";
  if (t === "NATURE") return "NATURE";
  if (t === "INVESTISSEMENT") return "INVESTMENT";
  if (t === "ACHATS_GROUPES") return "STOCKS";
  if (t === "COLLECTION") return "COLLATION";
  return null;
}

export function summarizeProfile(config: ArpConfig): string {
  return `${describeCombination(config.dimensions)} · ${config.identity.currency}`;
}

export { ARP_DIMENSION_BY_KEY };
