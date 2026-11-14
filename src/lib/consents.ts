export const CONSENT_VERSION = "2026-11";

export type ConsentKey = "TERMS" | "PRIVACY" | "DATA_PROTECTION" | "CONFIDENTIALITY";

export type ConsentDocument = {
  key: ConsentKey;
  label: string;
  shortLabel: string;
  title: string;
  summary: string;
  points: string[];
};

export const CONSENT_DOCUMENTS: ConsentDocument[] = [
  {
    key: "TERMS",
    label: "Conditions d'utilisation",
    shortLabel: "CGU",
    title: "Conditions générales d'utilisation de la plateforme Tchoua",
    summary:
      "En utilisant tchoua.com, vous acceptez les règles de fonctionnement de la plateforme, l'usage loyal de votre compte et la véracité des informations que vous déclarez.",
    points: [
      "Vous êtes responsable de la confidentialité de vos identifiants.",
      "Les informations déclarées doivent être exactes et mises à jour.",
      "La plateforme facilite la gestion des associations ; chaque association reste responsable de ses décisions.",
      "Toute utilisation frauduleuse peut entraîner la suspension du compte.",
    ],
  },
  {
    key: "PRIVACY",
    label: "Politique de confidentialité",
    shortLabel: "Confidentialité",
    title: "Politique de confidentialité",
    summary:
      "Nous collectons uniquement les données nécessaires au fonctionnement du service et nous ne les vendons jamais. Vous disposez d'un droit d'accès, de rectification et de suppression.",
    points: [
      "Les données sont hébergées sur des serveurs maîtrisés et protégées par chiffrement en transit.",
      "Les données financières ne sont visibles que par vous et, lorsque leurs fonctions l'exigent, par le bureau de votre association.",
      "Les durées de conservation sont limitées à la gestion du compte et aux obligations légales.",
      "Vous pouvez demander la suppression de votre compte et de vos données personnelles.",
    ],
  },
  {
    key: "DATA_PROTECTION",
    label: "Protection des données personnelles",
    shortLabel: "Données personnelles",
    title: "Protection des données personnelles",
    summary:
      "Vos données d'identité, de contact et de situation financière sont traitées de façon limitée, sécurisée et proportionnée. Les vérifications KYC suivent une approche par risque.",
    points: [
      "Les pièces d'identité sont contrôlées uniquement pour vérifier votre identité et prévenir la fraude.",
      "Les niveaux KYC sont attribués selon le risque et peuvent être revus.",
      "Aucune donnée n'est partagée avec un tiers sans base légale ou accord explicite.",
      "Vous pouvez exercer vos droits en écrivant à l'administration de la plateforme.",
    ],
  },
  {
    key: "CONFIDENTIALITY",
    label: "Non-divulgation des informations financières",
    shortLabel: "Non-divulgation",
    title: "Engagement de non-divulgation des informations financières",
    summary:
      "Les informations financières de l'association et de ses membres sont confidentielles. Vous vous engagez à ne pas les divulguer à des personnes extérieures.",
    points: [
      "Ne pas partager les soldes, cotisations, prêts ou aides d'un autre membre.",
      "Ne pas diffuser les documents internes de l'association sans autorisation du bureau.",
      "Signaler toute fuite ou tentative d'accès non autorisé.",
      "Cet engagement reste valable après la fin de votre adhésion.",
    ],
  },
];

export const CONSENT_KEYS: ConsentKey[] = CONSENT_DOCUMENTS.map((d) => d.key);
