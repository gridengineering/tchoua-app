import { allocateDividendMinor } from "@/lib/association/dividends";

describe("allocateDividendMinor", () => {
  it("répartit exactement les intérêts sans perte d'arrondi", () => {
    const capital = new Map([
      ["a", 1],
      ["b", 1],
      ["c", 1],
    ]);
    const allocation = allocateDividendMinor(100_000, capital, ["a", "b", "c"]);
    const sum = [...allocation.values()].reduce((s, value) => s + value, 0);
    expect(sum).toBe(100_000);
    expect([...allocation.values()].sort()).toEqual([33_333, 33_333, 33_334]);
  });

  it("attribue tout aux membres éligibles et rien aux exclus", () => {
    const capital = new Map([
      ["a", 60],
      ["b", 40],
      ["c", 100],
    ]);
    const allocation = allocateDividendMinor(10_000, capital, ["a", "b"]);
    expect(allocation.get("a")).toBe(6_000);
    expect(allocation.get("b")).toBe(4_000);
    expect(allocation.has("c")).toBe(false);
    expect([...allocation.values()].reduce((s, value) => s + value, 0)).toBe(10_000);
  });

  it("retourne une allocation vide sans capital éligible", () => {
    expect(allocateDividendMinor(10_000, new Map(), []).size).toBe(0);
  });
});
