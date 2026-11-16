/**
 * Politique de paiement d'une association.
 * `bankConfig.paymentMode = "BANQUE_EXCLUSIVE"` signifie que tous les
 * versements doivent passer par un virement bancaire.
 */
export const BANK_PAYMENT_METHODS = ["BANK", "BANK_TRANSFER", "VIREMENT", "TRANSFER"] as const;

export function isBankPaymentMethod(method?: string | null): boolean {
  return BANK_PAYMENT_METHODS.includes(String(method ?? "").toUpperCase() as (typeof BANK_PAYMENT_METHODS)[number]);
}

export function isBankOnlyPaymentMode(bankConfig?: string | null): boolean {
  if (!bankConfig) return false;
  try {
    const parsed = JSON.parse(bankConfig) as { paymentMode?: string };
    return parsed?.paymentMode === "BANQUE_EXCLUSIVE";
  } catch {
    return false;
  }
}

export function bankOnlyPaymentError(): { error: string; code: string } {
  return {
    error: "Cette association accepte uniquement les versements par virement bancaire.",
    code: "BANK_PAYMENT_ONLY",
  };
}
