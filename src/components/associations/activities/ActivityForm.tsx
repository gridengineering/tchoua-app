"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowLeft, CalendarClock, Coins, HandCoins, Info, Layers,
  Settings2, Wallet,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FrequencyPicker } from "@/components/ui/frequency-picker";
import {
  FrequencyConfigV2, frequencyLabel, getNextSessions, parseFrequencyConfig,
} from "@/lib/frequency";
import { formatCurrency } from "@/lib/utils";

const ACTIVITY_TYPES = [
  { value: "TONTINE_ROTATIVE", label: "Tontine rotative (tirage)", group: "tontine" },
  { value: "TONTINE_ASCA", label: "Tontine ASCA", group: "tontine" },
  { value: "TONTINE_ENCHERES", label: "Tontine aux enchères", group: "tontine" },
  { value: "EPARGNE", label: "Épargne / Investissement", group: "savings" },
  { value: "PRET", label: "Caisse de prêts", group: "loan" },
  { value: "AIDE_SOLIDAIRE", label: "Caisse de solidarité", group: "solidarity" },
  { value: "NATURE", label: "Cotisation en nature", group: "nature" },
  { value: "INVESTISSEMENT", label: "Investissement collectif", group: "savings" },
  { value: "ACHATS_GROUPES", label: "Achats groupés", group: "other" },
  { value: "COLLECTION", label: "Collecte ponctuelle", group: "other" },
];

const DISTRIBUTION_MODES = [
  { value: "ROTATION", label: "Rotation (ordre figé)" },
  { value: "LOTTERY_MONTHLY", label: "Tirage mensuel" },
  { value: "LOTTERY_UNIQUE", label: "Tirage unique (calendrier figé)" },
  { value: "AUCTION", label: "Enchères" },
  { value: "MERIT", label: "Mérite / besoins" },
  { value: "HYBRID", label: "Hybride" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "BANK", label: "Virement" },
  { value: "NATURE", label: "Nature" },
  { value: "TIME", label: "Temps / services" },
];

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-stone bg-white text-sm text-charcoal outline-none focus:ring-4 focus:ring-forest/10 focus:border-forest/40 transition";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash";

export type ActivityInitial = {
  id?: string;
  name?: string;
  description?: string | null;
  type?: string;
  participation?: string;
  contributionAmount?: number | null;
  contributionUnit?: string;
  contributionFrequency?: string;
  distributionMode?: string;
  auctionMinBidPct?: number | null;
  auctionMinBidders?: number | null;
  partAmount?: number | null;
  maxPartsPerSession?: number;
  beneficiaryAmountPerShare?: number | null;
  minShareFraction?: number;
  maxSharesPerMember?: number | null;
  maxBeneficiarySharesPerSession?: number | null;
  allowPartialShares?: boolean;
  allowSameBeneficiaryMultipleShares?: boolean;
  cycleMode?: string;
  cycleSessions?: number | null;
  cycleStart?: string | null;
  cycleEnd?: string | null;
  caisseLoanRate?: number | null;
  caisseLoanDuration?: number | null;
  loanRate1?: number | null;
  loanRate2?: number | null;
  loanMaxPerMember?: string | null;
  loanApprovalMode?: string;
  loanMaxActive?: number;
  penaltyLateAmount?: number | null;
  penaltyLatePercent?: number | null;
  penaltyGraceDays?: number | null;
  maxRetards?: number | null;
  paymentMethods?: string;
  frequencyConfig?: string | null;
};

