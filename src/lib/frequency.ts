// ─── Moteur de fréquence des sessions ─────────────────────────────────────
// Modèle V2 : couvre journalier / hebdo (multi-jours, intervalle N) /
// mensuel (date fixe, position+jour, quinzaine, intervalle N mois) /
// annuel (date fixe, position+jour+mois, mois multiples).
// Les configs V1 (legacy en DB) sont automatiquement migrées via migrateConfig().

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dim, 1=Lun, …, 6=Sam
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Position = 1 | 2 | 3 | 4 | 5; // 5 = Dernier
export type HolidayBehavior = "NONE" | "ADVANCE" | "POSTPONE" | "SKIP";

export type MonthlySubRule =
  | { kind: "FIXED_DAY"; day: number }
  | { kind: "NTH_WEEKDAY"; position: Position; weekday: Weekday }
  | { kind: "FORTNIGHT"; half: 1 | 2; weekday: Weekday }
  | { kind: "FIRST_AFTER"; weekday: Weekday; afterDay: number }
  | { kind: "NTH_AFTER"; position: Position; weekday: Weekday; afterDay: number };

export type FrequencyConfigV2 =
  | {
      mode: "DAILY";
      weekdays: Weekday[];          // jours actifs (vide = tous)
      workdaysOnly?: boolean;       // exclut Sam+Dim
      excludeHolidays?: boolean;
      startTime?: string;
      holidayBehavior?: HolidayBehavior;
    }
  | {
      mode: "INTERVAL";
      days: number;                 // tous les N jours
      startTime?: string;
      holidayBehavior?: HolidayBehavior;
    }
  | {
      mode: "WEEKLY";
      weekdays: Weekday[];          // ≥1 jour
      every?: number;               // N semaines (1=chaque, 2=quinzaine…)
      startTime?: string;
      holidayBehavior?: HolidayBehavior;
    }
  | {
      mode: "MONTHLY";
      every?: number;               // N mois (1=chaque, 3=trimestre, 6=semestre…)
      /** Ancienne forme à une règle, conservée pour la rétrocompatibilité. */
      rule?: MonthlySubRule;
      /** Nouvelle forme : plusieurs occurrences peuvent tomber dans le même mois. */
      rules?: MonthlySubRule[];
      startTime?: string;
      holidayBehavior?: HolidayBehavior;
    }
  | {
      mode: "ANNUAL";
      every?: number;               // N années
      sub:
        | { kind: "FIXED_DATE"; day: number; month: Month }
        | { kind: "NTH_WEEKDAY"; position: Position; weekday: Weekday; month: Month }
        | { kind: "MONTHS"; months: Month[]; rule: MonthlySubRule };
      startTime?: string;
      holidayBehavior?: HolidayBehavior;
    };

// ─── Legacy V1 (conservé pour rétrocompat de lecture) ─────────────────────

export type LegacyFrequencyType =
  | "WEEKLY" | "BIWEEKLY"
  | "MONTHLY_DAY" | "MONTHLY_NTH_WEEKDAY"
  | "MONTHLY_FIRST_AFTER" | "MONTHLY_LAST_WEEKDAY"
  | "QUARTERLY" | "CUSTOM_INTERVAL";

// Alias rétrocompat — utilisé par l'ancien FrequencyPicker.
export type FrequencyType = LegacyFrequencyType;

export interface LegacyFrequencyConfig {
  type: LegacyFrequencyType;
  dayOfWeek?: number;
  nth?: number;
  afterDay?: number;
  dayOfMonth?: number;
  interval?: number;
  weeklyEvery?: number;
  startTime?: string;
}

// Type union accepté par toutes les fonctions publiques.
export type FrequencyConfig = FrequencyConfigV2 | LegacyFrequencyConfig;

function isLegacy(c: FrequencyConfig): c is LegacyFrequencyConfig {
  return (c as LegacyFrequencyConfig).type !== undefined &&
         (c as FrequencyConfigV2).mode === undefined;
}

// ─── Migration V1 → V2 ────────────────────────────────────────────────────

