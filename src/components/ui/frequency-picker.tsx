"use client";
import { useMemo } from "react";
import {
  FrequencyConfigV2,
  MonthlySubRule,
  Weekday,
  Month,
  Position,
  HolidayBehavior,
  PRESET_FREQUENCIES,
  frequencyLabel,
  getNextSessions,
  monthlyRules,
  migrateConfig,
  FrequencyConfig as AnyFrequencyConfig,
} from "@/lib/frequency";
import { useLang } from "@/lib/i18n/context";

type Mode = FrequencyConfigV2["mode"];
type Lang = "fr" | "en" | "es" | "de";

interface Props {
  value?: AnyFrequencyConfig;
  onChange: (config: FrequencyConfigV2) => void;
}

const I18N: Record<Lang, {
  presets: string;
  mode: string;
  daily: string;
  interval: string;
  weekly: string;
  monthly: string;
  annual: string;
  weekdays: string;
  workdaysOnly: string;
  excludeHolidays: string;
  intervalDays: string;
  every: string;
  weeks: string;
  months: string;
  years: string;
  monthlyRule: string;
  fixedDay: string;
  nthWeekday: string;
  fortnight: string;
  firstAfter: string;
  nthAfter: string;
  addRule: string;
  removeRule: string;
  position: string;
  weekday: string;
  half: string;
  half1: string;
  half2: string;
  afterDay: string;
  dayOfMonth: string;
  annualSub: string;
  fixedDate: string;
  multipleMonths: string;
  selectMonths: string;
  month: string;
  startTime: string;
  holidayBehavior: string;
  hbNone: string;
  hbAdvance: string;
  hbPostpone: string;
  hbSkip: string;
  preview: string;
  positions: [string, string, string, string, string];
  dayShort: [string, string, string, string, string, string, string];
  monthShort: string[];
}> = {
  fr: {
    presets: "Raccourcis", mode: "Mode", daily: "Journalière", interval: "Intervalle",
    weekly: "Hebdomadaire", monthly: "Mensuelle", annual: "Annuelle",
    weekdays: "Jours actifs", workdaysOnly: "Jours ouvrés uniquement",
    excludeHolidays: "Exclure les jours fériés", intervalDays: "Intervalle (jours)",
    every: "Tous les", weeks: "semaine(s)", months: "mois", years: "année(s)",
    monthlyRule: "Règle mensuelle", fixedDay: "Jour fixe", nthWeekday: "Position + jour",
    fortnight: "Quinzaine", firstAfter: "1er jour après le N", nthAfter: "Nᵉ jour après le N", addRule: "+ Ajouter une occurrence", removeRule: "Supprimer",
    position: "Position", weekday: "Jour de semaine", half: "Quinzaine",
    half1: "1ère (1–15)", half2: "2ème (16–fin)", afterDay: "Après le jour",
    dayOfMonth: "Jour du mois", annualSub: "Sous-règle annuelle",
    fixedDate: "Date fixe (jour + mois)", multipleMonths: "Plusieurs mois",
    selectMonths: "Mois actifs", month: "Mois",
    startTime: "Heure de début", holidayBehavior: "Si jour férié",
    hbNone: "Aucun report", hbAdvance: "Avancer", hbPostpone: "Reporter", hbSkip: "Ignorer",
    preview: "12 prochaines sessions",
    positions: ["1ère", "2ème", "3ème", "4ème", "Dernière"],
    dayShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    monthShort: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
  },
  en: {
    presets: "Presets", mode: "Mode", daily: "Daily", interval: "Interval",
    weekly: "Weekly", monthly: "Monthly", annual: "Annual",
    weekdays: "Active days", workdaysOnly: "Workdays only",
    excludeHolidays: "Exclude holidays", intervalDays: "Interval (days)",
    every: "Every", weeks: "week(s)", months: "month(s)", years: "year(s)",
    monthlyRule: "Monthly rule", fixedDay: "Fixed day", nthWeekday: "Position + weekday",
    fortnight: "Fortnight", firstAfter: "1st weekday after day N", nthAfter: "Nth weekday after day N", addRule: "+ Add occurrence", removeRule: "Remove",
    position: "Position", weekday: "Weekday", half: "Half",
    half1: "1st (1–15)", half2: "2nd (16–end)", afterDay: "After day",
    dayOfMonth: "Day of month", annualSub: "Annual sub-rule",
    fixedDate: "Fixed date (day + month)", multipleMonths: "Multiple months",
    selectMonths: "Active months", month: "Month",
    startTime: "Start time", holidayBehavior: "If holiday",
    hbNone: "No shift", hbAdvance: "Advance", hbPostpone: "Postpone", hbSkip: "Skip",
    preview: "Next 12 sessions",
    positions: ["1st", "2nd", "3rd", "4th", "Last"],
    dayShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    monthShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  es: {
    presets: "Atajos", mode: "Modo", daily: "Diaria", interval: "Intervalo",
    weekly: "Semanal", monthly: "Mensual", annual: "Anual",
    weekdays: "Días activos", workdaysOnly: "Solo laborables",
    excludeHolidays: "Excluir feriados", intervalDays: "Intervalo (días)",
    every: "Cada", weeks: "semana(s)", months: "mes(es)", years: "año(s)",
    monthlyRule: "Regla mensual", fixedDay: "Día fijo", nthWeekday: "Posición + día",
    fortnight: "Quincena", firstAfter: "1er día tras N", nthAfter: "N-ésimo día tras N", addRule: "+ Añadir ocurrencia", removeRule: "Eliminar",
    position: "Posición", weekday: "Día semana", half: "Quincena",
    half1: "1ª (1–15)", half2: "2ª (16–fin)", afterDay: "Tras el día",
    dayOfMonth: "Día del mes", annualSub: "Sub-regla anual",
    fixedDate: "Fecha fija (día + mes)", multipleMonths: "Varios meses",
    selectMonths: "Meses activos", month: "Mes",
    startTime: "Hora inicio", holidayBehavior: "Si feriado",
    hbNone: "Sin cambio", hbAdvance: "Adelantar", hbPostpone: "Posponer", hbSkip: "Omitir",
    preview: "Próximas 12 sesiones",
    positions: ["1ª", "2ª", "3ª", "4ª", "Última"],
    dayShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    monthShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  },
  de: {
    presets: "Voreinstellungen", mode: "Modus", daily: "Täglich", interval: "Intervall",
    weekly: "Wöchentlich", monthly: "Monatlich", annual: "Jährlich",
    weekdays: "Aktive Tage", workdaysOnly: "Nur Werktage",
    excludeHolidays: "Feiertage ausschließen", intervalDays: "Intervall (Tage)",
    every: "Alle", weeks: "Woche(n)", months: "Monat(e)", years: "Jahr(e)",
    monthlyRule: "Monatsregel", fixedDay: "Fester Tag", nthWeekday: "Position + Wochentag",
    fortnight: "Halbmonat", firstAfter: "1. Wochentag nach Tag N", nthAfter: "N. Wochentag nach Tag N", addRule: "+ Vorkommen hinzufügen", removeRule: "Entfernen",
    position: "Position", weekday: "Wochentag", half: "Hälfte",
    half1: "1. (1–15)", half2: "2. (16–Ende)", afterDay: "Nach Tag",
    dayOfMonth: "Tag des Monats", annualSub: "Jahres-Unterregel",
    fixedDate: "Festes Datum (Tag + Monat)", multipleMonths: "Mehrere Monate",
    selectMonths: "Aktive Monate", month: "Monat",
    startTime: "Startzeit", holidayBehavior: "An Feiertagen",
    hbNone: "Keine", hbAdvance: "Vorziehen", hbPostpone: "Verschieben", hbSkip: "Überspringen",
    preview: "Nächste 12 Sitzungen",
    positions: ["1.", "2.", "3.", "4.", "Letzte"],
    dayShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    monthShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
  },
};

const DEFAULTS: Record<Mode, FrequencyConfigV2> = {
  DAILY: { mode: "DAILY", weekdays: [1, 2, 3, 4, 5], workdaysOnly: true },
  INTERVAL: { mode: "INTERVAL", days: 30 },
  WEEKLY: { mode: "WEEKLY", weekdays: [6], every: 1 },
  MONTHLY: { mode: "MONTHLY", every: 1, rule: { kind: "FIXED_DAY", day: 1 } },
  ANNUAL: { mode: "ANNUAL", every: 1, sub: { kind: "FIXED_DATE", day: 1, month: 1 } },
};

const inputClass = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]";
const inputStyle = { border: "1px solid #e2ddd4", background: "white" } as const;

