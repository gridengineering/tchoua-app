"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ArpIssue } from "@/lib/arp/types";

export const ARP_INPUT =
  "w-full rounded-lg border border-[#e2ddd4] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10 disabled:cursor-not-allowed disabled:bg-[#f6f3ec] disabled:text-[#9ca3af]";
export const ARP_LABEL =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={ARP_LABEL}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-[#8a8378]">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={ARP_INPUT}
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  min = 0,
  max,
  step = 1,
  disabled,
  suffix,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  suffix?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="relative">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`${ARP_INPUT} ${suffix ? "pr-14" : ""}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a8378]">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={ARP_INPUT}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-[#e8e2d8] bg-white px-3 py-2.5 text-left transition hover:border-[#c9c1b3] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition ${
          checked ? "bg-[#0d3d28]" : "bg-[#d6d1c7]"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[#1f2937]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] leading-4 text-[#8a8378]">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

export function SectionCard({
  title,
  description,
  icon,
  children,
  actions,
  id,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-2xl border border-[#e8e2d8] bg-[#fffdf9]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#efe9dd] px-5 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? (
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0d3d28]/8 text-[#0d3d28]">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#1a1a1a]">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-[11.5px] leading-4 text-[#7a7368]">{description}</p>
            ) : null}
          </div>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "gray" | "blue";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "bg-[#ecf7ef] text-[#166534] border-[#cce8d4]",
    amber: "bg-[#fff7e6] text-[#92400e] border-[#f2dfb8]",
    red: "bg-[#fef2f2] text-[#991b1b] border-[#f3cdcd]",
    gray: "bg-[#f5f3ee] text-[#57534e] border-[#e4dfd5]",
    blue: "bg-[#eef4ff] text-[#1e40af] border-[#cfdffc]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function IssueList({
  issues,
  tone = "error",
  title,
}: {
  issues: ArpIssue[];
  tone?: "error" | "warning";
  title?: string;
}) {
  if (issues.length === 0) return null;
  const isError = tone === "error";
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        isError ? "border-[#f3cdcd] bg-[#fef6f6]" : "border-[#f2dfb8] bg-[#fffbf1]"
      }`}
    >
      <div className="mb-2 flex items-center gap-1.5">
        {isError ? (
          <XCircle className="h-4 w-4 text-[#b91c1c]" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-[#b45309]" />
        )}
        <p className={`text-xs font-bold ${isError ? "text-[#991b1b]" : "text-[#92400e]"}`}>
          {title ?? (isError ? `${issues.length} contrôle(s) bloquant(s)` : `${issues.length} avertissement(s)`)}
        </p>
      </div>
      <ul className="space-y-1.5">
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${index}`} className="flex gap-2 text-[11.5px] leading-4">
            <span className="mt-0.5 flex-shrink-0 font-mono text-[10px] opacity-60">{issue.code}</span>
            <span className={isError ? "text-[#7f1d1d]" : "text-[#78350f]"}>{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  const color = safe >= 90 ? "#15803d" : safe >= 60 ? "#b45309" : "#b91c1c";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e9e4da]">
      <div className="h-full rounded-full transition-all" style={{ width: `${safe}%`, background: color }} />
    </div>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-dashed border-[#ddd6c8] bg-[#fbf9f3] px-3 py-2.5 text-[11.5px] leading-4 text-[#7a7368]">
      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function CheckLine({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[11.5px] leading-4">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#15803d]" />
      ) : (
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#b45309]" />
      )}
      <span className={ok ? "text-[#3f3a33]" : "text-[#92400e]"}>{children}</span>
    </div>
  );
}
