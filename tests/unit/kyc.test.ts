import { KYC_LEVELS, kycLevelInfo, normalizeKycLevel, requiredKycForAmount } from "@/lib/kyc";

describe("KYC — niveaux et seuils par risque", () => {
  test("normalise les niveaux inconnus", () => {
    expect(normalizeKycLevel(undefined)).toBe(0);
    expect(normalizeKycLevel(1)).toBe(1);
    expect(normalizeKycLevel(99)).toBe(3);
  });

  test("expose quatre niveaux classés", () => {
    expect(KYC_LEVELS).toHaveLength(4);
    expect(kycLevelInfo(2).code).toBe("VERIFIED");
  });

  test("applique les seuils indicatifs GAFI", () => {
    expect(requiredKycForAmount(250_000)).toBe(1);
    expect(requiredKycForAmount(2_000_000)).toBe(2);
    expect(requiredKycForAmount(12_000_000)).toBe(3);
  });
});
