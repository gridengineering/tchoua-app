import { TRUST_LEVELS, trustLevelForScore } from "@/lib/trust-levels";

describe("Confiance des associations — niveaux", () => {
  test("classe les scores par palier", () => {
    expect(trustLevelForScore(0).level).toBe(0);
    expect(trustLevelForScore(42).level).toBe(2);
    expect(trustLevelForScore(71).level).toBe(3);
    expect(trustLevelForScore(96).level).toBe(5);
  });

  test("expose six paliers", () => {
    expect(TRUST_LEVELS).toHaveLength(6);
  });
});
