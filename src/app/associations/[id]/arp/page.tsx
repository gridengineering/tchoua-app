"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Layers3,
  Loader2,
  Save,
  Send,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ArpProfilePanel } from "@/components/arp/arp-profile-panel";
import { ArpModulesPanel } from "@/components/arp/arp-modules-panel";
import { ArpFundsPanel } from "@/components/arp/arp-funds-panel";
import { ArpVersionsPanel } from "@/components/arp/arp-versions-panel";
import { ArpSimulatorsPanel } from "@/components/arp/arp-simulators-panel";
import { IssueList, ProgressBar, StatusPill } from "@/components/arp/arp-ui";
import { conditionsFor } from "@/lib/arp/catalogue";
import { deriveCapabilities, validateArpConfig } from "@/lib/arp/profile";
import type {
  ArpCapabilities,
  ArpConfig,
  ArpFundPayload,
  ArpProfilePayload,
  ArpValidation,
  ArpValidationContext,
  ArpVersionPayload,
} from "@/lib/arp/types";

type ArpData = {
  profile: ArpProfilePayload;
  config: ArpConfig;
  activeConfig: ArpConfig;
  hasDraft: boolean;
  checks: ArpValidation;
  capabilities: ArpCapabilities;
  context: ArpValidationContext;
  versions: ArpVersionPayload[];
  funds: ArpFundPayload[];
  canEdit: boolean;
  canPublish: boolean;
  myRole: string | null;
  association: { id: string; name: string; status: string; isPublic?: boolean };
};

type TabKey = "profil" | "modules" | "fonds" | "versions" | "outils";

function setByPath<T>(source: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone = structuredClone(source) as Record<string, unknown>;
  let cursor: Record<string, unknown> = clone;
  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];
    const next = cursor[key];
    if (!next || typeof next !== "object") cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return clone as T;
}

