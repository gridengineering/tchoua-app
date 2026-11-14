"use client";

import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { kycLevelInfo, normalizeKycLevel } from "@/lib/kyc";

type Props = {
  level: number | null | undefined;
  status?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function KycBadge({ level, status, showLabel = true, size = "sm", className = "" }: Props) {
  const value = normalizeKycLevel(level);
  const info = kycLevelInfo(value);
  const pending = status === "PENDING";
  const Icon = value >= 2 ? ShieldCheck : value === 1 ? Shield : ShieldAlert;
  const dims = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";

  return (
    <span
      title={`${info.label} — ${info.description}${pending ? " (vérification en cours)" : ""}`}
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${dims} ${info.badgeClass} ${className}`}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      <span>{showLabel ? info.shortLabel : info.level}</span>
      {pending ? <span className="opacity-70">· en cours</span> : null}
    </span>
  );
}