export function migrateConfig(c: FrequencyConfig): FrequencyConfigV2 {
  if (!isLegacy(c)) return c;

  const dow = (c.dayOfWeek ?? 6) as Weekday;
  const startTime = c.startTime;

  switch (c.type) {
    case "WEEKLY":
      return { mode: "WEEKLY", weekdays: [dow], every: c.weeklyEvery ?? 1, startTime };
    case "BIWEEKLY":
      return { mode: "WEEKLY", weekdays: [dow], every: 2, startTime };
    case "MONTHLY_DAY":
      return { mode: "MONTHLY", every: 1, rule: { kind: "FIXED_DAY", day: c.dayOfMonth ?? 1 }, startTime };
    case "MONTHLY_NTH_WEEKDAY":
      return { mode: "MONTHLY", every: 1,
        rule: { kind: "NTH_WEEKDAY", position: (c.nth ?? 1) as Position, weekday: dow }, startTime };
    case "MONTHLY_LAST_WEEKDAY":
      return { mode: "MONTHLY", every: 1,
        rule: { kind: "NTH_WEEKDAY", position: 5, weekday: dow }, startTime };
    case "MONTHLY_FIRST_AFTER":
      return { mode: "MONTHLY", every: 1,
        rule: { kind: "FIRST_AFTER", weekday: dow, afterDay: c.afterDay ?? 5 }, startTime };
    case "QUARTERLY":
      return { mode: "MONTHLY", every: 3,
        rule: { kind: "FIXED_DAY", day: c.dayOfMonth ?? 1 }, startTime };
    case "CUSTOM_INTERVAL":
      return { mode: "INTERVAL", days: c.interval ?? 30, startTime };
  }
}

export function parseFrequencyConfig(json?: string | null): FrequencyConfigV2 {
  if (!json) return { mode: "MONTHLY", every: 1, rule: { kind: "FIXED_DAY", day: 1 } };
  try {
    const raw = JSON.parse(json) as FrequencyConfig;
    return migrateConfig(raw);
  } catch {
    return { mode: "MONTHLY", every: 1, rule: { kind: "FIXED_DAY", day: 1 } };
  }
}

// ─── Helpers calendaires ──────────────────────────────────────────────────

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function lastDayOfMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

function nthWeekdayOfMonth(year: number, month0: number, dow: Weekday, nth: Position): Date {
  if (nth === 5) {
    const d = new Date(year, month0 + 1, 0);
    while (d.getDay() !== dow) d.setDate(d.getDate() - 1);
    return startOfDay(d);
  }
  const d = new Date(year, month0, 1);
  let count = 0;
  while (d.getMonth() === month0) {
    if (d.getDay() === dow) {
      count++;
      if (count === nth) return startOfDay(d);
    }
    d.setDate(d.getDate() + 1);
  }
  // fallback dernier
  return nthWeekdayOfMonth(year, month0, dow, 5);
}

function fortnightWeekday(year: number, month0: number, half: 1 | 2, dow: Weekday): Date {
  const start = half === 1 ? 1 : 16;
  const end = half === 1 ? 15 : lastDayOfMonth(year, month0);
  for (let day = start; day <= end; day++) {
    const d = new Date(year, month0, day);
    if (d.getDay() === dow) return startOfDay(d);
  }
  // pas trouvé : dernier essai sur la fin de la quinzaine
  return startOfDay(new Date(year, month0, end));
}

function firstWeekdayAfterDay(year: number, month0: number, dow: Weekday, after: number): Date {
  const d = new Date(year, month0, after + 1);
  while (d.getMonth() === month0 && d.getDay() !== dow) d.setDate(d.getDate() + 1);
  // si débordement de mois, on retourne la date trouvée même si dans le mois suivant
  return startOfDay(d);
}

function nthWeekdayAfterDay(
  year: number,
  month0: number,
  dow: Weekday,
  after: number,
  nth: Position
): Date | null {
  let count = 0;
  for (let day = after + 1; day <= lastDayOfMonth(year, month0); day++) {
    const d = new Date(year, month0, day);
    if (d.getDay() !== dow) continue;
    count++;
    if (count === nth) return startOfDay(d);
  }
  return null;
}

function applyMonthlyRule(year: number, month0: number, rule: MonthlySubRule): Date {
  // NTH_AFTER peut ne pas exister dans le mois : il est traité par applyMonthlyRuleSafe.
  if (rule.kind === "NTH_AFTER") {
    return nthWeekdayAfterDay(year, month0, rule.weekday, rule.afterDay, rule.position) ?? startOfDay(new Date(year, month0, 1));
  }
  switch (rule.kind) {
    case "FIXED_DAY": {
      const day = Math.min(rule.day, lastDayOfMonth(year, month0));
      return startOfDay(new Date(year, month0, day));
    }
    case "NTH_WEEKDAY":
      return nthWeekdayOfMonth(year, month0, rule.weekday, rule.position);
    case "FORTNIGHT":
      return fortnightWeekday(year, month0, rule.half, rule.weekday);
    case "FIRST_AFTER":
      return firstWeekdayAfterDay(year, month0, rule.weekday, rule.afterDay);
  }
}