export default function ArpPage() {
  const params = useParams<{ id: string }>();
  const associationId = params.id;
  const [data, setData] = useState<ArpData | null>(null);
  const [config, setConfig] = useState<ArpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("profil");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/associations/${associationId}/arp`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Chargement impossible");
      setData(payload as ArpData);
      setConfig((payload as ArpData).config);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reloadFunds = useCallback(async () => {
    const response = await fetch(`/api/associations/${associationId}/arp/funds`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = await response.json();
    setData((current) => (current ? { ...current, funds: payload.funds ?? [] } : current));
  }, [associationId]);

  const update = useCallback(
    (path: string, value: unknown) => {
      setConfig((current) => (current ? setByPath(current, path, value) : current));
      setDirty(true);
      setNotice(null);
    },
    []
  );

  const save = async (publish: boolean) => {
    if (!config) return;
    if (publish) {
      const confirmed = window.confirm(
        "Publier cette configuration ? Une version immuable sera créée et deviendra le cadre actif de l'association."
      );
      if (!confirmed) return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/associations/${associationId}/arp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, publish }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Enregistrement refusé");
        if (payload.details?.errors) {
          setData((current) =>
            current ? { ...current, checks: payload.details as ArpValidation } : current
          );
        }
        return;
      }
      const next = payload as ArpData;
      setData(next);
      setConfig(next.config);
      setDirty(false);
      setNotice(
        publish
          ? `Version v${next.profile.version} publiée. Le cadre actif est à jour.`
          : "Brouillon enregistré. Publiez une version pour l'appliquer aux nouvelles opérations."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const liveChecks = useMemo(() => {
    if (!config) return null;
    const capabilities = deriveCapabilities(config);
    const conditions = conditionsFor(config.dimensions);
    const validation = validateArpConfig(config, data?.context ?? {});
    return { capabilities, conditions, validation };
  }, [config, data?.context]);

  const completeness = liveChecks?.validation.completeness ?? data?.checks.completeness ?? 0;
  const errors = liveChecks?.validation.errors ?? data?.checks.errors ?? [];
  const warnings = liveChecks?.validation.warnings ?? data?.checks.warnings ?? [];
  const statusTone =
    data?.profile.status === "ACTIVE" ? "green" : data?.profile.status === "DRAFT" ? "amber" : "gray";

  const tabs: Array<{ key: TabKey; label: string; icon: typeof Settings2 }> = [
    { key: "profil", label: "Profil", icon: Settings2 },
    { key: "modules", label: "Modules & conditions", icon: Layers3 },
    { key: "fonds", label: "Fonds & réservations", icon: CircleDollarSign },
    { key: "outils", label: "Simulateurs", icon: BookOpen },
    { key: "versions", label: "Versions", icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Cadre ARP">
        <div className="flex items-center justify-center gap-2 p-16 text-sm text-[#8a8378]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement du cadre ARP…
        </div>
      </DashboardLayout>
    );
  }

  if (error && !data) {
    return (
      <DashboardLayout title="Cadre ARP">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f3cdcd] bg-[#fef6f6] p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-[#b91c1c]" />
          <p className="font-semibold text-[#991b1b]">{error}</p>
          <Link
            href={`/associations/${associationId}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d3d28]"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;association
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !config) return null;

  return (
    <DashboardLayout title={`Cadre ARP — ${data.association.name}`}>
      <div className="mx-auto max-w-6xl space-y-4 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/associations/${associationId}?tab=overview`}
            className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0d3d28]"
          >
            <ArrowLeft className="h-4 w-4" /> {data.association.name}
          </Link>
          <Link
            href={`/associations/${associationId}/parametres`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d3d28] hover:underline"
          >
            <Settings2 className="h-3.5 w-3.5" /> Paramètres de l&apos;association
          </Link>
        </div>

        <section className="rounded-2xl border border-[#dfe8df] bg-gradient-to-br from-[#0d3d28] to-[#145238] p-5 text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Association Resource Planning
                </p>
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide">
                  {data.profile.status === "ACTIVE"
                    ? "Cadre actif"
                    : data.profile.status === "DRAFT"
                      ? "Brouillon"
                      : data.profile.status}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9.5px] font-semibold">
                  v{data.profile.version} · {data.profile.origin}
                </span>
              </div>
              <h1 className="mt-1 text-xl font-bold">Cadre de gestion ARP</h1>
              <p className="mt-1 max-w-2xl text-[12px] leading-5 text-white/70">
                36 domaines, 144 invariants et 23 328 combinaisons bornées. Le cadre sépare
                compte, adhésion, contrat, obligation, paiement et affectation. Toute règle
                publiée est versionnée et rejouable.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wide text-white/60">Complétude</p>
                <p className="text-lg font-bold">{completeness}%</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wide text-white/60">Conditions</p>
                <p className="text-lg font-bold">{liveChecks?.conditions.length ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wide text-white/60">Modules</p>
                <p className="text-lg font-bold">
                  {Object.values(liveChecks?.capabilities ?? {}).filter(Boolean).length}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 max-w-md">
            <div className="mb-1 flex justify-between text-[10px] text-white/60">
              <span>Dossier ARP</span>
              <span>{completeness}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#8fd3a8] transition-all"
                style={{ width: `${Math.max(3, completeness)}%` }}
              />
            </div>
          </div>
        </section>

        {!data.canEdit ? (
          <div className="rounded-xl border border-[#f2dfb8] bg-[#fffbf1] px-4 py-3 text-xs text-[#92400e]">
            Consultation seule. Seuls les membres du bureau habilités peuvent modifier le cadre.
          </div>
        ) : null}

        {data.hasDraft ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#cfdffc] bg-[#eef4ff] px-4 py-3">
            <p className="text-xs text-[#1e40af]">
              Un brouillon de configuration n&apos;est pas encore publié. Les opérations en cours
              utilisent la version active v{data.profile.version}.
            </p>
            {data.canPublish ? (
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving}
                className="rounded-lg bg-[#1e40af] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                Publier le brouillon
              </button>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-[#f3cdcd] bg-[#fef6f6] px-4 py-3 text-xs text-[#991b1b]">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#cce8d4] bg-[#f7fcf8] px-4 py-3 text-xs text-[#166534]">
            <CheckCircle2 className="h-4 w-4" /> {notice}
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-2">
            {errors.length > 0 ? (
              <IssueList issues={errors} tone="error" title={`${errors.length} contrôle(s) bloquant(s)`} />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-[#cce8d4] bg-[#f7fcf8] px-3.5 py-2.5 text-[11.5px] text-[#166534]">
                <CheckCircle2 className="h-4 w-4" />
                Aucun contrôle bloquant sur la configuration courante.
              </div>
            )}
            {warnings.length > 0 ? (
              <IssueList issues={warnings} tone="warning" title={`${warnings.length} avertissement(s)`} />
            ) : null}
          </div>
          <div className="rounded-xl border border-[#e8e2d8] bg-[#fffdf9] px-4 py-3">
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              <span>Complétude du dossier</span>
              <span className="font-bold text-[#0d3d28]">{completeness}%</span>
            </div>
            <div className="mt-1.5">
              <ProgressBar value={completeness} />
            </div>
            <p className="mt-2 text-[10.5px] leading-4 text-[#8a8378]">
              {data.profile.status === "ACTIVE"
                ? `Version active depuis le ${
                    data.profile.effectiveAt
                      ? new Date(data.profile.effectiveAt).toLocaleDateString("fr-FR")
                      : "—"
                  }.`
                : "Le cadre doit être publié avant toute nouvelle souscription financière."}
            </p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11.5px] font-semibold transition ${
                tab === key
                  ? "bg-white text-[#0d3d28] shadow-sm"
                  : "text-[#7a7368] hover:bg-white/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === "profil" ? (
          <ArpProfilePanel config={config} canEdit={data.canEdit} update={update} />
        ) : null}
        {tab === "modules" ? (
          <ArpModulesPanel config={config} canEdit={data.canEdit} update={update} />
        ) : null}
        {tab === "fonds" ? (
          <ArpFundsPanel
            associationId={associationId}
            funds={data.funds}
            canEdit={data.canEdit}
            reload={reloadFunds}
          />
        ) : null}
        {tab === "outils" ? <ArpSimulatorsPanel config={config} /> : null}
        {tab === "versions" ? <ArpVersionsPanel versions={data.versions} /> : null}

        {data.canEdit ? (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e2ddd4] bg-[#fffdf9]/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-[#7a7368]">
                {dirty
                  ? "Modifications non enregistrées."
                  : data.hasDraft
                    ? "Brouillon enregistré, non publié."
                    : "Configuration à jour."}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={() => save(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd6c8] bg-white px-3 py-2 text-xs font-semibold text-[#57534e] disabled:opacity-50"
                >
                  {saving && !dirty ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Enregistrer le brouillon
                </button>
                {data.canPublish ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3d28] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0a2f1f] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Publier la version
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-2 text-[10.5px] text-[#a8a093]">
          <StatusPill tone={statusTone}>ARP {data.profile.status}</StatusPill>
          <span>
            Référentiel Tchoua ARP du 13 novembre 2026 · 36 domaines · 144 invariants · 23 328
            combinaisons
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
}
