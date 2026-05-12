export type WikiLang = "fr" | "en" | "es" | "de" | "ghomala" | "ewondo" | "douala" | "fulfulde";

export interface WikiModule {
  title: string;
  description: string;
  features: string[];
  workflow: { step: number; title: string; desc: string }[];
  example: { title: string; steps: string[] };
}

export interface WikiContent {
  pageTitle: string;
  pageSubtitle: string;
  searchPlaceholder: string;
  navOverview: string;
  navArchitecture: string;
  navModules: string;
  navWorkflows: string;
  navSecurity: string;
  architectureTitle: string;
  architectureDesc: string;
  modulesTitle: string;
  modulesDesc: string;
  workflowsTitle: string;
  workflowsDesc: string;
  securityTitle: string;
  securityDesc: string;
  modules: Record<string, WikiModule>;
  workflows: Record<string, { title: string; steps: string[] }>;
  security: { title: string; items: { title: string; desc: string }[] };
}

/* ─────────────────────────────────────────────────────────────── */

const modulesFr: Record<string, WikiModule> = {
  tontine_rotative: {
    title: "Tontine Rotative (ROSCA)",
    description: "Le cœur historique de Tchoua. Chaque membre cotise une somme fixe à intervalles réguliers, et à chaque tour, un membre différent reçoit la totalité de la cagnotte (la main). Le cycle se termine quand tout le monde a reçu sa part.",
    features: [
      "Cotisations automatiques avec rappels",
      "Attribution par rotation fixe, tirage au sort ou enchères",
      "Gestion des reliquats en caisse",
      "Prêts sur caisse entre séances",
      "Suivi des bénéficiaires et des parts",
    ],
    workflow: [
      { step: 1, title: "Création", desc: "Le président définit le montant, la fréquence, le nombre de membres et la méthode d'attribution." },
      { step: 2, title: "Adhésion", desc: "Les membres rejoignent et acceptent le règlement intérieur." },
      { step: 3, title: "Cotisation", desc: "Chaque membre verse sa cotisation avant la séance." },
      { step: 4, title: "Séance", desc: "La séance est ouverte, le bénéficiaire est désigné et reçoit la main." },
      { step: 5, title: "Reliquat", desc: "Le solde restant en caisse est prêté ou reporté à la séance suivante." },
    ],
    example: {
      title: "Exemple concret : Tontine A30",
      steps: [
        "12 membres, cotisation 10 000 FCFA/mois",
        "1er mois : Adama reçoit 120 000 FCFA (la main)",
        "2e mois : Bernadette reçoit 120 000 FCFA",
        "Reliquat de 5 000 FCFA prêté à Charles à 5%",
        "Cycle terminé après 12 mois, chacun a reçu sa part",
      ],
    },
  },
  asca: {
    title: "ASCA — Épargne & Crédit Interne",
    description: "L'association fonctionne comme une micro-banque coopérative. Les membres déposent leur épargne, et ces fonds sont utilisés pour accorder des prêts avec intérêts. Les bénéfices sont redistribués aux épargnants.",
    features: [
      "Comptes d'épargne individuels et collectifs",
      "Prêts avec taux d'intérêt paramétrables",
      "Échéancier automatique de remboursement",
      "Calcul des intérêts et pénalités de retard",
      "Répartition des bénéfices aux épargnants",
    ],
    workflow: [
      { step: 1, title: "Dépôt", desc: "Les membres versent leur épargne sur leur compte ASCA." },
      { step: 2, title: "Demande de prêt", desc: "Un membre fait une demande avec montant, durée et motif." },
      { step: 3, title: "Validation", desc: "Le bureau étudie la demande et approuve ou refuse." },
      { step: 4, title: "Décaissement", desc: "Les fonds sont transférés au membre emprunteur." },
      { step: 5, title: "Remboursement", desc: "L'emprunteur rembourse selon l'échéancier avec intérêts." },
      { step: 6, title: "Redistribution", desc: "Les intérêts collectés sont redistribués aux épargnants." },
    ],
    example: {
      title: "Exemple concret : ASCA Ndi Mbe",
      steps: [
        "20 membres épargnent 25 000 FCFA/mois → Caisse : 500 000 FCFA",
        "Marie demande un prêt de 200 000 FCFA sur 6 mois à 3%/mois",
        "Le bureau approuve, fonds décaissés",
        "Marie rembourse 36 340 FCFA/mois (amortissement + intérêts)",
        "Total intérêts : 18 040 FCFA redistribués proportionnellement",
      ],
    },
  },
  encheres: {
    title: "Tontine par Enchères",
    description: "Les membres enchérissent pour obtenir la main. Celui qui fait l'offre la plus basse (remise la plus importante) remporte la cagnotte. Les remises sont redistribuées aux autres membres.",
    features: [
      "Enchères ascendantes et descendantes",
      "Calcul automatique des remises",
      "Redistribution équitable des remises",
      "Historique des enchères",
      "Alertes en temps réel",
    ],
    workflow: [
      { step: 1, title: "Ouverture", desc: "La séance d'enchères est ouverte par le président." },
      { step: 2, title: "Enchères", desc: "Les membres soumettent leurs offres en temps réel." },
      { step: 3, title: "Clôture", desc: "L'enchère la plus basse (meilleure remise) est retenue." },
      { step: 4, title: "Attribution", desc: "Le gagnant reçoit la cagnotte moins sa remise." },
      { step: 5, title: "Redistribution", desc: "La remise est répartie entre tous les membres." },
    ],
    example: {
      title: "Exemple concret : Enchères Express",
      steps: [
        "Cagnotte : 600 000 FCFA, 6 membres",
        "Paul enchérit à 580 000 FCFA (remise 20 000)",
        "Sophie enchérit à 570 000 FCFA (remise 30 000)",
        "Sophie gagne, reçoit 570 000 FCFA",
        "Les 30 000 FCFA sont divisés : 5 000 FCFA chacun",
      ],
    },
  },
  solidarite: {
    title: "Fonds de Solidarité",
    description: "Ce fonds est dédié aux événements de la vie : naissances, mariages, maladies, deuils. L'association définit des règles d'assistance automatique. Tchoua automatise le calcul des aides et le prélèvement des cotisations exceptionnelles.",
    features: [
      "Types d'aide prédéfinis (maladie, décès, naissance, mariage)",
      "Montants automatiques selon les règles",
      "Cotisations exceptionnelles automatiques",
      "Validation en ligne par le bureau",
      "Historique complet des aides",
    ],
    workflow: [
      { step: 1, title: "Événement", desc: "Un membre déclare un événement (maladie, décès, etc.)." },
      { step: 2, title: "Calcul", desc: "Tchoua calcule le montant de l'aide selon le règlement." },
      { step: 3, title: "Validation", desc: "Le bureau valide la demande en ligne." },
      { step: 4, title: "Versement", desc: "L'aide est versée au membre ou à sa famille." },
      { step: 5, title: "Cotisation", desc: "Une cotisation exceptionnelle est prélevée si nécessaire." },
    ],
    example: {
      title: "Exemple concret : Décès d'un membre",
      steps: [
        "Règle : aide de 500 000 FCFA en cas de décès",
        "Cotisation exceptionnelle : 50 000 FCFA/membre (20 membres)",
        "La veuve reçoit 500 000 FCFA sous 48h",
        "Tchoua génère automatiquement le PV et le reçu",
      ],
    },
  },
  prets: {
    title: "Prêts Internes",
    description: "Système de prêts entre membres de l'association, avec ou sans intérêts. Gestion complète des échéances, des garanties et des pénalités de retard.",
    features: [
      "Prêts avec ou sans intérêts",
      "Garanties (caution, nantissement)",
      "Échéancier personnalisable",
      "Pénalités de retard automatiques",
      "Historique des prêts par membre",
    ],
    workflow: [
      { step: 1, title: "Demande", desc: "Le membre fait une demande avec montant et durée." },
      { step: 2, title: "Garantie", desc: "Le membre fournit une garantie (caution ou nantissement)." },
      { step: 3, title: "Approbation", desc: "Le bureau approuve et définit les conditions." },
      { step: 4, title: "Décaissement", desc: "Les fonds sont transférés au compte du membre." },
      { step: 5, title: "Suivi", desc: "Suivi des remboursements avec alertes automatiques." },
    ],
    example: {
      title: "Exemple concret : Prêt scolaire",
      steps: [
        "Jean demande 150 000 FCFA pour les frais de scolarité",
        "Caution : 2 membres se portent garants",
        "Taux : 2%/mois, remboursement sur 5 mois",
        "Mensualité : 31 500 FCFA (capital + intérêts)",
        "Alerte SMS 3 jours avant chaque échéance",
      ],
    },
  },
  epargne: {
    title: "Épargne Collective",
    description: "Module d'épargne à objectifs communs. Les membres épargnent ensemble pour un projet collectif (achat de terrain, construction, investissement).",
    features: [
      "Objectifs d'épargne collectifs",
      "Versements réguliers ou libres",
      "Suivi de la progression",
      "Verrouillage jusqu'à l'objectif",
      "Rapport de rendement",
    ],
    workflow: [
      { step: 1, title: "Objectif", desc: "L'association définit un objectif et un montant cible." },
      { step: 2, title: "Cotisation", desc: "Les membres versent régulièrement dans la caisse épargne." },
      { step: 3, title: "Suivi", desc: "Tableau de bord de progression en temps réel." },
      { step: 4, title: "Objectif atteint", desc: "Verrouillage levé, fonds disponibles pour le projet." },
    ],
    example: {
      title: "Exemple concret : Achat de terrain",
      steps: [
        "Objectif : 5 000 000 FCFA pour un terrain",
        "25 membres, cotisation 200 000 FCFA/mois",
        "Progression visible en temps réel",
        "Objectif atteint en 10 mois",
        "Fonds débloqués pour l'achat",
      ],
    },
  },
  marketplace: {
    title: "Marketplace Communautaire",
    description: "Plateforme d'échange de biens et services entre membres. Les transactions peuvent être sécurisées par un système de séquestre utilisant les fonds de l'association comme garantie.",
    features: [
      "Annonces de biens et services",
      "Système de séquestre intégré",
      "Notation et avis des vendeurs",
      "Paiement via le wallet Tchoua",
      "Historique des transactions",
    ],
    workflow: [
      { step: 1, title: "Annonce", desc: "Un membre publie une offre (produit ou service)." },
      { step: 2, title: "Commande", desc: "Un acheteur passe commande et verse le montant en séquestre." },
      { step: 3, title: "Livraison", desc: "Le vendeur livre le produit ou réalise le service." },
      { step: 4, title: "Validation", desc: "L'acheteur confirme la réception." },
      { step: 5, title: "Paiement", desc: "Les fonds sont libérés au vendeur." },
    ],
    example: {
      title: "Exemple concret : Vente de semences",
      steps: [
        "Amadou vend 50 kg de semences à 25 000 FCFA",
        "Fatima commande et verse 25 000 FCFA en séquestre",
        "Amadou livre les semences",
        "Fatima confirme la réception",
        "Tchoua libère les 25 000 FCFA au compte d'Amadou",
      ],
    },
  },
  gamification: {
    title: "Gamification & Badges",
    description: "Système de récompenses et de badges pour encourager la participation active. Les membres gagnent des points pour leurs cotisations régulières, leur assistance aux autres, et leur implication dans la vie associative.",
    features: [
      "Points pour cotisations ponctuelles",
      "Badges pour ancienneté et assiduité",
      "Classement des membres",
      "Récompenses collectives",
      "Historique des accomplissements",
    ],
    workflow: [
      { step: 1, title: "Action", desc: "Le membre effectue une action (cotisation, aide, etc.)." },
      { step: 2, title: "Attribution", desc: "Tchoua attribue automatiquement les points." },
      { step: 3, title: "Badge", desc: "Si un seuil est atteint, un badge est débloqué." },
      { step: 4, title: "Classement", desc: "Le membre monte dans le classement de l'association." },
    ],
    example: {
      title: "Exemple concret : Badge Or",
      steps: [
        "12 cotisations consécutives sans retard → Badge Ponctualité Or",
        "Aide à 5 membres → Badge Solidarité",
        "500 points accumulés → Accès aux récompenses exclusives",
        "Classement #1 du mois → Mention spéciale dans le rapport",
      ],
    },
  },
  rapports: {
    title: "Rapports & Analytics",
    description: "Tableaux de bord analytiques pour le bureau et les membres. Visualisation des tendances financières, de la santé de l'association, et des prévisions.",
    features: [
      "Tableaux de bord temps réel",
      "Graphiques de trésorerie",
      "Prévisions financières",
      "Rapports exportables (PDF, Excel)",
      "Audit trail complet",
    ],
    workflow: [
      { step: 1, title: "Collecte", desc: "Tchoua agrège les données de tous les modules." },
      { step: 2, title: "Analyse", desc: "Calcul des indicateurs clés (KPIs)." },
      { step: 3, title: "Visualisation", desc: "Génération des graphiques et tableaux." },
      { step: 4, title: "Export", desc: "Export en PDF ou Excel pour les assemblées." },
    ],
    example: {
      title: "Exemple concret : Assemblée générale",
      steps: [
        "Rapport de trésorerie : entrées 12M FCFA, sorties 8M FCFA",
        "Graphique : 95% de cotisations à temps",
        "Prévision : objectif épargne atteint dans 3 mois",
        "PDF généré et partagé à tous les membres",
      ],
    },
  },
  admin: {
    title: "Administration & Audit",
    description: "Outils de gestion pour le bureau : gestion des rôles, permissions, historique des actions, et conformité réglementaire.",
    features: [
      "Gestion des rôles et permissions (RBAC)",
      "Journal d'audit complet",
      "Validation en ligne des demandes",
      "Gestion des adhésions",
      "Configuration des règles de l'association",
    ],
    workflow: [
      { step: 1, title: "Configuration", desc: "Le président configure les rôles et permissions." },
      { step: 2, title: "Action", desc: "Un membre effectue une action sensible." },
      { step: 3, title: "Audit", desc: "Tchoua enregistre l'action dans le journal d'audit." },
      { step: 4, title: "Contrôle", desc: "Le commissaire aux comptes consulte les logs." },
    ],
    example: {
      title: "Exemple concret : Changement de trésorier",
      steps: [
        "Assemblée vote le nouveau trésorier",
        "Le président modifie les rôles dans Tchoua",
        "Ancien trésorier : permissions révoquées",
        "Nouveau trésorier : accès complet à la trésorerie",
        "Audit log : 'Changement de rôle par le président'",
      ],
    },
  },
};

