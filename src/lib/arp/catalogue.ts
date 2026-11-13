import type {
  ArpCombination,
  ArpConditionCode,
  ArpDimensionKey,
  ArpDimensions,
  ArpQualification,
} from "./types";

export type ArpDimensionValueDef = {
  value: string;
  label: string;
  hint: string;
};

export type ArpDimensionDef = {
  key: ArpDimensionKey;
  label: string;
  short: string;
  description: string;
  values: ArpDimensionValueDef[];
};

/**
 * Les dix dimensions du référentiel de combinaisons.
 * L'ordre est celui du catalogue : la dernière dimension varie le plus vite.
 */
export const ARP_DIMENSIONS: ArpDimensionDef[] = [
  {
    key: "organisation",
    label: "Forme d'organisation",
    short: "Structure",
    description:
      "Détermine le périmètre des décisions, la propriété des fonds et les règles d'héritage.",
    values: [
      { value: "autonome", label: "Association autonome", hint: "Décisions et comptes propres." },
      { value: "section", label: "Section interne", hint: "Socle de la mère et surcharges autorisées." },
      { value: "federation", label: "Fédération", hint: "Coordonne des entités, sans absorber leurs comptes." },
    ],
  },
  {
    key: "adhesion",
    label: "Mode d'adhésion",
    short: "Adhésion",
    description:
      "L'adhésion est un contrat distinct du compte de connexion ; elle porte les droits et obligations.",
    values: [
      { value: "individuelle", label: "Individuelle", hint: "Une personne, un matricule local." },
      { value: "familiale", label: "Familiale", hint: "Le ménage peut être l'unité de plafond." },
      { value: "institutionnelle", label: "Institutionnelle", hint: "Personne morale représentée par un mandataire." },
    ],
  },
  {
    key: "cotisation",
    label: "Assiette des cotisations",
    short: "Cotisation",
    description:
      "Une cotisation attendue est une créance ; l'encaissement et l'affectation restent séparés.",
    values: [
      { value: "fixe", label: "Montant fixe", hint: "Forfait par membre ou par ménage." },
      { value: "parts", label: "Parts", hint: "Quantité de parts et tarif unitaire." },
      { value: "nature", label: "Nature", hint: "Valorisation approuvée, sans liquidité automatique." },
    ],
  },
  {
    key: "tontine",
    label: "Mode de tontine",
    short: "Tontine",
    description:
      "Le moteur d'attribution sélectionne un droit, réserve les fonds, puis déclenche un paiement distinct.",
    values: [
      { value: "aucune", label: "Aucune tontine", hint: "Le module reste consultable mais fermé aux nouvelles souscriptions." },
      { value: "rotation", label: "Rotation", hint: "Ordre initial ou rang échangeable, historisé." },
      { value: "tirage", label: "Tirage", hint: "Algorithme publié et preuve du tirage conservée." },
      { value: "encheres", label: "Enchères", hint: "Assiette de décote nommée, offre horodatée par le serveur." },
    ],
  },
  {
    key: "credit",
    label: "Politique de crédit",
    short: "Crédit",
    description:
      "Le plafond est le minimum de limites indépendantes ; une décision n'est pas un décaissement.",
    values: [
      { value: "aucun", label: "Aucun crédit", hint: "Les prêts existants restent consultables et recouvrés." },
      { value: "zero", label: "Prêt à taux zéro", hint: "Échéancier sans intérêt implicite." },
      { value: "amortissable", label: "Prêt amortissable", hint: "Méthode, taux et convention temporelle explicites." },
    ],
  },
  {
    key: "aide",
    label: "Aides sociales",
    short: "Aide",
    description:
      "Une aide définitive ne crée pas de créance ; un prêt social en crée une. Les plafonds sont engagés avant paiement.",
    values: [
      { value: "aucune", label: "Aucune aide", hint: "Le fonds social reste fermé aux nouveaux droits." },
      { value: "forfait", label: "Forfait par événement", hint: "Montant plafonné par événement et par année." },
      { value: "jours", label: "Indemnité par jour", hint: "Minimum d'hospitalisation et jours indemnisables distincts." },
    ],
  },
  {
    key: "canal",
    label: "Canal de paiement principal",
    short: "Canal",
    description:
      "Chaque canal déclare ses capacités, ses frais et sa preuve de confirmation.",
    values: [
      { value: "especes", label: "Espèces", hint: "Reçu numéroté et contrôle de caisse." },
      { value: "banque", label: "Banque", hint: "Rapprochement sur relevé." },
      { value: "mobile_money", label: "Mobile Money", hint: "Confirmation externe et idempotence." },
    ],
  },
  {
    key: "devise",
    label: "Devises",
    short: "Devise",
    description:
      "Un montant sans devise est invalide ; aucun total n'additionne des devises différentes sans conversion explicite.",
    values: [
      { value: "unique", label: "Devise unique", hint: "Devise fonctionnelle verrouillée après la première écriture." },
      { value: "conversion", label: "Multi-devise avec conversion", hint: "Cours, date, source et marge conservés par opération." },
    ],
  },
  {
    key: "connexion",
    label: "Mode de connexion",
    short: "Connexion",
    description:
      "Le mode hors ligne conserve des brouillons ; il ne confirme jamais seul une dépense ou un vote sensible.",
    values: [
      { value: "en_ligne", label: "En ligne", hint: "Validation serveur immédiate." },
      { value: "hors_ligne", label: "Hors ligne toléré", hint: "Synchronisation avec clé stable et revalidation." },
    ],
  },
  {
    key: "validation",
    label: "Niveau de validation",
    short: "Validation",
    description:
      "La séparation des fonctions est vérifiée côté serveur, y compris pour les membres du bureau.",
    values: [
      { value: "simple", label: "Validation simple", hint: "Un valideur habilité." },
      { value: "double", label: "Double validation", hint: "Deux personnes distinctes sur les opérations sensibles." },
    ],
  },
];

