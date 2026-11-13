// Formules du noyau financier ARP (Annexes 01 et 02 de l'étude).
// Toutes les sommes sont en unités mineures entières ; les taux sont des pourcentages par période.

import { allocateProportional } from "./money";

const ZERO = BigInt(0);
const ONE = BigInt(1);
const HUNDRED = BigInt(100);
const MILLION = BigInt(1_000_000);

export type DueState = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID" | "WAIVED";

export type DueResult = {
  dueBeforeCreditMinor: bigint;
  dueMinor: bigint;
  paidMinor: bigint;
  creditMinor: bigint;
  state: DueState;
};

/**
 * COT01 : dû net = appel initial + ajustements débiteurs - remises - affectations valides.
 * COT02 : le trop-perçu devient un crédit ; le reste dû ne devient jamais négatif.
 */
export function computeDue(input: {
  initialMinor: bigint;
  adjustmentsMinor?: bigint;
  waiversMinor?: bigint;
  allocationsMinor?: bigint;
}): DueResult {
  const initial = input.initialMinor;
  const adjustments = input.adjustmentsMinor ?? ZERO;
  const waivers = input.waiversMinor ?? ZERO;
  const allocations = input.allocationsMinor ?? ZERO;
  if (initial < ZERO || adjustments < ZERO || waivers < ZERO || allocations < ZERO) {
    throw new Error("Les montants d'un appel ne peuvent pas être négatifs.");
  }
  const dueBeforeCredit = initial + adjustments - waivers;
  if (dueBeforeCredit < ZERO) {
    throw new Error("Une remise ne peut pas dépasser l'appel et ses ajustements.");
  }
  const paid = allocations > dueBeforeCredit ? dueBeforeCredit : allocations;
  const due = dueBeforeCredit - paid;
  const credit = allocations > dueBeforeCredit ? allocations - dueBeforeCredit : ZERO;

  let state: DueState;
  if (dueBeforeCredit === ZERO) {
    state = waivers > ZERO ? "WAIVED" : "PAID";
  } else if (allocations === ZERO) {
    state = "UNPAID";
  } else if (due === ZERO) {
    state = "PAID";
  } else {
    state = "PARTIAL";
  }
  if (credit > ZERO && due === ZERO && dueBeforeCredit > ZERO) {
    state = "OVERPAID";
  }

  return { dueBeforeCreditMinor: dueBeforeCredit, dueMinor: due, paidMinor: paid, creditMinor: credit, state };
}

/** EPA01 : disponible = solde acquis - montants bloqués - retraits réservés. */
export function computeSavingsAvailable(input: {
  acquiredMinor: bigint;
  blockedMinor?: bigint;
  reservedMinor?: bigint;
}): bigint {
  const available = input.acquiredMinor - (input.blockedMinor ?? ZERO) - (input.reservedMinor ?? ZERO);
  return available > ZERO ? available : ZERO;
}

/** FIN03 : le disponible tient compte des réservations sans modifier le solde comptable. */
export function computeFundAvailable(input: {
  balanceMinor: bigint;
  reservedMinor: bigint;
}): bigint {
  const available = input.balanceMinor - input.reservedMinor;
  return available > ZERO ? available : ZERO;
}

/** PRE01 : montant autorisable = minimum des limites indépendantes. */
export function computeLoanLimit(input: {
  liquidMinor: bigint;
  memberLimitMinor: bigint;
  currentExposureMinor?: bigint;
  productLimitMinor?: bigint;
  concentrationLimitMinor?: bigint;
}): bigint {
  const remainingMember =
    input.memberLimitMinor - (input.currentExposureMinor ?? ZERO);
  const limits = [
    input.liquidMinor,
    remainingMember > ZERO ? remainingMember : ZERO,
    input.productLimitMinor ?? input.liquidMinor,
    input.concentrationLimitMinor ?? input.liquidMinor,
  ];
  return limits.reduce((min, value) => (value < min ? value : min), limits[0]);
}