function applyMonthlyRuleSafe(year: number, month0: number, rule: MonthlySubRule): Date | null {
  if (rule.kind === "NTH_AFTER") {
    return nthWeekdayAfterDay(year, month0, rule.weekday, rule.afterDay, rule.position);
  }
  return applyMonthlyRule(year, month0, rule);
}

export function monthlyRules(config: Extract<FrequencyConfigV2, { mode: "MONTHLY" }>): MonthlySubRule[] {
  if (config.rules?.length) return config.rules;
  return config.rule ? [config.rule] : [{ kind: "FIXED_DAY", day: 1 }];
}

function applyMonthlyRules(year: number, month0: number, rules: MonthlySubRule[]): Date[] {
  const dates = rules
    .map((rule) => applyMonthlyRuleSafe(year, month0, rule))
    .filter((date): date is Date => date !== null);
  const unique = new Map(dates.map((date) => [date.getTime(), date]));
  return [...unique.values()].sort((a, b) => a.getTime() - b.getTime());
}

function isHoliday(d: Date, holidays: Date[] | undefined): boolean {
  if (!holidays?.length) return false;
  const t = startOfDay(d).getTime();
  return holidays.some((h) => startOfDay(h).getTime() === t);
}

function isWorkday(d: Date): boolean {
  const dow = d.getDay();
  return dow !== 0 && dow !== 6;
}

// Applique le comportement de report en cas de jour férié.
function applyHolidayBehavior(
  d: Date,
  behavior: HolidayBehavior | undefined,
  holidays: Date[] | undefined
): Date | null {
  if (!behavior || behavior === "NONE") return d;
  if (!isHoliday(d, holidays)) return d;
  switch (behavior) {
    case "ADVANCE": {
      const x = new Date(d); x.setDate(x.getDate() - 1);
      while (isHoliday(x, holidays)) x.setDate(x.getDate() - 1);
      return x;
    }
    case "POSTPONE": {
      const x = new Date(d); x.setDate(x.getDate() + 1);
      while (isHoliday(x, holidays)) x.setDate(x.getDate() + 1);
      return x;
    }
    case "SKIP":
      return null;
  }
}

// ─── API publique : prochaines sessions ───────────────────────────────────

export interface SessionGenOptions {
  holidays?: Date[];   // jours fériés du pays
  from?: Date;         // date de départ (défaut: aujourd'hui)
}

export function getNextSessionDate(
  configIn: FrequencyConfig,
  fromOrOpts: Date | SessionGenOptions = new Date()
): Date {
  const opts = fromOrOpts instanceof Date ? { from: fromOrOpts } : fromOrOpts;
  const list = getNextSessions(configIn, 1, opts);
  return list[0] ?? startOfDay(opts.from ?? new Date());
}

export function getNextSessions(
  configIn: FrequencyConfig,
  count: number,
  opts: SessionGenOptions = {}
): Date[] {
  const config = migrateConfig(configIn);
  const { holidays } = opts;
  const from = startOfDay(opts.from ?? new Date());
  const out: Date[] = [];
  // garde-fou : on n'itère jamais > 5 ans dans le futur
  const hardStop = startOfDay(new Date(from.getTime() + 5 * 366 * DAY_MS));
  let cursor = from;

  while (out.length < count && cursor <= hardStop) {
    const next = nextOccurrence(config, cursor);
    if (!next || next > hardStop) break;
    const adjusted = applyHolidayBehavior(next, config.holidayBehavior, holidays);
    if (adjusted) out.push(adjusted);
    cursor = new Date(next.getTime() + DAY_MS);
  }
  return out;
}

