/**
 * Aligne les trois associations importées sur leurs statuts / règlements intérieurs.
 *
 * Sources :
 * - ETS NDI MBE : Règlement intérieur du Fonds d'Investissement « NDI MBE ET FILS » v1.0 (02/11/2022)
 * - AMEIBANS : Statuts révisés 2018 + Règlement intérieur du Comité directeur (2021)
 * - AMSED : Règlement intérieur 2024 de la section AMEIBANS de Douala
 *
 * Exécution :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/align-associations-from-reglements.ts
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { defaultArpConfig, normalizeArpConfig, validateArpConfig } from "../src/lib/arp/profile";
import type { ArpConfig } from "../src/lib/arp/types";

const prisma = new PrismaClient();

const AMEIBANS_ID = "cmwea8q1y000t5bwkwneca992";

type AssociationPatch = {
  description: string;
  membershipConfig: Record<string, unknown>;
  meetingConfig: Record<string, unknown>;
  socialAidCaps: Record<string, unknown>;
  sanctionsConfig: Record<string, unknown>;
  bankConfig: Record<string, unknown> | null;
  bureauConfig: Record<string, unknown>;
  arp: Partial<ArpConfig>;
};

const PATCHES: Record<string, AssociationPatch> = {
  "assoc-ndi": {
    description:
      "Fonds d'investissement privé familial « NDI MBE ET FILS », créé le 2 novembre 2022 par les frères NDI MBE. Financement de projets, prêts internes et valorisation des capitaux.",
    membershipConfig: {
      admission: "UNANIME",
      approvalProcess: "UNANIMITY",
      apportInitialLibre: true,
      minCapital: 0,
      versement: "VIREMENT",
      sponsorshipRequired: false,
      sponsorshipCount: 0,
      admissionFee: "0",
      waitingPeriod: "",
      ageMin: "",
      conditions: [
        "Être frère NDI MBE, fondateur ou membre permanent",
        "Tout nouveau membre est admis à l'unanimité des membres existants",
        "Verser l'apport initial convenu, librement fixé par chaque membre",
      ],
    },
    meetingConfig: {
      frequency: "QUARTERLY",
      dayOfWeek: 6,
      hour: 15,
      quorumPercent: 60,
      collationRate: 0,
      collationHostPayout: 0,
      publicationWindow: "5 premiers jours ouvrés de chaque mois",
      note: "Le règlement intérieur prévoit un relevé de compte et un rapport des prêts mensuels ; il ne fixe pas de périodicité de réunion.",
    },
    socialAidCaps: {},
    sanctionsConfig: {},
    bankConfig: {
      bankName: "CCP Bank — Agence Bafoussam Marché",
      rib: "10039 10040 00268280901 58",
      accountHolder: "SOCIETE DE DISTRIBUTION ET DE COMMERCIALISATION SARL",
      paymentMode: "VIREMENT",
      note: "Tous les apports, déboursements et remboursements transitent exclusivement par ce compte joint. Aucun paiement en espèces.",
    },
    bureauConfig: {
      president: "ANDRE SOH",
      vicePresident: "PALO VALENTIN",
      secretaireGeneral: "TAMPOLLA SERGE",
      tresorier: "FONGANG JEAN NOEL",
      organes: ["Assemblée des Membres", "Secrétariat", "Trésorerie"],
      mandatAnnees: 3,
      fonctionsGratuites: true,
    },
    arp: {
      identity: {
        purposes: ["INVESTISSEMENT", "FINANCEMENT_PROJETS", "PRETS"],
        legalStatus: "Fonds d'investissement privé",
        legalStatusProof: "Règlement intérieur v1.0 du 02/11/2022",
        country: "CM",
        currency: "XAF",
        timezone: "Africa/Douala",
        startModel: "NDI_MBE",
        parentId: null,
        creationDate: "2022-11-02",
      },
      governance: {
        quorumPct: 100,
        majority: "UNANIMITE",
        convocationDays: 30,
        mandateYears: 3,
        maxRenewals: 0,
        separationOfDuties: true,
        proxyMax: 0,
        officersDeclared: true,
        creationDecisionRef: "Règlement intérieur NDI MBE ET FILS v1.0",
      },
      membership: {
        admissionMode: "COMMISSION",
        admissionFeeMinor: 0,
        sponsorshipRequired: false,
        sponsorshipCount: 0,
        ageMin: 0,
        familyCapUnit: "MENAGE",
        householdDefinition: "Membres fondateurs et membres admis à l'unanimité",
        exitNoticeDays: 30,
      },
      dimensions: {
        organisation: "autonome",
        adhesion: "individuelle",
        cotisation: "parts",
        tontine: "aucune",
        credit: "amortissable",
        aide: "aucune",
        canal: "banque",
        devise: "unique",
        connexion: "en_ligne",
        validation: "simple",
      },
      modules: {
        tontine: false,
        savings: true,
        credit: true,
        socialAid: false,
        nature: false,
        meetings: true,
        projects: false,
        stocks: false,
        events: false,
        community: true,
        investment: true,
        collation: false,
      },
      prerequisites: {
        creditThresholdMinor: 100_000,
        creditMaxRatioPct: 100,
        creditConflictRule:
          "Le Secrétariat instruit la demande ; le membre concerné ne participe pas à la décision d'octroi.",
        paymentProvider: "CCP Bank — virement bancaire",
        externalConfirmation: true,
        auctionMinBidPct: 5,
        auctionBasis: "",
        auctionCloseRule: "",
        offlineOfferPolicy: "",
        offlinePaymentPolicy: "Aucun paiement en espèces ; avis de virement obligatoire.",
        natureValuation: "",
        natureSaleLiquidity: "",
        exchangeRateSource: "",
        exchangeRateDate: "",
        exchangeMarginPct: 0,
        presentationCurrency: "XAF",
        aideDailyCapMinor: 0,
        aideAnnualCapMinor: 0,
        inheritanceMode: "NONE",
        delegateRule: "",
      },
      notes:
        "Aligné sur le Règlement intérieur du Fonds d'Investissement NDI MBE ET FILS v1.0 : apports libres, prêts 2 %/mois jusqu'à 3 mois puis 4 %/mois, compte CCP Bank, quote-part d'intérêts au prorata du capital et des remboursements effectivement encaissés.",
    },
  },
  "assoc-amsed": {
    description:
      "Section AMEIBANS de Douala (AMSED), régie par le règlement intérieur 2024. Tontine annuelle, fonds de solidarité, fonds d'investissement et collation.",
    membershipConfig: {
      conditions: [
        "Être ressortissant du groupement Bansoa, des deux sexes",
        "Être cadre du secteur public ou privé, chef d'entreprise ou profession libérale",
        "Ou exercer des responsabilités traditionnelles au sein de la communauté Bansoa",
      ],
      sponsorship: true,
      sponsorshipRequired: true,
      sponsorshipCount: 1,
      admissionTemporaryByCDN: true,
      admissionFee: 10000,
      annualDues: 15000,
      solidarityFund: 72000,
      solidarityPaymentMonths: 10,
      investmentMonthly: 5000,
      tontineAnnual: 25000,
      tontineMinMembersPerTier: 4,
      legalReservePerMember: 20000,
      approvalProcess: "MAJORITY",
      waitingPeriod: "",
      ageMin: "18",
      seniority: { president: 5, vicePresident: 5, tresorier: 5, secretaireAdjoint: 3, autres: 1 },
      mandatAnnees: 3,
    },
    meetingConfig: {
      frequency: "MONTHLY",
      dayOfWeek: 6,
      hour: 15,
      endTime: "19:00",
      quorumPercent: 60,
      collationRate: 3000,
      collationHostPayout: 150000,
      dayRule: "Premier samedi à compter du 5 de chaque mois",
      venue: "Foyer BANSOA de Douala ou rotation chez les adhérents",
      majority: "Majorité simple des présents ; quorum de 3/5 des inscrits",
      rotation: true,
      presidentSeance: "Hôte de la réunion précédente",
      procureur: true,
    },
    socialAidCaps: {
      hospitalMember: 70000,
      hospitalSpouse: 50000,
      hospitalMinDays: 5,
      seriousIllnessLoanMax: 100000,
      marriage: 50000,
      birth: 20000,
      twinsBonus: 10000,
      deathMember: 900000,
      deathMemberBreakdown: { burial: 150000, transport: 300000, catering: 300000, drinks: 130000, misc: 20000 },
      deathSpouse: 405000,
      deathChildUnder10: 50000,
      deathChildOver10: 100000,
      deathParent: 100000,
      funeralVillage: 75000,
      vigilDays: 3,
    },
    sanctionsConfig: {
      late: 500,
      absence1: 1000,
      absence2: 3000,
      absence3: 5000,
      earlyDeparture: 500,
      chat: 500,
      indiscipline: 3000,
      unauthorizedIntervention: 500,
      falseNews: 3000,
      unauthorizedCommitment: 10000,
      commissionMissed: 5000,
      agAbsence: 20000,
      funeralAbsence: 25000,
      committeeSolidarity: 1000,
      presidentRI: 3000,
    },
    bankConfig: null,
    bureauConfig: {
      president: "SOH SIMO Stéphane",
      vicePresident: "",
      secretaireGeneral: "MBA Léopold",
      secretaireAdjoint1: "",
      secretaireAdjoint2: "",
      tresorier: "",
      tresorierAdjoint: "",
      commissairesAuxComptes: 2,
      censeur: "",
      conseillers: [],
      conseilDesSages: [],
      mandatAnnees: 3,
      fonctionsGratuites: true,
    },
    arp: {
      identity: {
        purposes: ["ENTRAIDE", "EPARGNE", "INVESTISSEMENT"],
        legalStatus: "Section d'association régie par la loi n° 90/053",
        legalStatusProof: "Règlement intérieur AMSED 2024",
        country: "CM",
        currency: "XAF",
        timezone: "Africa/Douala",
        startModel: "AMSED",
        parentId: AMEIBANS_ID,
        creationDate: "1993-08-15",
      },
      governance: {
        quorumPct: 60,
        majority: "RELATIVE",
        convocationDays: 15,
        mandateYears: 3,
        maxRenewals: 2,
        separationOfDuties: true,
        proxyMax: 1,
        officersDeclared: true,
        creationDecisionRef: "Règlement intérieur AMSED 2024",
      },
      membership: {
        admissionMode: "PARRAINAGE",
        admissionFeeMinor: 1_000_000,
        sponsorshipRequired: true,
        sponsorshipCount: 1,
        ageMin: 18,
        familyCapUnit: "MENAGE",
        householdDefinition: "Conjoint et enfants à charge du membre",
        exitNoticeDays: 30,
      },
      dimensions: {
        organisation: "section",
        adhesion: "individuelle",
        cotisation: "fixe",
        tontine: "encheres",
        credit: "amortissable",
        aide: "forfait",
        canal: "especes",
        devise: "unique",
        connexion: "en_ligne",
        validation: "simple",
      },
      modules: {
        tontine: true,
        savings: true,
        credit: true,
        socialAid: true,
        nature: false,
        meetings: true,
        projects: false,
        stocks: false,
        events: false,
        community: true,
        investment: true,
        collation: true,
      },
      prerequisites: {
        creditThresholdMinor: 100_000,
        creditMaxRatioPct: 200,
        creditConflictRule:
          "Commission désignée par le Président sur proposition du bureau ; le membre intéressé ne siège pas à la commission.",
        auctionBasis: "Montant de la cotisation individuelle et intérêts cumulés de la tontine",
        auctionCloseRule:
          "Enchères publiques ; mise à prix 5 % ; l'avant-dernier enrichisseur ne peut quitter la séance sans clôture des intérêts ; égalité tranchée par le Président de séance.",
        auctionMinBidPct: 5,
        offlineOfferPolicy: "Offre annoncée en séance et consignée par le secrétaire.",
        offlinePaymentPolicy: "Paiement en espèces à la séance ; reçu et émargement obligatoires.",
        paymentProvider: "Caisse de section",
        externalConfirmation: false,
        natureValuation: "",
        natureSaleLiquidity: "",
        exchangeRateSource: "",
        exchangeRateDate: "",
        exchangeMarginPct: 0,
        presentationCurrency: "XAF",
        aideDailyCapMinor: 0,
        aideAnnualCapMinor: 0,
        inheritanceMode: "OBLIGATOIRE — le règlement de section précise les modalités pratiques",
        delegateRule: "",
      },
      notes:
        "Aligné sur le Règlement intérieur AMSED 2024 : 72 000 FCFA de fonds de solidarité la première année, tontine annuelle 25 000 FCFA avec enchères à 5 %, fonds d'investissement 5 000 FCFA/mois, prêts 3 %/mois sur 2 mois maximum et plafonnés au double de la mise, collation 3 000 FCFA/150 000 FCFA.",
    },
  },
  [AMEIBANS_ID]: {
    description:
      "Amicale de l'Élite Extérieure et Intérieure Bansoa (AMEIBANS), association loi 1990 à caractère économique, social et culturel, organisée en sections.",
    membershipConfig: {
      conditions: [
        "Être ressortissant du groupement Bansoa, des deux sexes",
        "Être cadre du secteur public ou privé",
        "Ou être âgé d'au plus 40 ans au moment de la demande",
        "Ou être chef d'entreprise ou profession libérale",
        "Ou exercer des responsabilités traditionnelles au sein de la communauté Bansoa",
      ],
      admissionFee: 10000,
      annualDues: 15000,
      solidarityDepositPerMember: 10000,
      sectionRequired: true,
      sponsorship: false,
      sponsorshipRequired: false,
      approvalProcess: "MAJORITY",
      admissionTemporaryByCD: true,
      specialStatus:
        "25 ans de vie active ou invalidité validée — réduction de 50 % de la contribution annuelle et exemption de déplacement",
      ageMin: "18",
      mandatAnnees: 3,
    },
    meetingConfig: {
      frequency: "ANNUAL",
      agPeriodicity: "ANNUAL",
      agWindow: "Janvier — février",
      convocationDays: 45,
      quorumPercent: 50,
      amendments: "2/3 des présents",
      cdPeriodicity: "SEMESTRIAL",
      cdQuorum: "2/3",
      sectionsMinMembers: 10,
      delegatesRatio: "10 % de l'effectif, plafond 11",
      ratificationDays: 45,
      specialMembersReduction: 0.5,
    },
    socialAidCaps: {
      hospitalPerDay: 10000,
      hospitalMinDays: 3,
      hospitalMaxDays: 15,
      deathMember: 300000,
      deathBreakdown: { family: 200000, wreath: 50000, section: 50000 },
      solidarityDepositPerMember: 10000,
    },
    sanctionsConfig: {
      lateDelegate: 1000,
      absenceHost: 3000,
      absenceOther: 5000,
      indiscipline: 5000,
      sectionUnderrepresented: 10000,
      litigationCD: 10000,
      litigationAG: 15000,
    },
    bankConfig: null,
    bureauConfig: {
      president: "WOAFO Paul",
      vicePresident: "",
      secretaireGeneral: "",
      secretaireGeneralAdjoint: "",
      tresorier: "",
      tresorierAdjoint: "",
      commissairesAuxComptes: 2,
      mandatAnnees: 3,
      renouvelable: 1,
      fonctionsGratuites: true,
    },
    arp: {
      identity: {
        purposes: ["ENTRAIDE", "CULTURE", "DEVELOPPEMENT"],
        legalStatus: "Association loi n° 90/053",
        legalStatusProof: "Statuts révisés 2018",
        country: "CM",
        currency: "XAF",
        timezone: "Africa/Douala",
        startModel: "AMEIBANS",
        parentId: null,
        creationDate: "1993-08-15",
      },
      governance: {
        quorumPct: 50,
        majority: "RELATIVE",
        convocationDays: 45,
        mandateYears: 3,
        maxRenewals: 1,
        separationOfDuties: true,
        proxyMax: 1,
        officersDeclared: true,
        creationDecisionRef: "Statuts AMEIBANS révisés 2018",
      },
      membership: {
        admissionMode: "COMMISSION",
        admissionFeeMinor: 1_000_000,
        sponsorshipRequired: false,
        sponsorshipCount: 0,
        ageMin: 18,
        familyCapUnit: "MENAGE",
        householdDefinition: "Membre, conjoint et enfants à charge",
        exitNoticeDays: 30,
      },
      dimensions: {
        organisation: "federation",
        adhesion: "individuelle",
        cotisation: "fixe",
        tontine: "aucune",
        credit: "aucun",
        aide: "forfait",
        canal: "banque",
        devise: "unique",
        connexion: "en_ligne",
        validation: "double",
      },
      modules: {
        tontine: false,
        savings: false,
        credit: false,
        socialAid: true,
        nature: false,
        meetings: true,
        projects: false,
        stocks: false,
        events: false,
        community: true,
        investment: false,
        collation: false,
      },
      prerequisites: {
        delegateRule: "10 % de l'effectif de la section, arrondi à l'entier supérieur, plafonné à 11 délégués",
        creditThresholdMinor: 0,
        creditMaxRatioPct: 0,
        creditConflictRule: "",
        auctionBasis: "",
        auctionCloseRule: "",
        auctionMinBidPct: 5,
        offlineOfferPolicy: "",
        offlinePaymentPolicy: "",
        paymentProvider: "",
        externalConfirmation: false,
        natureValuation: "",
        natureSaleLiquidity: "",
        exchangeRateSource: "",
        exchangeRateDate: "",
        exchangeMarginPct: 0,
        presentationCurrency: "XAF",
        aideDailyCapMinor: 1_000_000,
        aideAnnualCapMinor: 15_000_000,
        inheritanceMode: "NONE",
      },
      notes:
        "Aligné sur les statuts révisés 2018 et le règlement intérieur 2021 : AG annuelle janvier-février, convocation 45 jours, quorum 1/2, CD semestriel à 2/3, droit d'adhésion 10 000 FCFA, cotisation annuelle 15 000 FCFA, fonds de dépôt 10 000 FCFA/membre, décès 300 000 FCFA, aide maladie 10 000 FCFA/jour (3 à 15 jours).",
    },
  },
};

function assertNoErrors(name: string, checks: ReturnType<typeof validateArpConfig>) {
  if (checks.errors.length > 0) {
    console.error(`[${name}] Configuration ARP invalide :`);
    for (const issue of checks.errors) console.error(` - ${issue.field ?? "?"} : ${issue.message}`);
    throw new Error(`Configuration ARP invalide pour ${name}`);
  }
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: "admin@tchoua.com" }, select: { id: true } });
  if (!admin) throw new Error("Compte admin@tchoua.com introuvable");

  const associations = await prisma.association.findMany({
    where: { id: { in: Object.keys(PATCHES) } },
    select: { id: true, name: true, parentId: true },
  });

  for (const association of associations) {
    const patch = PATCHES[association.id];
    if (!patch) continue;

    const profile = await prisma.arpProfile.findUnique({ where: { associationId: association.id } });
    const seed = {
      type: association.id === "assoc-ndi" ? "INVESTMENT" : association.id === "assoc-amsed" ? "SECTION" : "AMICALE",
      parentId: association.id === "assoc-amsed" ? AMEIBANS_ID : null,
      currency: "XAF",
      activities: [],
    };
    const base = normalizeArpConfig(profile?.config ?? defaultArpConfig(seed), seed);
    const config = normalizeArpConfig(
      {
        ...base,
        ...patch.arp,
        identity: { ...base.identity, ...(patch.arp.identity ?? {}) },
        governance: { ...base.governance, ...(patch.arp.governance ?? {}) },
        membership: { ...base.membership, ...(patch.arp.membership ?? {}) },
        dimensions: { ...base.dimensions, ...(patch.arp.dimensions ?? {}) },
        modules: { ...base.modules, ...(patch.arp.modules ?? {}) },
        prerequisites: { ...base.prerequisites, ...(patch.arp.prerequisites ?? {}) },
        notes: patch.arp.notes ?? base.notes,
      },
      seed
    );

    const checks = validateArpConfig(config, {
      hasBureau: true,
      hasRegulation: true,
      hasCreationDecision: true,
      hasParent: Boolean(config.identity.parentId),
    });
    assertNoErrors(association.name, checks);

    const nextVersion = (profile?.version ?? 0) + 1;
    const hash = createHash("sha256").update(JSON.stringify(config)).digest("hex");
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.association.update({
        where: { id: association.id },
        data: {
          description: patch.description,
          membershipConfig: JSON.stringify(patch.membershipConfig),
          meetingConfig: JSON.stringify(patch.meetingConfig),
          socialAidCaps: JSON.stringify(patch.socialAidCaps),
          sanctionsConfig: JSON.stringify(patch.sanctionsConfig),
          bankConfig: patch.bankConfig ? JSON.stringify(patch.bankConfig) : null,
          bureauConfig: JSON.stringify(patch.bureauConfig),
        },
      });

      const saved = await tx.arpProfile.upsert({
        where: { associationId: association.id },
        create: {
          associationId: association.id,
          structure: config.dimensions.organisation === "section" ? "SECTION" : config.dimensions.organisation === "federation" ? "FEDERATION" : "AUTONOME",
          status: "ACTIVE",
          origin: "MANUAL",
          version: nextVersion,
          config,
          checks,
          effectiveAt: now,
          approvedById: admin.id,
          approvedAt: now,
        },
        update: {
          structure: config.dimensions.organisation === "section" ? "SECTION" : config.dimensions.organisation === "federation" ? "FEDERATION" : "AUTONOME",
          status: "ACTIVE",
          origin: "MANUAL",
          version: nextVersion,
          config,
          checks,
          draftConfig: Prisma.DbNull,
          draftChecks: Prisma.DbNull,
          effectiveAt: now,
          approvedById: admin.id,
          approvedAt: now,
        },
      });

      await tx.arpProfileVersion.create({
        data: {
          profileId: saved.id,
          associationId: association.id,
          version: nextVersion,
          status: "ACTIVE",
          origin: "MANUAL",
          config,
          checks,
          hash,
          createdById: admin.id,
          approvedById: admin.id,
          effectiveAt: now,
        },
      });
    });

    console.log(`✓ ${association.name} alignée — ARP v${nextVersion}, score de confiance à recalculer`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