export const ARP_DIMENSION_BY_KEY: Record<ArpDimensionKey, ArpDimensionDef> =
  Object.fromEntries(ARP_DIMENSIONS.map((d) => [d.key, d])) as Record<
    ArpDimensionKey,
    ArpDimensionDef
  >;

export type ArpConditionDef = {
  code: ArpConditionCode;
  label: string;
  message: string;
  requiredFields: string[];
  minVersion: string;
};

export const ARP_CONDITIONS: Record<ArpConditionCode, ArpConditionDef> = {
  C01: {
    code: "C01",
    label: "Liquidité de la nature",
    message:
      "Une cotisation en nature ne devient distribuable qu'après vente ou financement autorisé. La valorisation et la règle de liquidité doivent être définies.",
    requiredFields: ["prerequisites.natureValuation", "prerequisites.natureSaleLiquidity"],
    minVersion: "Lot 2 · Finance commune",
  },
  C02: {
    code: "C02",
    label: "Enchère hors ligne",
    message:
      "Une offre définitive exige un horodatage serveur. En mode hors ligne, la politique d'offre et la règle de clôture doivent être explicites.",
    requiredFields: [
      "prerequisites.auctionBasis",
      "prerequisites.auctionCloseRule",
      "prerequisites.offlineOfferPolicy",
    ],
    minVersion: "Lot 3 · Tontines complètes",
  },
  C03: {
    code: "C03",
    label: "Confirmation externe",
    message:
      "Un paiement Mobile Money hors ligne ne devient disponible qu'après confirmation externe vérifiable.",
    requiredFields: [
      "prerequisites.paymentProvider",
      "prerequisites.offlinePaymentPolicy",
      "prerequisites.externalConfirmation",
    ],
    minVersion: "Lot 6 · Intégrations",
  },
  C04: {
    code: "C04",
    label: "Politique de change",
    message:
      "La conversion exige une source de cours, une date, une marge et une devise de présentation. Les totaux multi-devises restent bloqués sans taux.",
    requiredFields: [
      "prerequisites.exchangeRateSource",
      "prerequisites.exchangeRateDate",
      "prerequisites.exchangeMarginPct",
      "prerequisites.presentationCurrency",
    ],
    minVersion: "Lot 2 · Finance commune",
  },
  C05: {
    code: "C05",
    label: "Unité de plafond familial",
    message:
      "Une adhésion familiale avec aides exige une unité de plafond (membre, ménage ou ayant droit) et une définition du ménage.",
    requiredFields: [
      "membership.familyCapUnit",
      "membership.householdDefinition",
    ],
    minVersion: "Lot 5 · Solidarité",
  },
  C06: {
    code: "C06",
    label: "Seuil et déport du crédit",
    message:
      "Un crédit en validation simple exige un seuil de décision et une règle de déport des personnes intéressées.",
    requiredFields: [
      "prerequisites.creditThresholdMinor",
      "prerequisites.creditConflictRule",
    ],
    minVersion: "Lot 4 · Crédit et épargne",
  },
};