export type AttributionLimit = {
  unitsMilli: bigint;
  units: number;
  amountMinor: bigint;
  remainderMinor: bigint;
  limitedBy: "POT" | "DROITS_RESTANTS" | "PLAFOND_SEANCE" | "AUCUN";
};

function floorToGrid(valueMilli: bigint, gridMilli: bigint): bigint {
  if (gridMilli <= ZERO) throw new Error("La fraction minimale doit être strictement positive.");
  return (valueMilli / gridMilli) * gridMilli;
}

/**
 * ATT01 : quantité attribuée limitée par le pot finançable, le plafond de séance
 * et les droits restants. Aucune option ne crée de fonds fictifs.
 */
export function computeAttribution(input: {
  potMinor: bigint;
  beneficiaryRightMinor: bigint;
  remainingUnits: number;
  sessionCapUnits?: number;
  minFraction?: number;
}): AttributionLimit {
  if (input.beneficiaryRightMinor <= ZERO) {
    throw new Error("Le droit bénéficiaire par part doit être strictement positif.");
  }
  if (input.potMinor < ZERO) throw new Error("Le pot ne peut pas être négatif.");

  const grid = Math.max(0.0001, input.minFraction ?? 1);
  const gridMilli = BigInt(Math.round(grid * 1_000_000));
  const remainingMilli = BigInt(Math.max(0, Math.round(input.remainingUnits * 1_000_000)));
  const byPotMilli = (input.potMinor * MILLION) / input.beneficiaryRightMinor;
  const capMilli =
    input.sessionCapUnits === undefined
      ? remainingMilli
      : BigInt(Math.max(0, Math.round(input.sessionCapUnits * 1_000_000)));

  const candidates: Array<{ value: bigint; reason: AttributionLimit["limitedBy"] }> = [
    { value: byPotMilli, reason: "POT" },
    { value: remainingMilli, reason: "DROITS_RESTANTS" },
    { value: capMilli, reason: "PLAFOND_SEANCE" },
  ];
  let limiting = candidates[0];
  for (const candidate of candidates) {
    if (candidate.value < limiting.value) limiting = candidate;
  }
  const unitsMilli = floorToGrid(limiting.value, gridMilli);
  const amountMinor = (input.beneficiaryRightMinor * unitsMilli) / MILLION;
  const remainder = input.potMinor - amountMinor;

  return {
    unitsMilli,
    units: Number(unitsMilli) / 1_000_000,
    amountMinor,
    remainderMinor: remainder > ZERO ? remainder : ZERO,
    limitedBy: unitsMilli === ZERO ? limiting.reason : limiting.reason,
  };
}

/** DIV02 : somme des quotes-parts exactement égale au montant décidé. */
export function computeDividendShares(
  distributableMinor: bigint,
  weights: Array<bigint | number>
): bigint[] {
  return allocateProportional(distributableMinor, weights);
}

/** RES02 : une créance de cotisation n'est pas une entrée certaine. */
export function projectContributions(input: {
  members: number;
  contributionMinor: bigint;
  months: number;
  recoveryPct: number;
}): bigint {
  if (input.members < 0 || input.months < 0) {
    throw new Error("Les effectifs et les mois doivent être positifs.");
  }
  if (input.recoveryPct < 0 || input.recoveryPct > 100) {
    throw new Error("Le taux de recouvrement doit être compris entre 0 et 100 %.");
  }
  const gross =
    BigInt(Math.round(input.members)) *
    input.contributionMinor *
    BigInt(Math.round(input.months));
  return (gross * BigInt(Math.round(input.recoveryPct * 100))) / BigInt(10000);
}

export type AmortizationMethod = "CONSTANT_PRINCIPAL" | "CONSTANT_ANNUITY" | "IN_FINE";

export type AmortizationLine = {
  period: number;
  openingMinor: bigint;
  principalMinor: bigint;
  interestMinor: bigint;
  paymentMinor: bigint;
  closingMinor: bigint;
};

export type AmortizationResult = {
  method: AmortizationMethod;
  principalMinor: bigint;
  interestMinor: bigint;
  totalMinor: bigint;
  lines: AmortizationLine[];
};

