// Arithmétique monétaire exacte du noyau ARP.
// Les montants sont conservés en unités mineures entières (REG03 : jamais de flottant binaire).

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);

export type CurrencySpec = {
  code: string;
  exponent: number;
  symbol: string;
  name: string;
};

export const ARP_CURRENCIES: Record<string, CurrencySpec> = {
  XAF: { code: "XAF", exponent: 0, symbol: "FCFA", name: "Franc CFA (BEAC)" },
  XOF: { code: "XOF", exponent: 0, symbol: "FCFA", name: "Franc CFA (BCEAO)" },
  EUR: { code: "EUR", exponent: 2, symbol: "€", name: "Euro" },
  USD: { code: "USD", exponent: 2, symbol: "$", name: "Dollar américain" },
  GBP: { code: "GBP", exponent: 2, symbol: "£", name: "Livre sterling" },
  CAD: { code: "CAD", exponent: 2, symbol: "C$", name: "Dollar canadien" },
  CHF: { code: "CHF", exponent: 2, symbol: "CHF", name: "Franc suisse" },
  NGN: { code: "NGN", exponent: 2, symbol: "₦", name: "Naira" },
  GHS: { code: "GHS", exponent: 2, symbol: "₵", name: "Cedi" },
  MAD: { code: "MAD", exponent: 2, symbol: "DH", name: "Dirham" },
  CDF: { code: "CDF", exponent: 2, symbol: "FC", name: "Franc congolais" },
  AED: { code: "AED", exponent: 2, symbol: "AED", name: "Dirham des Émirats" },
  CNY: { code: "CNY", exponent: 2, symbol: "¥", name: "Yuan" },
};

export function currencySpec(code: string): CurrencySpec {
  return (
    ARP_CURRENCIES[code.toUpperCase()] ?? {
      code: code.toUpperCase(),
      exponent: 2,
      symbol: code.toUpperCase(),
      name: code.toUpperCase(),
    }
  );
}

export function currencyExponent(code: string): number {
  return currencySpec(code).exponent;
}

/** Convertit un montant saisi (nombre ou chaîne décimale) en unités mineures entières. */
export function toMinor(amount: number | string, currency: string): bigint {
  const exponent = currencyExponent(currency);
  const raw =
    typeof amount === "number"
      ? Number.isFinite(amount)
        ? amount.toFixed(exponent)
        : "0"
      : String(amount).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Montant invalide : ${String(amount)}`);
  }
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const padded = (fractionPart + "0".repeat(exponent)).slice(0, exponent);
  const value = BigInt(integerPart || "0") * TEN ** BigInt(exponent) + BigInt(padded || "0");
  return negative ? -value : value;
}

export function fromMinor(minor: bigint, currency: string): number {
  const exponent = currencyExponent(currency);
  return Number(minor) / 10 ** exponent;
}

export function formatMoney(minor: bigint | string | number, currency: string): string {
  const value = typeof minor === "bigint" ? minor : BigInt(minor);
  const exponent = currencyExponent(currency);
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const divisor = TEN ** BigInt(exponent);
  const integer = abs / divisor;
  const fraction = abs % divisor;
  const grouped = integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimals =
    exponent > 0 ? `.${fraction.toString().padStart(exponent, "0")}` : "";
  return `${negative ? "-" : ""}${grouped}${decimals} ${currencySpec(currency).symbol}`;
}

export function assertSameCurrency(a: string, b: string): void {
  if (a.toUpperCase() !== b.toUpperCase()) {
    throw new Error(`Devises incompatibles : ${a} et ${b} (INT01)`);
  }
}

/**
 * Répartit un montant entier au prorata des poids, sans perdre d'unité.
 * Méthode des plus forts restes ; la somme des parts égale exactement le total.
 */
export function allocateProportional(
  totalMinor: bigint,
  weights: Array<bigint | number>
): bigint[] {
  if (totalMinor < ZERO) throw new Error("La répartition d'un montant négatif est interdite.");
  const normalized = weights.map((w) => (typeof w === "bigint" ? w : BigInt(Math.trunc(w))));
  if (normalized.some((w) => w < ZERO)) {
    throw new Error("Un poids de répartition ne peut pas être négatif.");
  }
  const sum = normalized.reduce((acc, w) => acc + w, ZERO);
  if (sum === ZERO) throw new Error("La somme des poids est nulle : répartition impossible (DIV01).");

  const base = normalized.map((w) => (totalMinor * w) / sum);
  const remainders = normalized.map((w) => (totalMinor * w) % sum);
  let remaining = totalMinor - base.reduce((acc, v) => acc + v, ZERO);

  const order = remainders
    .map((remainder, index) => ({ remainder, index }))
    .sort((a, b) =>
      a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1
    );

  const result = [...base];
  for (let i = 0; remaining > ZERO && i < order.length; i++) {
    result[order[i].index] += ONE;
    remaining -= ONE;
  }
  return result;
}

/** Répartit un montant selon des poids décimaux (capital-jours par exemple). */
export function allocateWeightedDecimal(
  totalMinor: bigint,
  weights: number[]
): bigint[] {
  if (weights.some((w) => !Number.isFinite(w) || w < 0)) {
    throw new Error("Poids décimal invalide.");
  }
  // Précision au millionième pour rester exact sur les clés de répartition.
  const scaled = weights.map((w) => BigInt(Math.round(w * 1_000_000)));
  return allocateProportional(totalMinor, scaled);
}
