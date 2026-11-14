import { ShieldCheck } from "lucide-react";
import { TRUST_LEVELS } from "@/lib/trust-levels";

export function TrustBadge({ score, level }: { score?: number | null; level?: number | null }) {
  const info = TRUST_LEVELS.find((item) => item.level === Number(level ?? 0)) ?? TRUST_LEVELS[0];
  const tone =
    Number(level) >= 4
      ? "border-violet-200 bg-violet-50 text-violet-800"
      : Number(level) === 3
        ? "border-slate-300 bg-slate-100 text-slate-700"
        : Number(level) === 2
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-sky-200 bg-sky-50 text-sky-800";
  return (
    <span title={`Niveau de confiance ${info.label} — ${score ?? 0}/100`} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone}`}>
      <ShieldCheck className="h-3 w-3" /> {info.label} · {score ?? 0}/100
    </span>
  );
}