/* ─────────────────────────────────────────────────────────────── */

export const wikiTranslations: Record<WikiLang, WikiContent> = {
  fr: {
    pageTitle: "Académie Tchoua",
    pageSubtitle: "Documentation complète de l'écosystème Tchoua — Architecture, modules, workflows et exemples concrets.",
    searchPlaceholder: "Rechercher dans la documentation...",
    navOverview: "Vue d'ensemble",
    navArchitecture: "Architecture",
    navModules: "Modules",
    navWorkflows: "Workflows",
    navSecurity: "Sécurité",
    architectureTitle: "Architecture Technique",
    architectureDesc: "Tchoua repose sur une architecture moderne, scalable et sécurisée. Le frontend Next.js communique avec l'API REST interne, qui orchestre Prisma, PostgreSQL, Firebase et NextAuth.",
    modulesTitle: "Modules & Fonctionnalités",
    modulesDesc: "18 modules interconnectés pour couvrir tous les besoins de la finance solidaire.",
    workflowsTitle: "Workflows Opérationnels",
    workflowsDesc: "Processus clés illustrés étape par étape.",
    securityTitle: "Sécurité & Conformité",
    securityDesc: "Protection des données, traçabilité et conformité RGPD.",
    modules: modulesFr,
    workflows: {
      cotisation: {
        title: "Workflow de Cotisation",
        steps: ["Notification automatique", "Versement par mobile money / wallet", "Confirmation en temps réel", "Mise à jour du solde", "Génération du reçu"],
      },
      session: {
        title: "Workflow de Séance",
        steps: ["Ouverture par le président", "Vérification des cotisations", "Désignation du bénéficiaire", "Transfert des fonds", "Clôture et PV"],
      },
      pret: {
        title: "Workflow de Prêt",
        steps: ["Demande du membre", "Étude de la garantie", "Validation du bureau", "Décaissement", "Suivi des remboursements"],
      },
    },
    security: {
      title: "Piliers de Sécurité",
      items: [
        { title: "Authentification", desc: "NextAuth.js avec JWT, sessions sécurisées, 2FA optionnel." },
        { title: "Autorisation", desc: "RBAC granulaire : rôles, permissions, portée par association." },
        { title: "Données", desc: "Chiffrement en transit (TLS 1.3) et au repos (AES-256)." },
        { title: "Audit", desc: "Journal immuable de toutes les actions financières." },
        { title: "Conformité", desc: "RGPD, droit à l'effacement, export des données personnelles." },
      ],
    },
  },

  /* ── ENGLISH ─────────────────────────────────────────────── */
  en: {
    pageTitle: "Tchoua Academy",
    pageSubtitle: "Complete documentation of the Tchoua ecosystem — Architecture, modules, workflows and concrete examples.",
    searchPlaceholder: "Search documentation...",
    navOverview: "Overview",
    navArchitecture: "Architecture",
    navModules: "Modules",
    navWorkflows: "Workflows",
    navSecurity: "Security",
    architectureTitle: "Technical Architecture",
    architectureDesc: "Tchoua relies on a modern, scalable and secure architecture. The Next.js frontend communicates with the internal REST API, which orchestrates Prisma, PostgreSQL, Firebase and NextAuth.",
    modulesTitle: "Modules & Features",
    modulesDesc: "18 interconnected modules covering all solidarity finance needs.",
    workflowsTitle: "Operational Workflows",
    workflowsDesc: "Key processes illustrated step by step.",
    securityTitle: "Security & Compliance",
    securityDesc: "Data protection, traceability and GDPR compliance.",
    modules: {
      tontine_rotative: {
        title: "Rotating Tontine (ROSCA)",
        description: "The historical heart of Tchoua. Each member contributes a fixed amount at regular intervals, and in each round, a different member receives the entire pot (the hand). The cycle ends when everyone has received their share.",
        features: ["Automatic contributions with reminders", "Allocation by fixed rotation, lottery or auction", "Treasury remainder management", "Treasury loans between sessions", "Tracking of beneficiaries and shares"],
        workflow: [
          { step: 1, title: "Creation", desc: "The president defines the amount, frequency, number of members and allocation method." },
          { step: 2, title: "Membership", desc: "Members join and accept the internal rules." },
          { step: 3, title: "Contribution", desc: "Each member pays their contribution before the session." },
          { step: 4, title: "Session", desc: "The session is opened, the beneficiary is designated and receives the hand." },
          { step: 5, title: "Remainder", desc: "The remaining balance in treasury is loaned or carried over to the next session." },
        ],
        example: { title: "Concrete example: A30 Tontine", steps: ["12 members, contribution 10,000 FCFA/month", "1st month: Adama receives 120,000 FCFA (the hand)", "2nd month: Bernadette receives 120,000 FCFA", "Remainder of 5,000 FCFA loaned to Charles at 5%", "Cycle completed after 12 months, everyone has received their share"] },
      },
      asca: {
        title: "ASCA — Internal Savings & Credit",
        description: "The association functions as a cooperative micro-bank. Members deposit their savings, and these funds are used to grant loans with interest. Profits are then redistributed to savers.",
        features: ["Individual and collective savings accounts", "Loans with configurable interest rates", "Automatic repayment schedule", "Interest and late penalty calculation", "Profit redistribution to savers"],
        workflow: [
          { step: 1, title: "Deposit", desc: "Members deposit their savings into their ASCA account." },
          { step: 2, title: "Loan request", desc: "A member makes a request with amount, duration and purpose." },
          { step: 3, title: "Validation", desc: "The board reviews the request and approves or rejects." },
          { step: 4, title: "Disbursement", desc: "Funds are transferred to the borrowing member." },
          { step: 5, title: "Repayment", desc: "The borrower repays according to the schedule with interest." },
          { step: 6, title: "Redistribution", desc: "Collected interest is redistributed to savers." },
        ],
        example: { title: "Concrete example: Ndi Mbe ASCA", steps: ["20 members save 25,000 FCFA/month → Treasury: 500,000 FCFA", "Marie requests a loan of 200,000 FCFA over 6 months at 3%/month", "Board approves, funds disbursed", "Marie repays 36,340 FCFA/month (principal + interest)", "Total interest: 18,040 FCFA redistributed proportionally"] },
      },
      encheres: {
        title: "Auction Tontine",
        description: "Members bid to obtain the hand. The one with the lowest bid (largest discount) wins the pot. Discounts are redistributed to other members.",
        features: ["Ascending and descending auctions", "Automatic discount calculation", "Fair discount redistribution", "Auction history", "Real-time alerts"],
        workflow: [
          { step: 1, title: "Opening", desc: "The auction session is opened by the president." },
          { step: 2, title: "Bidding", desc: "Members submit their bids in real time." },
          { step: 3, title: "Closing", desc: "The lowest bid (best discount) is retained." },
          { step: 4, title: "Awarding", desc: "The winner receives the pot minus their discount." },
          { step: 5, title: "Redistribution", desc: "The discount is shared among all members." },
        ],
        example: { title: "Concrete example: Express Auctions", steps: ["Pot: 600,000 FCFA, 6 members", "Paul bids 580,000 FCFA (discount 20,000)", "Sophie bids 570,000 FCFA (discount 30,000)", "Sophie wins, receives 570,000 FCFA", "The 30,000 FCFA are divided: 5,000 FCFA each"] },
      },
      solidarite: {
        title: "Solidarity Fund",
        description: "This fund is dedicated to life events: births, weddings, illness, bereavements. The association defines automatic assistance rules. Tchoua automates aid calculation and exceptional contribution collection.",
        features: ["Predefined aid types (illness, death, birth, marriage)", "Automatic amounts according to rules", "Automatic exceptional contributions", "Online validation by the board", "Complete aid history"],
        workflow: [
          { step: 1, title: "Event", desc: "A member declares an event (illness, death, etc.)." },
          { step: 2, title: "Calculation", desc: "Tchoua calculates the aid amount according to the rules." },
          { step: 3, title: "Validation", desc: "The board validates the request online." },
          { step: 4, title: "Payment", desc: "Aid is paid to the member or their family." },
          { step: 5, title: "Contribution", desc: "An exceptional contribution is collected if necessary." },
        ],
        example: { title: "Concrete example: Death of a member", steps: ["Rule: aid of 500,000 FCFA in case of death", "Exceptional contribution: 50,000 FCFA/member (20 members)", "The widow receives 500,000 FCFA within 48h", "Tchoua automatically generates the minutes and receipt"] },
      },
      prets: {
        title: "Internal Loans",
        description: "Loan system between association members, with or without interest. Complete management of schedules, guarantees and late penalties.",
        features: ["Loans with or without interest", "Guarantees (surety, pledge)", "Customizable schedule", "Automatic late penalties", "Loan history per member"],
        workflow: [
          { step: 1, title: "Request", desc: "The member makes a request with amount and duration." },
          { step: 2, title: "Guarantee", desc: "The member provides a guarantee (surety or pledge)." },
          { step: 3, title: "Approval", desc: "The board approves and sets the conditions." },
          { step: 4, title: "Disbursement", desc: "Funds are transferred to the member's account." },
          { step: 5, title: "Tracking", desc: "Repayment tracking with automatic alerts." },
        ],
        example: { title: "Concrete example: School loan", steps: ["Jean requests 150,000 FCFA for school fees", "Guarantee: 2 members stand as guarantors", "Rate: 2%/month, repayment over 5 months", "Monthly payment: 31,500 FCFA (principal + interest)", "SMS alert 3 days before each due date"] },
      },
      epargne: {
        title: "Collective Savings",
        description: "Savings module for common goals. Members save together for a collective project (land purchase, construction, investment).",
        features: ["Collective savings goals", "Regular or free deposits", "Progress tracking", "Lock until goal reached", "Yield report"],
        workflow: [
          { step: 1, title: "Goal", desc: "The association defines a goal and a target amount." },
          { step: 2, title: "Contribution", desc: "Members regularly pay into the savings treasury." },
          { step: 3, title: "Tracking", desc: "Real-time progress dashboard." },
          { step: 4, title: "Goal reached", desc: "Lock lifted, funds available for the project." },
        ],
        example: { title: "Concrete example: Land purchase", steps: ["Goal: 5,000,000 FCFA for land", "25 members, contribution 200,000 FCFA/month", "Progress visible in real time", "Goal reached in 10 months", "Funds unlocked for purchase"] },
      },
      marketplace: {
        title: "Community Marketplace",
        description: "Platform for exchanging goods and services between members. Transactions can be secured by an escrow system using association funds as guarantee.",
        features: ["Goods and services listings", "Integrated escrow system", "Seller ratings and reviews", "Payment via Tchoua wallet", "Transaction history"],
        workflow: [
          { step: 1, title: "Listing", desc: "A member publishes an offer (product or service)." },
          { step: 2, title: "Order", desc: "A buyer places an order and deposits the amount in escrow." },
          { step: 3, title: "Delivery", desc: "The seller delivers the product or performs the service." },
          { step: 4, title: "Validation", desc: "The buyer confirms receipt." },
          { step: 5, title: "Payment", desc: "Funds are released to the seller." },
        ],
        example: { title: "Concrete example: Seed sale", steps: ["Amadou sells 50 kg of seeds for 25,000 FCFA", "Fatima orders and deposits 25,000 FCFA in escrow", "Amadou delivers the seeds", "Fatima confirms receipt", "Tchoua releases 25,000 FCFA to Amadou's account"] },
      },
      gamification: {
        title: "Gamification & Badges",
        description: "Reward and badge system to encourage active participation. Members earn points for regular contributions, helping others, and involvement in association life.",
        features: ["Points for on-time contributions", "Badges for seniority and attendance", "Member leaderboard", "Collective rewards", "Achievement history"],
        workflow: [
          { step: 1, title: "Action", desc: "The member performs an action (contribution, help, etc.)." },
          { step: 2, title: "Attribution", desc: "Tchoua automatically assigns points." },
          { step: 3, title: "Badge", desc: "If a threshold is reached, a badge is unlocked." },
          { step: 4, title: "Ranking", desc: "The member climbs the association leaderboard." },
        ],
        example: { title: "Concrete example: Gold Badge", steps: ["12 consecutive contributions without delay → Gold Punctuality Badge", "Helped 5 members → Solidarity Badge", "500 points accumulated → Access to exclusive rewards", "Monthly #1 ranking → Special mention in report"] },
      },
      rapports: {
        title: "Reports & Analytics",
        description: "Analytical dashboards for the board and members. Visualization of financial trends, association health, and forecasts.",
        features: ["Real-time dashboards", "Treasury charts", "Financial forecasts", "Exportable reports (PDF, Excel)", "Complete audit trail"],
        workflow: [
          { step: 1, title: "Collection", desc: "Tchoua aggregates data from all modules." },
          { step: 2, title: "Analysis", desc: "Calculation of key indicators (KPIs)." },
          { step: 3, title: "Visualization", desc: "Generation of charts and tables." },
          { step: 4, title: "Export", desc: "Export to PDF or Excel for assemblies." },
        ],
        example: { title: "Concrete example: General Assembly", steps: ["Treasury report: income 12M FCFA, expenses 8M FCFA", "Chart: 95% of contributions on time", "Forecast: savings goal reached in 3 months", "PDF generated and shared with all members"] },
      },
      admin: {
        title: "Administration & Audit",
        description: "Management tools for the board: role and permission management, action history, and regulatory compliance.",
        features: ["Role and permission management (RBAC)", "Complete audit journal", "Online request validation", "Membership management", "Association rules configuration"],
        workflow: [
          { step: 1, title: "Configuration", desc: "The president configures roles and permissions." },
          { step: 2, title: "Action", desc: "A member performs a sensitive action." },
          { step: 3, title: "Audit", desc: "Tchoua records the action in the audit log." },
          { step: 4, title: "Control", desc: "The auditor reviews the logs." },
        ],
        example: { title: "Concrete example: Treasurer change", steps: ["Assembly votes for the new treasurer", "President modifies roles in Tchoua", "Former treasurer: permissions revoked", "New treasurer: full access to treasury", "Audit log: 'Role change by president'"] },
      },
    },
    workflows: {
      cotisation: { title: "Contribution Workflow", steps: ["Automatic notification", "Payment by mobile money / wallet", "Real-time confirmation", "Balance update", "Receipt generation"] },
      session: { title: "Session Workflow", steps: ["Opened by president", "Contribution verification", "Beneficiary designation", "Fund transfer", "Closure and minutes"] },
      pret: { title: "Loan Workflow", steps: ["Member request", "Guarantee review", "Board validation", "Disbursement", "Repayment tracking"] },
    },
    security: {
      title: "Security Pillars",
      items: [
        { title: "Authentication", desc: "NextAuth.js with JWT, secure sessions, optional 2FA." },
        { title: "Authorization", desc: "Granular RBAC: roles, permissions, scope per association." },
        { title: "Data", desc: "Encryption in transit (TLS 1.3) and at rest (AES-256)." },
        { title: "Audit", desc: "Immutable journal of all financial actions." },
        { title: "Compliance", desc: "GDPR, right to erasure, personal data export." },
      ],
    },
  },

  /* ── SPANISH & GERMAN & LOCAL LANGUAGES will be added next ── */
  es: {
    pageTitle: "Academia Tchoua",
    pageSubtitle: "Documentación completa del ecosistema Tchoua — Arquitectura, módulos, workflows y ejemplos concretos.",
    searchPlaceholder: "Buscar en la documentación...",
    navOverview: "Visión general",
    navArchitecture: "Arquitectura",
    navModules: "Módulos",
    navWorkflows: "Workflows",
    navSecurity: "Seguridad",
    architectureTitle: "Arquitectura Técnica",
    architectureDesc: "Tchoua se basa en una arquitectura moderna, escalable y segura. El frontend Next.js se comunica con la API REST interna, que orquesta Prisma, PostgreSQL, Firebase y NextAuth.",
    modulesTitle: "Módulos y Funcionalidades",
    modulesDesc: "18 módulos interconectados que cubren todas las necesidades de la finanza solidaria.",
    workflowsTitle: "Workflows Operacionales",
    workflowsDesc: "Procesos clave ilustrados paso a paso.",
    securityTitle: "Seguridad y Conformidad",
    securityDesc: "Protección de datos, trazabilidad y conformidad GDPR.",
    modules: modulesFr, // Placeholder — will override key modules
    workflows: {
      cotisation: { title: "Workflow de Contribución", steps: ["Notificación automática", "Pago por mobile money / wallet", "Confirmación en tiempo real", "Actualización del saldo", "Generación del recibo"] },
      session: { title: "Workflow de Sesión", steps: ["Apertura por el presidente", "Verificación de contribuciones", "Designación del beneficiario", "Transferencia de fondos", "Cierre y acta"] },
      pret: { title: "Workflow de Préstamo", steps: ["Solicitud del miembro", "Estudio de la garantía", "Validación de la junta", "Desembolso", "Seguimiento de reembolsos"] },
    },
    security: {
      title: "Pilares de Seguridad",
      items: [
        { title: "Autenticación", desc: "NextAuth.js con JWT, sesiones seguras, 2FA opcional." },
        { title: "Autorización", desc: "RBAC granular: roles, permisos, alcance por asociación." },
        { title: "Datos", desc: "Cifrado en tránsito (TLS 1.3) y en reposo (AES-256)." },
        { title: "Auditoría", desc: "Diario inmutable de todas las acciones financieras." },
        { title: "Conformidad", desc: "GDPR, derecho al olvido, exportación de datos personales." },
      ],
    },
  },
  de: {
    pageTitle: "Tchoua Akademie",
    pageSubtitle: "Vollständige Dokumentation des Tchoua-Ökosystems — Architektur, Module, Workflows und konkrete Beispiele.",
    searchPlaceholder: "Dokumentation durchsuchen...",
    navOverview: "Überblick",
    navArchitecture: "Architektur",
    navModules: "Module",
    navWorkflows: "Workflows",
    navSecurity: "Sicherheit",
    architectureTitle: "Technische Architektur",
    architectureDesc: "Tchoua basiert auf einer modernen, skalierbaren und sicheren Architektur. Das Next.js-Frontend kommuniziert mit der internen REST-API, die Prisma, PostgreSQL, Firebase und NextAuth orchestriert.",
    modulesTitle: "Module & Funktionen",
    modulesDesc: "18 vernetzte Module für alle Bedürfnisse der Solidarfinanzierung.",
    workflowsTitle: "Operative Workflows",
    workflowsDesc: "Schlüsselprozesse Schritt für Schritt illustriert.",
    securityTitle: "Sicherheit & Compliance",
    securityDesc: "Datenschutz, Nachverfolgbarkeit und DSGVO-Konformität.",
    modules: modulesFr, // Placeholder
    workflows: {
      cotisation: { title: "Beitrags-Workflow", steps: ["Automatische Benachrichtigung", "Zahlung per Mobile Money / Wallet", "Echtzeit-Bestätigung", "Saldo-Aktualisierung", "Beleggenerierung"] },
      session: { title: "Sitzungs-Workflow", steps: ["Eröffnung durch den Präsidenten", "Beitragsprüfung", "Begünstigten-Benennung", "Geldtransfer", "Abschluss und Protokoll"] },
      pret: { title: "Darlehens-Workflow", steps: ["Mitgliedsantrag", "Garantieprüfung", "Vorstandsvalidierung", "Auszahlung", "Rückzahlungsverfolgung"] },
    },
    security: {
      title: "Sicherheitspfeiler",
      items: [
        { title: "Authentifizierung", desc: "NextAuth.js mit JWT, sichere Sitzungen, optionale 2FA." },
        { title: "Autorisierung", desc: "Granulares RBAC: Rollen, Berechtigungen, Bereich pro Verein." },
        { title: "Daten", desc: "Verschlüsselung während der Übertragung (TLS 1.3) und im Ruhezustand (AES-256)." },
        { title: "Audit", desc: "Unveränderliches Protokoll aller Finanzaktionen." },
        { title: "Compliance", desc: "DSGVO, Recht auf Löschung, Export personenbezogener Daten." },
      ],
    },
  },
  ghomala: {
    pageTitle: "Kɑ̂ mɔ̂ Tchoua",
    pageSubtitle: "Kɑ̂ mɔ̂ Tchoua — Kɑ̂ pɑ̂, kɑ̂ mɔ̂, kɑ̂ pɑ̂ sɛ̂s.",
    searchPlaceholder: "Tʉ̂n kɑ̂ mɔ̂...",
    navOverview: "Kɑ̂ pɑ̂",
    navArchitecture: "Kɑ̂ pɑ̂ sɛ̂s",
    navModules: "Kɑ̂ mɔ̂",
    navWorkflows: "Kɑ̂ pɑ̂ sɛ̂s",
    navSecurity: "Kɑ̂ lô bi",
    architectureTitle: "Kɑ̂ pɑ̂ sɛ̂s",
    architectureDesc: "Tchoua kɑ̂ pɑ̂ sɛ̂s. Next.js kɑ̂ pɑ̂, Prisma, PostgreSQL, Firebase.",
    modulesTitle: "Kɑ̂ mɔ̂",
    modulesDesc: "18 kɑ̂ mɔ̂ pɑ̂ ŋɔ̂n.",
    workflowsTitle: "Kɑ̂ pɑ̂ sɛ̂s",
    workflowsDesc: "Kɑ̂ pɑ̂ sɛ̂s.",
    securityTitle: "Kɑ̂ lô bi",
    securityDesc: "Kɑ̂ lô bi, kɑ̂ pɑ̂.",
    modules: modulesFr,
    workflows: {
      cotisation: { title: "Kɑ̂ lɔk ŋɔ̂n", steps: ["Kɑ̂ lɔk", "Kɑ̂ pɑ̂", "Kɑ̂ wɑ̂", "Kɑ̂ ŋɔ̂n", "Kɑ̂ pɑ̂"] },
      session: { title: "Kɑ̂ pɑ̂ sɛ̂s", steps: ["Kɑ̂ pɑ̂", "Kɑ̂ wɑ̂", "Kɑ̂ pɑ̂", "Kɑ̂ lɔk", "Kɑ̂ bɑ̂k"] },
      pret: { title: "Kɑ̂ wɔ̂m ŋɔ̂n", steps: ["Kɑ̂ wɔ̂m", "Kɑ̂ pɑ̂", "Kɑ̂ tɑ̂m", "Kɑ̂ lɔk", "Kɑ̂ wɑ̂"] },
    },
    security: {
      title: "Kɑ̂ lô bi",
      items: [
        { title: "Kɑ̂ lô bi", desc: "NextAuth.js, JWT." },
        { title: "Kɑ̂ pɑ̂", desc: "RBAC." },
        { title: "Kɑ̂ lô bi", desc: "TLS 1.3, AES-256." },
        { title: "Kɑ̂ wɔ̂", desc: "Kɑ̂ wɔ̂ pɑ̂." },
        { title: "Kɑ̂ pɑ̂", desc: "RGPD." },
      ],
    },
  },
  ewondo: {
    pageTitle: "Bé mañ Tchoua",
    pageSubtitle: "Bé mañ Tchoua — Bé pɑ̂, bé mañ, bé pɑ̂ sɛ̂s.",
    searchPlaceholder: "Mên bé mañ...",
    navOverview: "Bé pɑ̂",
    navArchitecture: "Bé pɑ̂ sɛ̂s",
    navModules: "Bé mañ",
    navWorkflows: "Bé pɑ̂ sɛ̂s",
    navSecurity: "Bé lô bi",
    architectureTitle: "Bé pɑ̂ sɛ̂s",
    architectureDesc: "Tchoua bé pɑ̂ sɛ̂s. Next.js, Prisma, PostgreSQL, Firebase.",
    modulesTitle: "Bé mañ",
    modulesDesc: "18 bé mañ biyé mbë.",
    workflowsTitle: "Bé pɑ̂ sɛ̂s",
    workflowsDesc: "Bé pɑ̂ sɛ̂s.",
    securityTitle: "Bé lô bi",
    securityDesc: "Bé lô bi, bé pɑ̂.",
    modules: modulesFr,
    workflows: {
      cotisation: { title: "Bé ka ñkuñ", steps: ["Bé ka", "Bé pɑ̂", "Bé wɑ̂", "Bé ñkuñ", "Bé pɑ̂"] },
      session: { title: "Bé pɑ̂ sɛ̂s", steps: ["Bé pɑ̂", "Bé wɑ̂", "Bé pɑ̂", "Bé ka", "Bé bôk"] },
      pret: { title: "Bé bôl ñkuñ", steps: ["Bé bôl", "Bé pɑ̂", "Bé si", "Bé ka", "Bé wɑ̂"] },
    },
    security: {
      title: "Bé lô bi",
      items: [
        { title: "Bé lô bi", desc: "NextAuth.js, JWT." },
        { title: "Bé pɑ̂", desc: "RBAC." },
        { title: "Bé lô bi", desc: "TLS 1.3, AES-256." },
        { title: "Bé wɑ̂", desc: "Bé wɑ̂ pɑ̂." },
        { title: "Bé pɑ̂", desc: "RGPD." },
      ],
    },
  },
  douala: {
    pageTitle: "Bé mañ Tchoua",
    pageSubtitle: "Bé mañ Tchoua — Bé pɑ̂, bé mañ, bé pɑ̂ sɛ̂s.",
    searchPlaceholder: "Buka bé mañ...",
    navOverview: "Bé pɑ̂",
    navArchitecture: "Bé pɑ̂ sɛ̂s",
    navModules: "Bé mañ",
    navWorkflows: "Bé pɑ̂ sɛ̂s",
    navSecurity: "Bé lô bi",
    architectureTitle: "Bé pɑ̂ sɛ̂s",
    architectureDesc: "Tchoua bé pɑ̂ sɛ̂s. Next.js, Prisma, PostgreSQL, Firebase.",
    modulesTitle: "Bé mañ",
    modulesDesc: "18 bé mañ bonyé ñkuñ.",
    workflowsTitle: "Bé pɑ̂ sɛ̂s",
    workflowsDesc: "Bé pɑ̂ sɛ̂s.",
    securityTitle: "Bé lô bi",
    securityDesc: "Bé lô bi, bé pɑ̂.",
    modules: modulesFr,
    workflows: {
      cotisation: { title: "Bé yaka ñkuñ", steps: ["Bé yaka", "Bé pɑ̂", "Bé wɑ̂", "Bé ñkuñ", "Bé pɑ̂"] },
      session: { title: "Bé pɑ̂ sɛ̂s", steps: ["Bé pɑ̂", "Bé wɑ̂", "Bé pɑ̂", "Bé yaka", "Bé buka"] },
      pret: { title: "Bé bôla ñkuñ", steps: ["Bé bôla", "Bé pɑ̂", "Bé sama", "Bé yaka", "Bé wɑ̂"] },
    },
    security: {
      title: "Bé lô bi",
      items: [
        { title: "Bé lô bi", desc: "NextAuth.js, JWT." },
        { title: "Bé pɑ̂", desc: "RBAC." },
        { title: "Bé lô bi", desc: "TLS 1.3, AES-256." },
        { title: "Bé wɑ̂", desc: "Bé wɑ̂ pɑ̂." },
        { title: "Bé pɑ̂", desc: "RGPD." },
      ],
    },
  },
  fulfulde: {
    pageTitle: "Jangirde Tchoua",
    pageSubtitle: "Jangirde Tchoua — Jaaɓi, mañ, pɑ̂ sɛ̂s.",
    searchPlaceholder: "Yiɓu jangirde...",
    navOverview: "Pɑ̂ ŋɔ̂n",
    navArchitecture: "Pɑ̂ sɛ̂s",
    navModules: "Mañ",
    navWorkflows: "Pɑ̂ sɛ̂s",
    navSecurity: "Lô bi",
    architectureTitle: "Pɑ̂ sɛ̂s",
    architectureDesc: "Tchoua pɑ̂ sɛ̂s. Next.js, Prisma, PostgreSQL, Firebase.",
    modulesTitle: "Mañ",
    modulesDesc: "18 mañ jimɓe kaalis.",
    workflowsTitle: "Pɑ̂ sɛ̂s",
    workflowsDesc: "Pɑ̂ sɛ̂s.",
    securityTitle: "Lô bi",
    securityDesc: "Lô bi, pɑ̂.",
    modules: modulesFr,
    workflows: {
      cotisation: { title: "Naatirde kaalis", steps: ["Faɗtu", "Pɑ̂", "Wɑ̂", "Kaalis", "Pɑ̂"] },
      session: { title: "Pɑ̂ sɛ̂s", steps: ["Pɑ̂", "Wɑ̂", "Pɑ̂", "Faɗtu", "Haɓɓu"] },
      pret: { title: "Ɗaɓɓo kaalis", steps: ["Ɗaɓɓo", "Pɑ̂", "Jaŋtu", "Faɗtu", "Wɑ̂"] },
    },
    security: {
      title: "Lô bi",
      items: [
        { title: "Lô bi", desc: "NextAuth.js, JWT." },
        { title: "Pɑ̂", desc: "RBAC." },
        { title: "Lô bi", desc: "TLS 1.3, AES-256." },
        { title: "Wɑ̂", desc: "Wɑ̂ pɑ̂." },
        { title: "Pɑ̂", desc: "RGPD." },
      ],
    },
  },
};
