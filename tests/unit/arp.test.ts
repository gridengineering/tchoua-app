import {
  ARP_CATALOGUE_SIZE,
  allCombinations,
  conditionsFor,
  evaluateCombination,
} from "@/lib/arp/catalogue";
import {
  defaultArpConfig,
  deriveCapabilities,
  normalizeArpConfig,
  validateArpConfig,
} from "@/lib/arp/profile";
import {
  buildAmortizationSchedule,
  computeAttribution,
  computeDividendShares,
  computeDue,
  computeLoanLimit,
  computeSavingsAvailable,
  projectContributions,
} from "@/lib/arp/finance";
import { allocateProportional, formatMoney, toMinor } from "@/lib/arp/money";
import { ARP_DOMAINS, ARP_DOMAIN_STATS } from "@/lib/arp/domains";
import { ARP_CATALOGUE_MASK } from "../fixtures/arp-catalogue-mask";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

function encodeConditions(codes: string[]): string {
  let bits = 0;
  for (const code of codes) bits |= 1 << (Number(code.slice(1)) - 1);
  return ALPHABET[bits];
}

describe("Référentiel ARP", () => {
  it("charge les 36 domaines et les 144 invariants", () => {
    expect(ARP_DOMAINS).toHaveLength(36);
    expect(ARP_DOMAIN_STATS.invariants).toBe(144);
    expect(ARP_DOMAINS[0].code).toBe("01");
    expect(ARP_DOMAINS[35].code).toBe("36");
  });

  it("reproduit exactement les 23 328 combinaisons du catalogue", () => {
    const combinations = allCombinations();
    expect(ARP_CATALOGUE_SIZE).toBe(23328);
    expect(combinations).toHaveLength(23328);
    const mask = combinations
      .map((combination) => encodeConditions(combination.conditions))
      .join("");
    expect(mask).toBe(ARP_CATALOGUE_MASK);
  });

  it("détecte les six conditions aux bons endroits", () => {
    const base = {
      organisation: "autonome",
      adhesion: "individuelle",
      cotisation: "fixe",
      tontine: "aucune",
      credit: "aucun",
      aide: "aucune",
      canal: "especes",
      devise: "unique",
      connexion: "en_ligne",
      validation: "simple",
    } as const;

    expect(conditionsFor({ ...base, cotisation: "nature", tontine: "rotation" })).toEqual(["C01"]);
    expect(conditionsFor({ ...base, tontine: "encheres", connexion: "hors_ligne" })).toEqual(["C02"]);
    expect(conditionsFor({ ...base, canal: "mobile_money", connexion: "hors_ligne" })).toEqual(["C03"]);
    expect(conditionsFor({ ...base, devise: "conversion" })).toEqual(["C04"]);
    expect(conditionsFor({ ...base, adhesion: "familiale", aide: "forfait" })).toEqual(["C05"]);
    expect(conditionsFor({ ...base, credit: "amortissable", validation: "simple" })).toEqual(["C06"]);
    expect(evaluateCombination(base).qualification).toBe(
      "sans condition supplementaire du catalogue"
    );
  });
});