function interestFor(opening: bigint, ratePct: number): bigint {
  if (opening <= ZERO || ratePct <= 0) return ZERO;
  return (opening * BigInt(Math.round(ratePct * 10000))) / BigInt(1_000_000);
}

/**
 * Échéancier à principal constant, annuité constante ou in fine.
 * ECH01 : principal périodique = capital / n ; intérêt = capital restant × taux.
 * ECH02 : A = P × i / (1 - (1 + i)^(-n)) ; si i = 0, A = P / n.
 */
export function buildAmortizationSchedule(input: {
  principalMinor: bigint;
  periods: number;
  ratePctPerPeriod: number;
  method: AmortizationMethod;
}): AmortizationResult {
  const { principalMinor, periods, ratePctPerPeriod, method } = input;
  if (principalMinor <= ZERO) throw new Error("Le capital doit être strictement positif.");
  if (!Number.isInteger(periods) || periods < 1) {
    throw new Error("Le nombre d'échéances doit être un entier positif.");
  }
  if (ratePctPerPeriod < 0) throw new Error("Le taux ne peut pas être négatif.");

  const lines: AmortizationLine[] = [];
  let opening = principalMinor;
  let totalInterest = ZERO;

  if (method === "CONSTANT_PRINCIPAL") {
    const base = principalMinor / BigInt(periods);
    for (let period = 1; period <= periods; period++) {
      const principal =
        period === periods ? opening : base < opening ? base : opening;
      const interest = interestFor(opening, ratePctPerPeriod);
      const payment = principal + interest;
      const closing = opening - principal;
      lines.push({ period, openingMinor: opening, principalMinor: principal, interestMinor: interest, paymentMinor: payment, closingMinor: closing });
      totalInterest += interest;
      opening = closing;
    }
  } else if (method === "IN_FINE") {
    for (let period = 1; period <= periods; period++) {
      const principal = period === periods ? opening : ZERO;
      const interest = interestFor(opening, ratePctPerPeriod);
      const payment = principal + interest;
      const closing = opening - principal;
      lines.push({ period, openingMinor: opening, principalMinor: principal, interestMinor: interest, paymentMinor: payment, closingMinor: closing });
      totalInterest += interest;
      opening = closing;
    }
  } else {
    // Annuité constante : calcul du paiement en unités mineures, puis ajustement final.
    const i = ratePctPerPeriod / 100;
    let payment: bigint;
    if (i === 0) {
      payment = (principalMinor + BigInt(periods) - ONE) / BigInt(periods);
    } else {
      const factor = i / (1 - Math.pow(1 + i, -periods));
      payment = BigInt(Math.round(Number(principalMinor) * factor));
    }
    for (let period = 1; period <= periods; period++) {
      const interest = interestFor(opening, ratePctPerPeriod);
      let principal = payment - interest;
      if (period === periods || principal > opening) principal = opening;
      if (principal < ZERO) principal = ZERO;
      const actualPayment = principal + interest;
      const closing = opening - principal;
      lines.push({ period, openingMinor: opening, principalMinor: principal, interestMinor: interest, paymentMinor: actualPayment, closingMinor: closing });
      totalInterest += interest;
      opening = closing;
    }
  }

  return {
    method,
    principalMinor,
    interestMinor: totalInterest,
    totalMinor: principalMinor + totalInterest,
    lines,
  };
}

/** Quote-part d'un membre dans une base, en pourcentage (DIV01). */
export function computeSharePct(weight: bigint | number, total: bigint | number): number {
  const w = Number(weight);
  const t = Number(total);
  if (!Number.isFinite(w) || !Number.isFinite(t) || t <= 0) return 0;
  return (w / t) * 100;
}

/** Couverture contractuelle : ressources prévues / distributions promises. */
export function computeCoverage(availableMinor: bigint, promisedMinor: bigint): number {
  if (promisedMinor <= ZERO) return 1;
  return Number(availableMinor) / Number(promisedMinor);
}