// Renvoie la prochaine occurrence (>= from) sans tenir compte des fériés.
function nextOccurrence(c: FrequencyConfigV2, from: Date): Date | null {
  switch (c.mode) {
    case "DAILY": {
      const days = c.weekdays?.length ? c.weekdays : ([0,1,2,3,4,5,6] as Weekday[]);
      const d = new Date(from);
      for (let i = 0; i < 366 * 2; i++) {
        const dow = d.getDay() as Weekday;
        const ok = days.includes(dow) &&
                   (!c.workdaysOnly || isWorkday(d));
        if (ok) return startOfDay(d);
        d.setDate(d.getDate() + 1);
      }
      return null;
    }
    case "INTERVAL":
      return startOfDay(from);
    case "WEEKLY": {
      const every = Math.max(1, c.every ?? 1);
      const days = c.weekdays?.length ? [...c.weekdays].sort() : [6 as Weekday];
      // pour intervalle > 1, on cherche le prochain jour cible et on saute par tranches de "every" semaines
      for (let i = 0; i < 7 * every * 8; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        if (!days.includes(d.getDay() as Weekday)) continue;
        if (every === 1) return startOfDay(d);
        // ancrage : semaine du from (lundi) ; on accepte si (deltaWeeks % every === 0)
        const monday = new Date(from);
        monday.setDate(monday.getDate() - ((from.getDay() + 6) % 7));
        const deltaDays = Math.floor((d.getTime() - monday.getTime()) / DAY_MS);
        const deltaWeeks = Math.floor(deltaDays / 7);
        if (deltaWeeks % every === 0) return startOfDay(d);
      }
      return null;
    }
    case "MONTHLY": {
      const every = Math.max(1, c.every ?? 1);
      const rules = monthlyRules(c);
      let y = from.getFullYear();
      let m = from.getMonth();
      for (let i = 0; i < 12 * every * 6; i++) {
        if (monthDiff(from, new Date(y, m, 1)) % every === 0) {
          const candidates = applyMonthlyRules(y, m, rules)
            .filter((candidate) => candidate >= from)
            .sort((a, b) => a.getTime() - b.getTime());
          if (candidates.length > 0) return candidates[0];
        }
        m++;
        if (m > 11) { m = 0; y++; }
      }
      return null;
    }
    case "ANNUAL": {
      const every = Math.max(1, c.every ?? 1);
      const candidates: Date[] = [];
      for (let yOffset = 0; yOffset < every * 5; yOffset++) {
        const y = from.getFullYear() + yOffset;
        if (yOffset % every !== 0) continue;
        if (c.sub.kind === "FIXED_DATE") {
          const day = Math.min(c.sub.day, lastDayOfMonth(y, c.sub.month - 1));
          candidates.push(startOfDay(new Date(y, c.sub.month - 1, day)));
        } else if (c.sub.kind === "NTH_WEEKDAY") {
          candidates.push(nthWeekdayOfMonth(y, c.sub.month - 1, c.sub.weekday, c.sub.position));
        } else {
          for (const m of c.sub.months) {
            candidates.push(applyMonthlyRule(y, m - 1, c.sub.rule));
          }
        }
      }
      const future = candidates.filter((d) => d >= from).sort((a, b) => a.getTime() - b.getTime());
      return future[0] ?? null;
    }
  }
}

function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ─── Libellé humain ───────────────────────────────────────────────────────

type Bundle = {
  days: string[];
  months: string[];
  nth: string[];
  daily: string;
  weekly: string;
  monthly: string;
  annual: string;
  everyN: (n: number, unit: string) => string;
  each: string;
  workdays: string;
  of: string;
  on: string;
  fortnight: (h: 1 | 2) => string;
  interval: (n: number) => string;
  after: (d: number) => string;
};

const I18N: { fr: Bundle; en: Bundle } = {
  fr: {
    days: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
    months: ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"],
    nth: ["", "1er", "2ème", "3ème", "4ème", "Dernier"],
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    annual: "Annuel",
    everyN: (n: number, unit: string) => n === 1 ? unit : `tous les ${n} ${unit}`,
    each: "Chaque",
    workdays: "jours ouvrés",
    of: "de",
    on: "le",
    fortnight: (h: 1|2) => `${h === 1 ? "1ère" : "2ème"} quinzaine`,
    interval: (n: number) => `Tous les ${n} jours`,
    after: (d: number) => `après le ${d}`,
  },
  en: {
    days: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    nth: ["", "1st", "2nd", "3rd", "4th", "Last"],
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    annual: "Annual",
    everyN: (n: number, unit: string) => n === 1 ? unit : `every ${n} ${unit}`,
    each: "Every",
    workdays: "workdays",
    of: "of",
    on: "on",
    fortnight: (h: 1|2) => `${h === 1 ? "1st" : "2nd"} fortnight`,
    interval: (n: number) => `Every ${n} days`,
    after: (d: number) => `after the ${d}th`,
  },
};