describe("Profil ARP", () => {
  it("déduit les capacités des dimensions et des modules", () => {
    const config = defaultArpConfig({
      type: "TONTINE_CLUB",
      activities: [{ type: "TONTINE_ROTATIVE" }, { type: "PRET" }, { type: "AIDE_SOLIDAIRE" }],
    });
    const capabilities = deriveCapabilities(config);
    expect(capabilities.TONTINE).toBe(true);
    expect(capabilities.CREDIT).toBe(true);
    expect(capabilities.SOCIAL_AID).toBe(true);
    expect(capabilities.NATURE).toBe(false);
  });

  it("refuse une conversion sans politique de change", () => {
    const config = defaultArpConfig({});
    config.dimensions.devise = "conversion";
    const checks = validateArpConfig(config);
    expect(checks.ok).toBe(false);
    expect(checks.errors.map((e) => e.code)).toEqual(expect.arrayContaining(["C04_SOURCE", "C04_DATE"]));
  });

  it("refuse un crédit simple sans seuil ni déport", () => {
    const config = defaultArpConfig({});
    config.dimensions.credit = "amortissable";
    config.modules.credit = true;
    const checks = validateArpConfig(config);
    expect(checks.ok).toBe(false);
    expect(checks.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining(["C06_THRESHOLD", "C06_CONFLICT"])
    );
  });

  it("accepte une configuration complète et conditionnelle", () => {
    const config = defaultArpConfig({});
    config.dimensions = {
      organisation: "autonome",
      adhesion: "familiale",
      cotisation: "nature",
      tontine: "encheres",
      credit: "amortissable",
      aide: "jours",
      canal: "mobile_money",
      devise: "conversion",
      connexion: "hors_ligne",
      validation: "simple",
    };
    config.prerequisites = {
      ...config.prerequisites,
      exchangeRateSource: "Banque centrale",
      exchangeRateDate: "2026-11-13",
      exchangeMarginPct: 1.5,
      presentationCurrency: "EUR",
      creditThresholdMinor: 500000,
      creditConflictRule: "Déport du demandeur et des parties liées",
      natureValuation: "Prix de marché constaté",
      natureSaleLiquidity: "Vente préalable obligatoire",
      auctionBasis: "DROIT_BRUT",
      auctionCloseRule: "Heure serveur, première offre valide",
      auctionMinBidPct: 5,
      offlineOfferPolicy: "Brouillon local, offre définitive après horodatage serveur",
      offlinePaymentPolicy: "Intention seulement, confirmation après webhook signé",
      externalConfirmation: true,
      paymentProvider: "MTN MoMo",
      aideDailyCapMinor: 10000,
      aideAnnualCapMinor: 150000,
    };
    config.membership.householdDefinition = "Conjoint et enfants à charge";
    config.modules = {
      tontine: true,
      savings: true,
      credit: true,
      socialAid: true,
      nature: true,
      meetings: true,
      projects: true,
      stocks: true,
      events: true,
      community: true,
      investment: true,
      collation: true,
    };
    const checks = validateArpConfig(config);
    expect(checks.errors).toEqual([]);
    expect(checks.ok).toBe(true);
    expect(checks.conditions).toEqual(["C01", "C02", "C03", "C04", "C05", "C06"]);
  });

  it("refuse de désactiver un invariant non désactivable", () => {
    const config = defaultArpConfig({});
    config.controls.audit = false;
    config.finance.allowNegativeFund = true;
    const checks = validateArpConfig(config);
    expect(checks.ok).toBe(false);
    expect(checks.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining(["CONTROL_DISABLED", "FIN04_NEGATIVE"])
    );
  });

  it("normalise une configuration partielle sans perdre les valeurs par défaut", () => {
    const config = normalizeArpConfig({ identity: { currency: "EUR" }, dimensions: { tontine: "tirage" } });
    expect(config.identity.currency).toBe("EUR");
    expect(config.dimensions.tontine).toBe("tirage");
    expect(config.controls.isolation).toBe(true);
  });
});

