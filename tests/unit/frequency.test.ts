import { getNextSessions, monthlyRules, type FrequencyConfigV2 } from "@/lib/frequency";

const d = (year: number, month: number, day: number) => new Date(year, month - 1, day);
const fmt = (dates: Date[]) =>
  dates.map(
    (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  );

describe("fréquence des sessions — règles mensuelles composées", () => {
  it("gère le 2e dimanche après le 15", () => {
    const config: FrequencyConfigV2 = {
      mode: "MONTHLY",
      every: 1,
      rules: [{ kind: "NTH_AFTER", position: 2, weekday: 0, afterDay: 15 }],
    };
    expect(fmt(getNextSessions(config, 2, { from: d(2026, 11, 1) }))).toEqual([
      "2026-11-29",
      "2026-12-27",
    ]);
  });

  it("compose deux occurrences dans le même mois", () => {
    const config: FrequencyConfigV2 = {
      mode: "MONTHLY",
      every: 1,
      rules: [
        { kind: "NTH_WEEKDAY", position: 1, weekday: 0 },
        { kind: "FORTNIGHT", half: 2, weekday: 0 },
      ],
    };
    expect(fmt(getNextSessions(config, 3, { from: d(2026, 11, 1) }))).toEqual([
      "2026-11-01",
      "2026-11-22",
      "2026-12-06",
    ]);
  });

  it("dédoublonne deux règles qui tombent le même jour", () => {
    const config: FrequencyConfigV2 = {
      mode: "MONTHLY",
      every: 1,
      rules: [
        { kind: "NTH_WEEKDAY", position: 1, weekday: 0 },
        { kind: "FIXED_DAY", day: 1 },
      ],
    };
    expect(fmt(getNextSessions(config, 3, { from: d(2026, 11, 1) }))).toEqual([
      "2026-11-01",
      "2026-12-01",
      "2026-12-06",
    ]);
  });

  it("omet un NTH_AFTER impossible au lieu de planter", () => {
    const config: FrequencyConfigV2 = {
      mode: "MONTHLY",
      every: 1,
      rules: [{ kind: "NTH_AFTER", position: 2, weekday: 0, afterDay: 25 }],
    };
    expect(getNextSessions(config, 1, { from: d(2026, 11, 1) })).toEqual([]);
  });

  it("reste rétrocompatible avec l’ancienne règle unique", () => {
    const legacy = {
      mode: "MONTHLY",
      every: 1,
      rule: { kind: "NTH_WEEKDAY", position: 1, weekday: 0 },
    } as const;
    expect(monthlyRules(legacy).length).toBe(1);
    expect(fmt(getNextSessions(legacy, 1, { from: d(2026, 11, 1) }))).toEqual(["2026-11-01"]);
  });
});