export function FrequencyPicker({ value, onChange }: Props) {
  const rawLang = useLang();
  const lang = (["fr", "en", "es", "de"].includes(rawLang) ? rawLang : "fr") as Lang;
  const T = I18N[lang];

  const config: FrequencyConfigV2 = useMemo(
    () => (value ? migrateConfig(value) : DEFAULTS.MONTHLY),
    [value]
  );

  const setMode = (mode: Mode) => onChange(DEFAULTS[mode]);

  const previewDates = useMemo(() => getNextSessions(config, 12), [config]);
  const dateFmt = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US";

  const modeBtn = (m: Mode, label: string) => (
    <button
      key={m}
      type="button"
      onClick={() => setMode(m)}
      className="px-3 py-2 text-xs font-semibold transition-all"
      style={{
        background: config.mode === m ? "#0d3d28" : "transparent",
        color: config.mode === m ? "white" : "#0d3d28",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {T.presets}
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_FREQUENCIES.map((preset, i) => {
            const active = JSON.stringify(config) === JSON.stringify(preset.config);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(preset.config)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                style={
                  active
                    ? { background: "#0d3d28", color: "white", borderColor: "#0d3d28" }
                    : { background: "white", color: "#0d3d28", borderColor: "#e2ddd4" }
                }
              >
                {preset.label[lang] ?? preset.label.fr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode tabs */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          {T.mode}
        </label>
        <div className="inline-flex flex-wrap rounded-lg border overflow-hidden" style={{ borderColor: "#e2ddd4" }}>
          {modeBtn("DAILY", T.daily)}
          {modeBtn("INTERVAL", T.interval)}
          {modeBtn("WEEKLY", T.weekly)}
          {modeBtn("MONTHLY", T.monthly)}
          {modeBtn("ANNUAL", T.annual)}
        </div>
      </div>

      {/* Mode-specific body */}
      {config.mode === "DAILY" && (
        <DailyFields config={config} onChange={onChange} T={T} />
      )}
      {config.mode === "INTERVAL" && (
        <IntervalFields config={config} onChange={onChange} T={T} />
      )}
      {config.mode === "WEEKLY" && (
        <WeeklyFields config={config} onChange={onChange} T={T} />
      )}
      {config.mode === "MONTHLY" && (
        <MonthlyFields config={config} onChange={onChange} T={T} />
      )}
      {config.mode === "ANNUAL" && (
        <AnnualFields config={config} onChange={onChange} T={T} />
      )}

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
            {T.startTime}
          </label>
          <input
            type="time"
            className={inputClass}
            style={inputStyle}
            value={config.startTime ?? ""}
            onChange={(e) => onChange({ ...config, startTime: e.target.value || undefined })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
            {T.holidayBehavior}
          </label>
          <select
            className={inputClass}
            style={inputStyle}
            value={config.holidayBehavior ?? "NONE"}
            onChange={(e) => onChange({ ...config, holidayBehavior: e.target.value as HolidayBehavior })}
          >
            <option value="NONE">{T.hbNone}</option>
            <option value="ADVANCE">{T.hbAdvance}</option>
            <option value="POSTPONE">{T.hbPostpone}</option>
            <option value="SKIP">{T.hbSkip}</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div
        className="p-3 rounded-lg text-sm"
        style={{ background: "rgba(13,61,40,0.06)", border: "1px solid rgba(13,61,40,0.12)" }}
      >
        <div className="font-semibold text-[#0d3d28] mb-2">📅 {T.preview}</div>
        <div className="text-xs text-gray-500 mb-2">{frequencyLabel(config, lang)}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {previewDates.map((d, i) => (
            <div
              key={i}
              className="text-xs px-2 py-1 rounded bg-white border"
              style={{ borderColor: "#e2ddd4" }}
            >
              <span className="text-gray-400 mr-1">#{i + 1}</span>
              <span className="text-gray-700 font-medium">
                {d.toLocaleDateString(dateFmt, { weekday: "short", day: "numeric", month: "short", year: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components per mode ──────────────────────────────────────────────

type T_ = (typeof I18N)[Lang];

function WeekdayCheckboxes({
  selected,
  onChange,
  T,
}: {
  selected: Weekday[];
  onChange: (next: Weekday[]) => void;
  T: T_;
}) {
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
  const toggle = (w: Weekday) => {
    onChange(selected.includes(w) ? selected.filter((x) => x !== w) : [...selected, w].sort());
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {order.map((w) => {
        const active = selected.includes(w);
        return (
          <button
            key={w}
            type="button"
            onClick={() => toggle(w)}
            className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
            style={
              active
                ? { background: "#0d3d28", color: "white", borderColor: "#0d3d28" }
                : { background: "white", color: "#0d3d28", borderColor: "#e2ddd4" }
            }
          >
            {T.dayShort[w]}
          </button>
        );
      })}
    </div>
  );
}

function DailyFields({
  config,
  onChange,
  T,
}: {
  config: Extract<FrequencyConfigV2, { mode: "DAILY" }>;
  onChange: (c: FrequencyConfigV2) => void;
  T: T_;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {T.weekdays}
        </label>
        <WeekdayCheckboxes
          selected={config.weekdays}
          onChange={(weekdays) => onChange({ ...config, weekdays })}
          T={T}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!config.workdaysOnly}
            onChange={(e) => onChange({ ...config, workdaysOnly: e.target.checked })}
          />
          {T.workdaysOnly}
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!config.excludeHolidays}
            onChange={(e) => onChange({ ...config, excludeHolidays: e.target.checked })}
          />
          {T.excludeHolidays}
        </label>
      </div>
    </div>
  );
}

function IntervalFields({
  config,
  onChange,
  T,
}: {
  config: Extract<FrequencyConfigV2, { mode: "INTERVAL" }>;
  onChange: (c: FrequencyConfigV2) => void;
  T: T_;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
        {T.intervalDays}
      </label>
      <input
        type="number"
        min={1}
        max={365}
        className={inputClass}
        style={inputStyle}
        value={config.days}
        onChange={(e) => onChange({ ...config, days: Math.max(1, parseInt(e.target.value) || 1) })}
      />
    </div>
  );
}

function WeeklyFields({
  config,
  onChange,
  T,
}: {
  config: Extract<FrequencyConfigV2, { mode: "WEEKLY" }>;
  onChange: (c: FrequencyConfigV2) => void;
  T: T_;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {T.weekdays}
        </label>
        <WeekdayCheckboxes
          selected={config.weekdays}
          onChange={(weekdays) => onChange({ ...config, weekdays: weekdays.length ? weekdays : [6] })}
          T={T}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          {T.every} N {T.weeks}
        </label>
        <input
          type="number"
          min={1}
          max={52}
          className={inputClass}
          style={inputStyle}
          value={config.every ?? 1}
          onChange={(e) => onChange({ ...config, every: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>
    </div>
  );
}

function MonthlyRuleEditor({
  rule,
  onChange,
  T,
}: {
  rule: MonthlySubRule;
  onChange: (r: MonthlySubRule) => void;
  T: T_;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          {T.monthlyRule}
        </label>
        <select
          className={inputClass}
          style={inputStyle}
          value={rule.kind}
          onChange={(e) => {
            const k = e.target.value as MonthlySubRule["kind"];
            if (k === "FIXED_DAY") onChange({ kind: "FIXED_DAY", day: 1 });
            else if (k === "NTH_WEEKDAY") onChange({ kind: "NTH_WEEKDAY", position: 1, weekday: 6 });
            else if (k === "FORTNIGHT") onChange({ kind: "FORTNIGHT", half: 1, weekday: 6 });
            else if (k === "NTH_AFTER") onChange({ kind: "NTH_AFTER", position: 1, weekday: 0, afterDay: 15 });
            else onChange({ kind: "FIRST_AFTER", weekday: 1, afterDay: 5 });
          }}
        >
          <option value="FIXED_DAY">{T.fixedDay}</option>
          <option value="NTH_WEEKDAY">{T.nthWeekday}</option>
          <option value="FORTNIGHT">{T.fortnight}</option>
          <option value="FIRST_AFTER">{T.firstAfter}</option>
          <option value="NTH_AFTER">{T.nthAfter}</option>
        </select>
      </div>

      {rule.kind === "FIXED_DAY" && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
            {T.dayOfMonth}
          </label>
          <input
            type="number"
            min={1}
            max={31}
            className={inputClass}
            style={inputStyle}
            value={rule.day}
            onChange={(e) => onChange({ ...rule, day: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) })}
          />
        </div>
      )}

      {rule.kind === "NTH_WEEKDAY" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.position}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={rule.position}
              onChange={(e) => onChange({ ...rule, position: parseInt(e.target.value) as Position })}
            >
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>{T.positions[p - 1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.weekday}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={rule.weekday}
              onChange={(e) => onChange({ ...rule, weekday: parseInt(e.target.value) as Weekday })}
            >
              {T.dayShort.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        </div>
      )}

      {rule.kind === "FORTNIGHT" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.half}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={rule.half}
              onChange={(e) => onChange({ ...rule, half: parseInt(e.target.value) as 1 | 2 })}
            >
              <option value={1}>{T.half1}</option>
              <option value={2}>{T.half2}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.weekday}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={rule.weekday}
              onChange={(e) => onChange({ ...rule, weekday: parseInt(e.target.value) as Weekday })}
            >
              {T.dayShort.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        </div>
      )}

      {(rule.kind === "FIRST_AFTER" || rule.kind === "NTH_AFTER") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.weekday}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={rule.weekday}
              onChange={(e) => onChange({ ...rule, weekday: parseInt(e.target.value) as Weekday })}
            >
              {T.dayShort.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.afterDay}
            </label>
            <input
              type="number"
              min={1}
              max={28}
              className={inputClass}
              style={inputStyle}
              value={rule.afterDay}
              onChange={(e) => onChange({ ...rule, afterDay: Math.max(1, Math.min(28, parseInt(e.target.value) || 1)) })}
            />
          </div>
          {rule.kind === "NTH_AFTER" && (
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {T.position}
              </label>
              <select
                className={inputClass}
                style={inputStyle}
                value={rule.position}
                onChange={(e) => onChange({ ...rule, position: parseInt(e.target.value) as Position })}
              >
                {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>{T.positions[p - 1]}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MonthlyFields({
  config,
  onChange,
  T,
}: {
  config: Extract<FrequencyConfigV2, { mode: "MONTHLY" }>;
  onChange: (c: FrequencyConfigV2) => void;
  T: T_;
}) {
  const rules = monthlyRules(config);
  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div key={index} className="rounded-xl border border-[#e2ddd4] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#a97b18]">#{index + 1}</span>
            {rules.length > 1 && (
              <button type="button" onClick={() => onChange({ ...config, rules: rules.filter((_, i) => i !== index), rule: rules.filter((_, i) => i !== index)[0] })} className="text-[11px] font-semibold text-red-600">
                {T.removeRule}
              </button>
            )}
          </div>
          <MonthlyRuleEditor rule={rule} onChange={(next) => { const nextRules = rules.map((item, i) => i === index ? next : item); onChange({ ...config, rules: nextRules, rule: nextRules[0] }); }} T={T} />
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...config, rules: [...rules, { kind: "NTH_WEEKDAY", position: 1, weekday: 0 }], rule: rules[0] })} className="text-xs font-semibold text-[#0d3d28] underline">
        {T.addRule}
      </button>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          {T.every} N {T.months}
        </label>
        <input
          type="number"
          min={1}
          max={24}
          className={inputClass}
          style={inputStyle}
          value={config.every ?? 1}
          onChange={(e) => onChange({ ...config, every: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>
    </div>
  );
}

function MonthCheckboxes({
  selected,
  onChange,
  T,
}: {
  selected: Month[];
  onChange: (m: Month[]) => void;
  T: T_;
}) {
  const all: Month[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((m) => {
        const active = selected.includes(m);
        return (
          <button
            key={m}
            type="button"
            onClick={() => {
              const next = active ? selected.filter((x) => x !== m) : [...selected, m].sort((a, b) => a - b);
              onChange(next.length ? (next as Month[]) : selected);
            }}
            className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
            style={
              active
                ? { background: "#0d3d28", color: "white", borderColor: "#0d3d28" }
                : { background: "white", color: "#0d3d28", borderColor: "#e2ddd4" }
            }
          >
            {T.monthShort[m - 1]}
          </button>
        );
      })}
    </div>
  );
}

function AnnualFields({
  config,
  onChange,
  T,
}: {
  config: Extract<FrequencyConfigV2, { mode: "ANNUAL" }>;
  onChange: (c: FrequencyConfigV2) => void;
  T: T_;
}) {
  const sub = config.sub;
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          {T.annualSub}
        </label>
        <select
          className={inputClass}
          style={inputStyle}
          value={sub.kind}
          onChange={(e) => {
            const k = e.target.value as typeof sub.kind;
            if (k === "FIXED_DATE") onChange({ ...config, sub: { kind: "FIXED_DATE", day: 1, month: 1 } });
            else if (k === "NTH_WEEKDAY") onChange({ ...config, sub: { kind: "NTH_WEEKDAY", position: 1, weekday: 0, month: 1 } });
            else onChange({ ...config, sub: { kind: "MONTHS", months: [3, 9], rule: { kind: "FIXED_DAY", day: 15 } } });
          }}
        >
          <option value="FIXED_DATE">{T.fixedDate}</option>
          <option value="NTH_WEEKDAY">{T.nthWeekday}</option>
          <option value="MONTHS">{T.multipleMonths}</option>
        </select>
      </div>

      {sub.kind === "FIXED_DATE" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.dayOfMonth}
            </label>
            <input
              type="number"
              min={1}
              max={31}
              className={inputClass}
              style={inputStyle}
              value={sub.day}
              onChange={(e) =>
                onChange({ ...config, sub: { ...sub, day: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) } })
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.month}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={sub.month}
              onChange={(e) => onChange({ ...config, sub: { ...sub, month: parseInt(e.target.value) as Month } })}
            >
              {T.monthShort.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {sub.kind === "NTH_WEEKDAY" && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.position}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={sub.position}
              onChange={(e) =>
                onChange({ ...config, sub: { ...sub, position: parseInt(e.target.value) as Position } })
              }
            >
              {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>{T.positions[p - 1]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.weekday}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={sub.weekday}
              onChange={(e) =>
                onChange({ ...config, sub: { ...sub, weekday: parseInt(e.target.value) as Weekday } })
              }
            >
              {T.dayShort.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {T.month}
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={sub.month}
              onChange={(e) => onChange({ ...config, sub: { ...sub, month: parseInt(e.target.value) as Month } })}
            >
              {T.monthShort.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {sub.kind === "MONTHS" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              {T.selectMonths}
            </label>
            <MonthCheckboxes
              selected={sub.months}
              onChange={(months) => onChange({ ...config, sub: { ...sub, months } })}
              T={T}
            />
          </div>
          <MonthlyRuleEditor
            rule={sub.rule}
            onChange={(rule) => onChange({ ...config, sub: { ...sub, rule } })}
            T={T}
          />
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          {T.every} N {T.years}
        </label>
        <input
          type="number"
          min={1}
          max={10}
          className={inputClass}
          style={inputStyle}
          value={config.every ?? 1}
          onChange={(e) => onChange({ ...config, every: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>
    </div>
  );
}