describe("Noyau financier exact", () => {
  it("convertit et formate sans flottant", () => {
    expect(toMinor("120000", "XAF")).toBe(BigInt(120000));
    expect(toMinor("12.50", "EUR")).toBe(BigInt(1250));
    expect(formatMoney(BigInt(5433499), "XAF")).toBe("5 433 499 FCFA");
    expect(formatMoney(BigInt(1250), "EUR")).toBe("12.50 €");
  });

  it("calcule le dû net, le partiel et le trop-perçu", () => {
    const partial = computeDue({
      initialMinor: BigInt(25000),
      allocationsMinor: BigInt(10000),
    });
    expect(partial.dueMinor).toBe(BigInt(15000));
    expect(partial.state).toBe("PARTIAL");

    const over = computeDue({
      initialMinor: BigInt(25000),
      allocationsMinor: BigInt(30000),
    });
    expect(over.creditMinor).toBe(BigInt(5000));
    expect(over.state).toBe("OVERPAID");

    const waived = computeDue({
      initialMinor: BigInt(15000),
      waiversMinor: BigInt(15000),
    });
    expect(waived.state).toBe("WAIVED");
    expect(waived.dueMinor).toBe(BigInt(0));
  });

  it("calcule le disponible d'épargne et de fonds", () => {
    expect(
      computeSavingsAvailable({
        acquiredMinor: BigInt(100000),
        blockedMinor: BigInt(30000),
        reservedMinor: BigInt(20000),
      })
    ).toBe(BigInt(50000));
  });

  it("limite une attribution par le pot, le plafond et les droits restants", () => {
    const first = computeAttribution({
      potMinor: BigInt(650000),
      beneficiaryRightMinor: BigInt(300000),
      remainingUnits: 12,
      sessionCapUnits: 2,
    });
    expect(first.units).toBe(2);
    expect(first.amountMinor).toBe(BigInt(600000));
    expect(first.remainderMinor).toBe(BigInt(50000));

    const insufficient = computeAttribution({
      potMinor: BigInt(250000),
      beneficiaryRightMinor: BigInt(300000),
      remainingUnits: 4,
    });
    expect(insufficient.units).toBe(0);
    expect(insufficient.amountMinor).toBe(BigInt(0));
  });

  it("respecte les fractions de part", () => {
    const half = computeAttribution({
      potMinor: BigInt(1000000),
      beneficiaryRightMinor: BigInt(100000),
      remainingUnits: 1,
      sessionCapUnits: 1,
      minFraction: 0.25,
    });
    expect(half.units).toBe(1);
    expect(half.amountMinor).toBe(BigInt(100000));
  });

  it("produit l'échéancier 120 000 sur trois mois à 3 %", () => {
    const schedule = buildAmortizationSchedule({
      principalMinor: BigInt(120000),
      periods: 3,
      ratePctPerPeriod: 3,
      method: "CONSTANT_PRINCIPAL",
    });
    expect(schedule.lines.map((line) => Number(line.paymentMinor))).toEqual([43600, 42400, 41200]);
    expect(Number(schedule.interestMinor)).toBe(7200);
    expect(schedule.lines[2].closingMinor).toBe(BigInt(0));
  });

  it("gère le taux zéro sans division par zéro", () => {
    const schedule = buildAmortizationSchedule({
      principalMinor: BigInt(100000),
      periods: 3,
      ratePctPerPeriod: 0,
      method: "CONSTANT_PRINCIPAL",
    });
    expect(schedule.lines.map((line) => Number(line.principalMinor))).toEqual([33333, 33333, 33334]);
    expect(schedule.interestMinor).toBe(BigInt(0));
  });

  it("répartit 5 433 499 en sept parts sans perdre une unité", () => {
    const shares = computeDividendShares(BigInt(5433499), Array(7).fill(1));
    expect(shares.map(Number)).toEqual([776215, 776214, 776214, 776214, 776214, 776214, 776214]);
    expect(shares.reduce((sum, value) => sum + value, BigInt(0))).toBe(BigInt(5433499));
  });

  it("répartit un montant selon des poids quelconques", () => {
    const shares = allocateProportional(BigInt(1000), [1, 1, 1]);
    expect(shares.map(Number)).toEqual([334, 333, 333]);
  });

  it("applique le minimum des limites de prêt", () => {
    expect(
      computeLoanLimit({
        liquidMinor: BigInt(300000),
        memberLimitMinor: BigInt(200000),
        currentExposureMinor: BigInt(0),
      })
    ).toBe(BigInt(200000));
  });

  it("projette les cotisations avec un taux de recouvrement", () => {
    const projected = projectContributions({
      members: 100,
      contributionMinor: BigInt(6000),
      months: 12,
      recoveryPct: 90,
    });
    expect(projected).toBe(BigInt(6480000));
  });
});