export function frequencyLabel(c: FrequencyConfig, lang: string = "fr"): string {
  const config = migrateConfig(c);
  const L = (lang === "en" ? "en" : "fr") as keyof typeof I18N;
  const T = I18N[L];

  switch (config.mode) {
    case "DAILY": {
      if (config.workdaysOnly) return `${T.daily} (${T.workdays})`;
      const list = (config.weekdays ?? []).map((d) => T.days[d]).join(", ");
      return list ? `${T.daily} : ${list}` : T.daily;
    }
    case "INTERVAL":
      return T.interval(config.days);
    case "WEEKLY": {
      const days = (config.weekdays ?? []).map((d) => T.days[d]).join(", ");
      const every = config.every ?? 1;
      return every === 1 ? `${T.each} ${days}` : `${T.everyN(every, "semaines")} : ${days}`;
    }
    case "MONTHLY": {
      const every = config.every ?? 1;
      const ruleLabel = monthlyRules(config).map((rule) => monthlyRuleLabel(rule, T)).join(" + ");
      return every === 1 ? `${T.monthly} : ${ruleLabel}` : `${T.everyN(every, "mois")} : ${ruleLabel}`;
    }
    case "ANNUAL": {
      const every = config.every ?? 1;
      let body = "";
      if (config.sub.kind === "FIXED_DATE") body = `${config.sub.day} ${T.months[config.sub.month - 1]}`;
      else if (config.sub.kind === "NTH_WEEKDAY")
        body = `${T.nth[config.sub.position]} ${T.days[config.sub.weekday]} ${T.of} ${T.months[config.sub.month - 1]}`;
      else
        body = `${config.sub.months.map((m) => T.months[m - 1]).join(", ")} — ${monthlyRuleLabel(config.sub.rule, T)}`;
      return every === 1 ? `${T.annual} : ${body}` : `${T.everyN(every, "ans")} : ${body}`;
    }
  }
}

function monthlyRuleLabel(rule: MonthlySubRule, T: Bundle): string {
  switch (rule.kind) {
    case "FIXED_DAY":   return `${T.on} ${rule.day}`;
    case "NTH_WEEKDAY": return `${T.nth[rule.position]} ${T.days[rule.weekday]}`;
    case "FORTNIGHT":   return `${T.days[rule.weekday]} (${T.fortnight(rule.half)})`;
    case "FIRST_AFTER": return `1er ${T.days[rule.weekday]} ${T.after(rule.afterDay)}`;
    case "NTH_AFTER": return `${T.nth[rule.position]} ${T.days[rule.weekday]} ${T.after(rule.afterDay)}`;
  }
}

// ─── Presets pour l'UI ────────────────────────────────────────────────────

export const PRESET_FREQUENCIES: Array<{ label: Record<string, string>; config: FrequencyConfigV2 }> = [
  { label: { fr: "Le 1er de chaque mois", en: "1st of each month" },
    config: { mode: "MONTHLY", every: 1, rule: { kind: "FIXED_DAY", day: 1 } } },
  { label: { fr: "Le 15 de chaque mois", en: "15th of each month" },
    config: { mode: "MONTHLY", every: 1, rule: { kind: "FIXED_DAY", day: 15 } } },
  { label: { fr: "1er Samedi du mois", en: "1st Saturday of month" },
    config: { mode: "MONTHLY", every: 1, rule: { kind: "NTH_WEEKDAY", position: 1, weekday: 6 } } },
  { label: { fr: "Dernier Vendredi du mois", en: "Last Friday of month" },
    config: { mode: "MONTHLY", every: 1, rule: { kind: "NTH_WEEKDAY", position: 5, weekday: 5 } } },
  { label: { fr: "Chaque Samedi", en: "Every Saturday" },
    config: { mode: "WEEKLY", every: 1, weekdays: [6] } },
  { label: { fr: "Lundi & Vendredi", en: "Mon & Fri" },
    config: { mode: "WEEKLY", every: 1, weekdays: [1, 5] } },
  { label: { fr: "Toutes les 2 semaines (Jeudi)", en: "Every 2 weeks (Thu)" },
    config: { mode: "WEEKLY", every: 2, weekdays: [4] } },
  { label: { fr: "Tous les jours ouvrés", en: "Every workday" },
    config: { mode: "DAILY", weekdays: [1,2,3,4,5], workdaysOnly: true } },
  { label: { fr: "Trimestriel (le 1er)", en: "Quarterly (1st)" },
    config: { mode: "MONTHLY", every: 3, rule: { kind: "FIXED_DAY", day: 1 } } },
  { label: { fr: "Semestriel (15 mars / 15 sept)", en: "Biannual (Mar 15 / Sep 15)" },
    config: { mode: "ANNUAL", every: 1, sub: { kind: "MONTHS", months: [3, 9], rule: { kind: "FIXED_DAY", day: 15 } } } },
  { label: { fr: "AG annuelle (2ème dimanche de janvier)", en: "Annual GA (2nd Sunday of January)" },
    config: { mode: "ANNUAL", every: 1, sub: { kind: "NTH_WEEKDAY", position: 2, weekday: 0, month: 1 } } },
];
