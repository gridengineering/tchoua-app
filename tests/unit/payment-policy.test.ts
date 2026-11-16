import { isBankOnlyPaymentMode, isBankPaymentMethod } from "@/lib/payment-policy";

describe("politique de paiement bancaire exclusif", () => {
  it("reconnaît le mode BANQUE_EXCLUSIVE", () => {
    expect(isBankOnlyPaymentMode(JSON.stringify({ paymentMode: "BANQUE_EXCLUSIVE" }))).toBe(true);
    expect(isBankOnlyPaymentMode(JSON.stringify({ paymentMode: "VIREMENT" }))).toBe(false);
    expect(isBankOnlyPaymentMode(null)).toBe(false);
  });

  it("accepte les libellés bancaires et refuse espèces/mobile money", () => {
    expect(isBankPaymentMethod("BANK")).toBe(true);
    expect(isBankPaymentMethod("BANK_TRANSFER")).toBe(true);
    expect(isBankPaymentMethod("CASH")).toBe(false);
    expect(isBankPaymentMethod("MOBILE_MONEY")).toBe(false);
  });
});