function boolFromJson(value: string | null | undefined): string[] {
  if (!value) return ["CASH"];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length ? parsed : ["CASH"];
  } catch {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function legacyFrequency(mode: FrequencyConfigV2["mode"]): string {
  if (mode === "DAILY") return "DAILY";
  if (mode === "WEEKLY") return "WEEKLY";
  if (mode === "ANNUAL") return "ANNUAL";
  if (mode === "MONTHLY") return "MONTHLY";
  return "CUSTOM";
}

export function ActivityForm({
  associationId,
  mode = "create",
  initial,
}: {
  associationId: string;
  mode?: "create" | "edit";
  initial?: ActivityInitial | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialLimit = useMemo(() => {
    if (!initial?.loanMaxPerMember) return "";
    try {
      const parsed = JSON.parse(initial.loanMaxPerMember);
      return parsed?.value != null ? String(parsed.value) : "";
    } catch {
      return "";
    }
  }, [initial?.loanMaxPerMember]);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "TONTINE_ROTATIVE",
    participation: initial?.participation ?? "MANDATORY",
    contributionAmount: initial?.contributionAmount != null ? String(initial.contributionAmount) : "",
    contributionUnit: initial?.contributionUnit ?? "CASH",
    distributionMode: initial?.distributionMode ?? "ROTATION",
    auctionMinBidPct: initial?.auctionMinBidPct != null ? String(initial.auctionMinBidPct) : "5",
    auctionMinBidders: initial?.auctionMinBidders != null ? String(initial.auctionMinBidders) : "2",
    partAmount: initial?.partAmount != null ? String(initial.partAmount) : "",
    maxPartsPerSession: initial?.maxPartsPerSession != null ? String(initial.maxPartsPerSession) : "1",
    beneficiaryAmountPerShare: initial?.beneficiaryAmountPerShare != null ? String(initial.beneficiaryAmountPerShare) : "",
    minShareFraction: initial?.minShareFraction != null ? String(initial.minShareFraction) : "1",
    maxSharesPerMember: initial?.maxSharesPerMember != null ? String(initial.maxSharesPerMember) : "",
    maxBeneficiarySharesPerSession: initial?.maxBeneficiarySharesPerSession != null ? String(initial.maxBeneficiarySharesPerSession) : "",
    allowPartialShares: initial?.allowPartialShares ?? false,
    allowSameBeneficiaryMultipleShares: initial?.allowSameBeneficiaryMultipleShares ?? true,
    cycleMode: initial?.cycleMode ?? "FIXED_SESSIONS",
    cycleSessions: initial?.cycleSessions != null ? String(initial.cycleSessions) : "",
    cycleStart: initial?.cycleStart ? initial.cycleStart.slice(0, 10) : "",
    cycleEnd: initial?.cycleEnd ? initial.cycleEnd.slice(0, 10) : "",
    caisseLoanRate: initial?.caisseLoanRate != null ? String(initial.caisseLoanRate) : "",
    caisseLoanDuration: initial?.caisseLoanDuration != null ? String(initial.caisseLoanDuration) : "",
    loanRate1: initial?.loanRate1 != null ? String(initial.loanRate1) : "2",
    loanRate2: initial?.loanRate2 != null ? String(initial.loanRate2) : "4",
    loanMaxPerMember: initialLimit,
    loanApprovalMode: initial?.loanApprovalMode ?? "BUREAU",
    loanMaxActive: initial?.loanMaxActive != null ? String(initial.loanMaxActive) : "1",
    penaltyLateAmount: initial?.penaltyLateAmount != null ? String(initial.penaltyLateAmount) : "",
    penaltyLatePercent: initial?.penaltyLatePercent != null ? String(initial.penaltyLatePercent) : "",
    penaltyGraceDays: initial?.penaltyGraceDays != null ? String(initial.penaltyGraceDays) : "",
    maxRetards: initial?.maxRetards != null ? String(initial.maxRetards) : "",
    paymentMethods: boolFromJson(initial?.paymentMethods),
  });

  const [frequency, setFrequency] = useState<FrequencyConfigV2>(() =>
    initial?.frequencyConfig
      ? parseFrequencyConfig(initial.frequencyConfig)
      : { mode: "MONTHLY", every: 1, rule: { kind: "FIXED_DAY", day: 1 } }
  );

  const typeGroup = useMemo(
    () => ACTIVITY_TYPES.find((t) => t.value === form.type)?.group ?? "other",
    [form.type]
  );

  const isTontine = typeGroup === "tontine";
  const isLoan = typeGroup === "loan";
  const previewDates = useMemo(() => getNextSessions(frequency, 12), [frequency]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const toggleMethod = (method: string) => {
    setForm((f) => {
      const exists = f.paymentMethods.includes(method);
      const next = exists ? f.paymentMethods.filter((m) => m !== method) : [...f.paymentMethods, method];
      return { ...f, paymentMethods: next.length ? next : ["CASH"] };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Le nom de l'activité est requis.");
    if (form.contributionAmount !== "" && Number(form.contributionAmount) < 0) {
      return setError("Le montant de cotisation doit être positif.");
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        type: form.type,
        participation: form.participation,
        contributionAmount: form.contributionAmount === "" ? null : Number(form.contributionAmount),
        contributionUnit: form.contributionUnit,
        contributionFrequency: legacyFrequency(frequency.mode),
        frequencyConfig: frequency,
        distributionMode: isTontine ? form.distributionMode : undefined,
        auctionMinBidPct: isTontine && form.distributionMode === "AUCTION" ? Number(form.auctionMinBidPct) : undefined,
        auctionMinBidders: isTontine && form.distributionMode === "AUCTION" ? Number(form.auctionMinBidders) : undefined,
        partAmount: form.partAmount === "" ? null : Number(form.partAmount),
        maxPartsPerSession: Number(form.maxPartsPerSession) || 1,
        ...(isTontine
          ? {
              beneficiaryAmountPerShare: form.beneficiaryAmountPerShare === "" ? null : Number(form.beneficiaryAmountPerShare),
              minShareFraction: Number(form.minShareFraction) || 1,
              maxSharesPerMember: form.maxSharesPerMember === "" ? null : Number(form.maxSharesPerMember),
              maxBeneficiarySharesPerSession: form.maxBeneficiarySharesPerSession === "" ? null : Number(form.maxBeneficiarySharesPerSession),
              allowPartialShares: form.allowPartialShares,
              allowSameBeneficiaryMultipleShares: form.allowSameBeneficiaryMultipleShares,
              cycleMode: form.cycleMode,
              cycleSessions: form.cycleMode === "FIXED_SESSIONS" ? (form.cycleSessions === "" ? null : Number(form.cycleSessions)) : null,
              cycleStart: form.cycleStart ? new Date(form.cycleStart).toISOString() : null,
              cycleEnd: form.cycleMode === "FIXED_PERIOD" && form.cycleEnd ? new Date(form.cycleEnd).toISOString() : null,
            }
          : {}),
        caisseLoanRate: form.caisseLoanRate === "" ? null : Number(form.caisseLoanRate),
        caisseLoanDuration: form.caisseLoanDuration === "" ? null : Number(form.caisseLoanDuration),
        loanRate1: isLoan ? Number(form.loanRate1) : undefined,
        loanRate2: isLoan ? Number(form.loanRate2) : undefined,
        loanMaxPerMember:
          isLoan && form.loanMaxPerMember !== ""
            ? JSON.stringify({ type: "AMOUNT", value: Number(form.loanMaxPerMember) })
            : undefined,
        loanApprovalMode: isLoan ? form.loanApprovalMode : undefined,
        loanMaxActive: isLoan ? Number(form.loanMaxActive) : undefined,
        penaltyLateAmount: form.penaltyLateAmount === "" ? null : Number(form.penaltyLateAmount),
        penaltyLatePercent: form.penaltyLatePercent === "" ? null : Number(form.penaltyLatePercent),
        penaltyGraceDays: form.penaltyGraceDays === "" ? null : Number(form.penaltyGraceDays),
        maxRetards: form.maxRetards === "" ? null : Number(form.maxRetards),
        paymentMethods: form.paymentMethods,
      };

      const url =
        mode === "edit" && initial?.id
          ? `/api/associations/${associationId}/activities/${initial.id}`
          : `/api/associations/${associationId}/activities`;
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      const id = mode === "edit" ? initial?.id : data?.activity?.id;
      router.push(id ? `/associations/${associationId}/activities/${id}` : `/associations/${associationId}/activities`);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/associations/${associationId}/activities`}
          className="inline-flex items-center gap-2 text-sm font-medium text-graphite hover:text-forest"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux activités
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-ash">
          Module 8 · Moteur de fréquence
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-forest" /> Identité de l&apos;activité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Nom</label>
              <input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Ex : Grande tontine mensuelle"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={(e) => set({ type: e.target.value })} className={inputCls}>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
              placeholder="Règles, objet et modalités de l'activité"
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Participation</label>
              <select
                value={form.participation}
                onChange={(e) => set({ participation: e.target.value })}
                className={inputCls}
              >
                <option value="MANDATORY">Obligatoire (priorité haute)</option>
                <option value="OPTIONAL">Optionnelle</option>
                <option value="CONDITIONAL">Conditionnelle (ancienneté)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Unité de cotisation</label>
              <select
                value={form.contributionUnit}
                onChange={(e) => set({ contributionUnit: e.target.value })}
                className={inputCls}
              >
                <option value="CASH">Espèces / monétaire</option>
                <option value="NATURE">Nature (produits)</option>
                <option value="TIME">Temps / services</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-gold" /> Cotisation et échéances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Montant par session (FCFA)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={form.contributionAmount}
                onChange={(e) => set({ contributionAmount: e.target.value })}
                placeholder="Ex : 25 000"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Système de parts</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={form.partAmount}
                  onChange={(e) => set({ partAmount: e.target.value })}
                  placeholder="Montant d'une part"
                  className={inputCls}
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxPartsPerSession}
                  onChange={(e) => set({ maxPartsPerSession: e.target.value })}
                  title="Nombre maximum de parts"
                  className={`${inputCls} w-24`}
                />
              </div>
              <p className="mt-1 text-xs text-ash">Montant d&apos;une part et nombre max de parts par membre.</p>
            </div>
          </div>

          {isTontine && (
            <div className="rounded-xl border border-stone bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Coins className="h-4 w-4 text-forest" /> Cycle & parts bénéficiaires
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Montant par part bénéficiaire</label>
                  <input type="number" min={0} step={500} value={form.beneficiaryAmountPerShare}
                    onChange={(e) => set({ beneficiaryAmountPerShare: e.target.value })} placeholder="Ex : 550 000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fraction minimale</label>
                  <select value={form.minShareFraction} onChange={(e) => set({ minShareFraction: e.target.value, allowPartialShares: e.target.value !== "1" })} className={inputCls}>
                    <option value="1">Part entière</option>
                    <option value="0.5">Demi-part</option>
                    <option value="0.25">Quart de part</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Parts max par membre</label>
                  <input type="number" min={0} step={0.25} value={form.maxSharesPerMember}
                    onChange={(e) => set({ maxSharesPerMember: e.target.value })} placeholder="Illimité" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Parts bénéficiaires max / session</label>
                  <input type="number" min={1} value={form.maxBeneficiarySharesPerSession}
                    onChange={(e) => set({ maxBeneficiarySharesPerSession: e.target.value })} placeholder="Selon le pot" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mode de cycle</label>
                  <select value={form.cycleMode} onChange={(e) => set({ cycleMode: e.target.value })} className={inputCls}>
                    <option value="FIXED_SESSIONS">Nombre de sessions fixe</option>
                    <option value="FIXED_PERIOD">Période fixe</option>
                    <option value="UNTIL_ALL_BENEFITED">Jusqu&apos;à épuisement des parts</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    {form.cycleMode === "FIXED_SESSIONS" ? "Nombre de sessions" : form.cycleMode === "FIXED_PERIOD" ? "Fin du cycle" : "Fin automatique"}
                  </label>
                  {form.cycleMode === "FIXED_SESSIONS" ? (
                    <input type="number" min={1} value={form.cycleSessions} onChange={(e) => set({ cycleSessions: e.target.value })} placeholder="Ex : 12" className={inputCls} />
                  ) : form.cycleMode === "FIXED_PERIOD" ? (
                    <input type="date" value={form.cycleEnd} onChange={(e) => set({ cycleEnd: e.target.value })} className={inputCls} />
                  ) : (
                    <div className="rounded-xl border border-stone bg-cream/40 px-3 py-2.5 text-xs text-graphite">Clôture dès que toutes les parts ont un bénéficiaire.</div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-graphite">
                  <input type="checkbox" checked={form.allowPartialShares} onChange={(e) => set({ allowPartialShares: e.target.checked })} />
                  Autoriser les fractions de part
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-graphite">
                  <input type="checkbox" checked={form.allowSameBeneficiaryMultipleShares} onChange={(e) => set({ allowSameBeneficiaryMultipleShares: e.target.checked })} />
                  Un bénéficiaire peut recevoir plusieurs parts
                </label>
              </div>
              <p className="mt-2 text-xs text-ash">Le pot de chaque session détermine le nombre de parts distribuables, dans la limite des plafonds.</p>
            </div>
          )}

          <div className="rounded-xl border border-stone bg-cream/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
              <CalendarClock className="h-4 w-4 text-forest" /> Fréquence des sessions
            </div>
            <FrequencyPicker value={frequency} onChange={setFrequency} />
            <div className="mt-4 rounded-xl bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ash">
                  Prochaines sessions
                </span>
                <span className="text-xs font-medium text-forest">{frequencyLabel(frequency)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previewDates.slice(0, 12).map((d, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-forest/5 px-2 py-1 text-xs font-medium text-forest"
                  >
                    {d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Modes de paiement acceptés</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMethod(m.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    form.paymentMethods.includes(m.value)
                      ? "border-forest bg-forest text-white"
                      : "border-stone bg-white text-graphite hover:border-forest/30"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isTontine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-gold" /> Répartition de la cagnotte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Mode d&apos;attribution</label>
              <select
                value={form.distributionMode}
                onChange={(e) => set({ distributionMode: e.target.value })}
                className={inputCls}
              >
                {DISTRIBUTION_MODES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            {form.distributionMode === "AUCTION" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Mise à prix minimum (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.auctionMinBidPct}
                    onChange={(e) => set({ auctionMinBidPct: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Enchérisseurs minimum</label>
                  <input
                    type="number"
                    min={1}
                    value={form.auctionMinBidders}
                    onChange={(e) => set({ auctionMinBidders: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Taux caisse (prêts internes) %</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.caisseLoanRate}
                  onChange={(e) => set({ caisseLoanRate: e.target.value })}
                  placeholder="Ex : 5"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Durée max caisse (mois)</label>
                <input
                  type="number"
                  min={0}
                  value={form.caisseLoanDuration}
                  onChange={(e) => set({ caisseLoanDuration: e.target.value })}
                  placeholder="Ex : 2"
                  className={inputCls}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-forest" /> Règles de prêt
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Taux mois 1 à 3 (%)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.loanRate1}
                onChange={(e) => set({ loanRate1: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Taux au-delà de 3 mois (%)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.loanRate2}
                onChange={(e) => set({ loanRate2: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Plafond par membre (FCFA)</label>
              <input
                type="number"
                min={0}
                step={5000}
                value={form.loanMaxPerMember}
                onChange={(e) => set({ loanMaxPerMember: e.target.value })}
                placeholder="Ex : 200 000"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Validation des demandes</label>
              <select
                value={form.loanApprovalMode}
                onChange={(e) => set({ loanApprovalMode: e.target.value })}
                className={inputCls}
              >
                <option value="BUREAU">Bureau (SG + Trésorier)</option>
                <option value="SECRETARIAT">Secrétariat</option>
                <option value="AUTO">Automatique</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Prêts actifs maximum par membre</label>
              <input
                type="number"
                min={1}
                value={form.loanMaxActive}
                onChange={(e) => set({ loanMaxActive: e.target.value })}
                className={inputCls}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-forest" /> Pénalités de retard
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Pénalité fixe (FCFA)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.penaltyLateAmount}
              onChange={(e) => set({ penaltyLateAmount: e.target.value })}
              placeholder="Ex : 1 000"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Pénalité en pourcentage (%)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.penaltyLatePercent}
              onChange={(e) => set({ penaltyLatePercent: e.target.value })}
              placeholder="Ex : 10"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Délai de grâce (jours)</label>
            <input
              type="number"
              min={0}
              value={form.penaltyGraceDays}
              onChange={(e) => set({ penaltyGraceDays: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Retards avant exclusion</label>
            <input
              type="number"
              min={0}
              value={form.maxRetards}
              onChange={(e) => set({ maxRetards: e.target.value })}
              className={inputCls}
            />
          </div>
        </CardContent>
      </Card>

      {form.contributionAmount && (
        <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-sm text-info">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Cotisation de <strong>{formatCurrency(Number(form.contributionAmount))}</strong> par session,{" "}
            <strong>{frequencyLabel(frequency)}</strong>. Les {previewDates.length} prochaines échéances sont
            générées à partir de la première session.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" loading={saving} className="sm:min-w-56">
          {mode === "edit" ? "Enregistrer les modifications" : "Créer l'activité"}
        </Button>
      </div>
    </form>
  );
}