export const ARP_CONDITION_ORDER: ArpConditionCode[] = [
  "C01",
  "C02",
  "C03",
  "C04",
  "C05",
  "C06",
];

/** Conditions déclenchées par une combinaison de dimensions. */
export function conditionsFor(dimensions: ArpDimensions): ArpConditionCode[] {
  const conditions: ArpConditionCode[] = [];
  if (dimensions.cotisation === "nature" && dimensions.tontine !== "aucune") {
    conditions.push("C01");
  }
  if (dimensions.tontine === "encheres" && dimensions.connexion === "hors_ligne") {
    conditions.push("C02");
  }
  if (dimensions.canal === "mobile_money" && dimensions.connexion === "hors_ligne") {
    conditions.push("C03");
  }
  if (dimensions.devise === "conversion") {
    conditions.push("C04");
  }
  if (dimensions.adhesion === "familiale" && dimensions.aide !== "aucune") {
    conditions.push("C05");
  }
  if (dimensions.credit !== "aucun" && dimensions.validation === "simple") {
    conditions.push("C06");
  }
  return conditions;
}

export function qualificationFor(
  conditions: ArpConditionCode[]
): ArpQualification {
  return conditions.length === 0
    ? "sans condition supplementaire du catalogue"
    : "conditionnelle";
}

export function evaluateCombination(dimensions: ArpDimensions): ArpCombination {
  const conditions = conditionsFor(dimensions);
  return {
    dimensions,
    conditions,
    qualification: qualificationFor(conditions),
    compatible: true,
  };
}

/** Toutes les combinaisons, dans l'ordre du catalogue (dernière dimension la plus rapide). */
export function allCombinations(): ArpCombination[] {
  const valueLists = ARP_DIMENSIONS.map((d) => d.values.map((v) => v.value));
  const out: ArpCombination[] = [];

  const walk = (index: number, current: Partial<ArpDimensions>) => {
    if (index === ARP_DIMENSIONS.length) {
      out.push(evaluateCombination(current as ArpDimensions));
      return;
    }
    const key = ARP_DIMENSIONS[index].key;
    for (const value of valueLists[index]) {
      walk(index + 1, { ...current, [key]: value });
    }
  };

  walk(0, {});
  return out;
}

export const ARP_CATALOGUE_SIZE = ARP_DIMENSIONS.reduce(
  (total, dimension) => total * dimension.values.length,
  1
);

/** Libellé lisible d'une combinaison, pour les journaux et les exports. */
export function describeCombination(dimensions: ArpDimensions): string {
  return ARP_DIMENSIONS.map(
    (d) => `${d.short}: ${ARP_DIMENSION_BY_KEY[d.key].values.find((v) => v.value === dimensions[d.key])?.label ?? dimensions[d.key]}`
  ).join(" · ");
}
