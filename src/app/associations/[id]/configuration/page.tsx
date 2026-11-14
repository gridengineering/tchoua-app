"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Coins,
  Layers,
  Loader2,
  Plus,
  Settings2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  ActivityForm,
  type ActivityInitial,
} from "@/components/associations/activities/ActivityForm";
import { IssueList, StatusPill } from "@/components/arp/arp-ui";
import { conditionsFor } from "@/lib/arp/catalogue";
import { normalizeArpConfig, validateArpConfig } from "@/lib/arp/profile";
import type { ArpConfig, ArpValidation } from "@/lib/arp/types";

const MANAGE_ROLES = ["FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"];

type AssociationInfo = {
  id: string;
  name: string;
  type: string;
  membershipConfig?: string | null;
  meetingConfig?: string | null;
  minKycLevel?: number | null;
  requireRegulationApproval?: boolean | null;
};
type Activity = ActivityInitial & {
  id: string;
  name: string;
  type: string;
  status?: string;
  contributionAmount?: number | null;
};

type CategoryKey =
  | "tontines"
  | "prets"
  | "epargne"
  | "cotisations"
  | "solidarite"
  | "nature"
  | "investissement"
  | "autres"
  | "reunions";

const CATEGORIES: Array<{ key: CategoryKey; label: string; types?: string[] }> = [
  { key: "tontines", label: "Tontines", types: ["TONTINE_ROTATIVE", "TONTINE_ASCA", "TONTINE_ENCHERES"] },
  { key: "prets", label: "Prêts", types: ["PRET"] },
  { key: "epargne", label: "Épargne", types: ["EPARGNE"] },
  { key: "cotisations", label: "Cotisations" },
  { key: "solidarite", label: "Solidarité", types: ["AIDE_SOLIDAIRE"] },
  { key: "nature", label: "Nature", types: ["NATURE"] },
  { key: "investissement", label: "Investissement", types: ["INVESTISSEMENT"] },
  { key: "autres", label: "Achats & collectes", types: ["ACHATS_GROUPES", "COLLECTION"] },
  { key: "reunions", label: "Réunions & collation" },
];

const inputCls =
  "w-full rounded-lg border border-[#e2ddd4] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10";
const labelCls = "mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export default function AssociationConfigurationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const [association, setAssociation] = useState<AssociationInfo | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [arp, setArp] = useState<ArpConfig | null>(null);
  const [arpChecks, setArpChecks] = useState<ArpValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryKey>("tontines");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const isPrincipalAdmin = session?.user?.email?.toLowerCase() === "admin@tchoua.com";
  const canManage = isPrincipalAdmin || (myRole ? MANAGE_ROLES.includes(myRole) : false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [associationResponse, activitiesResponse, arpResponse] = await Promise.all([
        fetch(`/api/associations/${id}`, { cache: "no-store" }),
        fetch(`/api/associations/${id}/activities`, { cache: "no-store" }),
        fetch(`/api/associations/${id}/arp`, { cache: "no-store" }),
      ]);
      const associationPayload = await associationResponse.json();
      const activitiesPayload = await activitiesResponse.json();
      const arpPayload = await arpResponse.json();
      if (!associationResponse.ok) throw new Error(associationPayload.error ?? "Association introuvable");
      if (!activitiesResponse.ok) throw new Error(activitiesPayload.error ?? "Activités indisponibles");
      if (!arpResponse.ok) throw new Error(arpPayload.error ?? "Cadre ARP indisponible");
      setAssociation(associationPayload.association);
      setMyRole(associationPayload.myRole);
      setActivities(activitiesPayload.activities ?? []);
      const requestedActivity = new URLSearchParams(window.location.search).get("activity");
      if (requestedActivity) setSelectedId(requestedActivity);
      setArp(normalizeArpConfig(arpPayload.config));
      setArpChecks(arpPayload.checks ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const reloadActivities = useCallback(async () => {
    const response = await fetch(`/api/associations/${id}/activities`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setActivities(payload.activities ?? []);
  }, [id]);

  const filtered = useMemo(() => {
    const definition = CATEGORIES.find((item) => item.key === category);
    if (!definition?.types) return [];
    return activities.filter((activity) => definition.types?.includes(activity.type));
  }, [activities, category]);

  const selected = activities.find((activity) => activity.id === selectedId) ?? null;
  const showForm = creating || Boolean(selected);
  const arpConditions = arp ? conditionsFor(arp.dimensions) : [];

  if (loading || sessionStatus === "loading") {
    return (
      <DashboardLayout title="Configuration de l'association">
        <div className="flex items-center justify-center gap-2 p-16 text-sm text-[#8a8378]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la configuration…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !association || !arp) {
    return (
      <DashboardLayout title="Configuration de l'association">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f3cdcd] bg-[#fef6f6] p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-[#b91c1c]" />
          <p className="font-semibold text-[#991b1b]">{error ?? "Configuration indisponible"}</p>
          <Link href={`/associations/${id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d3d28]">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!canManage) {
    return (
      <DashboardLayout title={`Configuration — ${association.name}`}>
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f2dfb8] bg-[#fffbf1] p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-[#b45309]" />
          <p className="font-semibold text-[#92400e]">Modification réservée au bureau</p>
          <p className="mt-1 text-sm text-[#7a7368]">
            Seuls les membres du bureau habilités (président, fondateur, vice-président,
            secrétaire, trésorier) ou l&apos;administrateur principal peuvent modifier les paramètres des activités. Votre rôle : {myRole ?? "aucun"}.
          </p>
          <Link href={`/associations/${id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d3d28]">
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;association
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Configuration — ${association.name}`}>
      <div className="mx-auto max-w-6xl space-y-4 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/associations/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0d3d28]">
            <ArrowLeft className="h-4 w-4" /> {association.name}
          </Link>
          <Link href={`/associations/${id}/arp`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0d5] bg-[#f6fbf7] px-3 py-2 text-xs font-semibold text-[#0d3d28]">
            <ShieldCheck className="h-3.5 w-3.5" /> Cadre ARP
          </Link>
        </div>

        <section className="rounded-2xl border border-[#dfe8df] bg-gradient-to-br from-[#0d3d28] to-[#145238] p-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Paramétrage individuel des activités</p>
          <h1 className="mt-1 text-xl font-bold">Configuration de {association.name}</h1>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-white/70">
            Chaque activité garde ses propres options : tontine, prêt, épargne, cotisation,
            solidarité, nature, investissement, achats ou collation. Les modifications sont
            réservées au bureau et s&apos;appliquent aux nouvelles opérations.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(arp.dimensions).map(([key, value]) => (
              <span key={key} className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9.5px] font-medium">
                {key} : {String(value)}
              </span>
            ))}
            {arpConditions.length ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9.5px] font-semibold">
                {arpConditions.join(" · ")}
              </span>
            ) : null}
          </div>
        </section>

        {error ? <div className="rounded-xl border border-[#f3cdcd] bg-[#fef6f6] px-4 py-3 text-xs text-[#991b1b]">{error}</div> : null}
        {notice ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#cce8d4] bg-[#f7fcf8] px-4 py-3 text-xs text-[#166534]">
            <CheckCircle2 className="h-4 w-4" /> {notice}
          </div>
        ) : null}
        {arpChecks && arpChecks.errors.length > 0 ? (
          <IssueList issues={arpChecks.errors} tone="error" title="Cadre ARP : contrôles à compléter" />
        ) : null}

        <div className="flex flex-wrap gap-1 rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] p-1">
          {CATEGORIES.map((item) => {
            const count = item.types ? activities.filter((activity) => item.types?.includes(activity.type)).length : 0;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setCategory(item.key);
                  setSelectedId(null);
                  setCreating(false);
                  setFormKey((value) => value + 1);
                }}
                className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11.5px] font-semibold transition ${
                  category === item.key ? "bg-white text-[#0d3d28] shadow-sm" : "text-[#7a7368] hover:bg-white/60"
                }`}
              >
                {item.label}
                {count > 0 ? <span className="rounded-full bg-[#eef4ff] px-1.5 py-0.5 text-[9px] font-bold text-[#1e40af]">{count}</span> : null}
              </button>
            );
          })}
        </div>

        {category === "cotisations" ? (
          <ContributionRulesPanel
            associationId={id}
            association={association}
            arp={arp}
            onSaved={(next, membership) => {
              setArp(next);
              setAssociation((current) =>
                current ? { ...current, membershipConfig: JSON.stringify(membership) } : current
              );
              setNotice("Règles de cotisation enregistrées. Elles s'appliquent aux prochains appels.");
            }}
          />
        ) : null}

        {category === "reunions" ? (
          <MeetingRulesPanel
            associationId={id}
            association={association}
            onSaved={(meeting) => {
              setAssociation((current) =>
                current ? { ...current, meetingConfig: JSON.stringify(meeting) } : current
              );
              setNotice("Paramètres de réunion et de collation enregistrés.");
            }}
          />
        ) : null}

        {category !== "cotisations" && category !== "reunions" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11.5px] text-[#7a7368]">
                {filtered.length} activité(s) dans cette famille. Sélectionnez-en une pour modifier ses options.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setCreating(true);
                  setFormKey((value) => value + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3d28] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Nouvelle activité
              </button>
            </div>

            {filtered.length === 0 && !creating ? (
              <div className="rounded-2xl border border-dashed border-[#ddd6c8] bg-[#fbf9f3] p-6 text-center">
                <Layers className="mx-auto mb-2 h-6 w-6 text-[#a8a093]" />
                <p className="text-sm font-semibold text-[#3f3a33]">Aucune activité dans cette famille</p>
                <p className="mt-1 text-[11.5px] text-[#8a8378]">Créez-en une ou choisissez une autre catégorie.</p>
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(activity.id);
                      setCreating(false);
                      setFormKey((value) => value + 1);
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      selectedId === activity.id
                        ? "border-[#0d3d28] bg-[#f6fbf7] ring-2 ring-[#0d3d28]/10"
                        : "border-[#e8e2d8] bg-white hover:border-[#0d3d28]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1f2937]">{activity.name}</p>
                        <p className="text-[10px] text-[#8a8378]">{activity.type}</p>
                      </div>
                      <StatusPill tone={activity.status === "CLOSED" ? "gray" : activity.status === "PAUSED" ? "amber" : "green"}>
                        {activity.status ?? "ACTIVE"}
                      </StatusPill>
                    </div>
                    {activity.contributionAmount ? (
                      <p className="mt-2 text-[11px] font-semibold text-[#0d3d28]">
                        {Number(activity.contributionAmount).toLocaleString("fr-FR")} FCFA / session
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10.5px] font-semibold text-[#1e40af]">Configurer →</p>
                  </button>
                ))}
              </div>
            )}

            {showForm ? (
              <div className="rounded-2xl border border-[#dfe8df] bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#efe9dd] pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#1a1a1a]">
                      {creating ? "Nouvelle activité" : selected?.name}
                    </h2>
                    <p className="text-[10.5px] text-[#8a8378]">
                      {creating ? "Choisissez le type et les paramètres ARP." : `${selected?.type} · ${selected?.status ?? "ACTIVE"}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(null);
                    }}
                    className="rounded-lg border border-[#ddd6c8] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#57534e]"
                  >
                    Fermer
                  </button>
                </div>
                <ActivityForm
                  key={`${selectedId ?? "new"}-${formKey}`}
                  associationId={id}
                  mode={creating ? "create" : "edit"}
                  initial={creating ? null : selected}
                  embedded
                  onSaved={async (savedId) => {
                    await reloadActivities();
                    setCreating(false);
                    setSelectedId(savedId ?? null);
                    setNotice("Activité enregistrée. Les nouvelles règles s'appliquent aux prochaines opérations.");
                  }}
                  onCancel={() => {
                    setCreating(false);
                    setSelectedId(null);
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function ContributionRulesPanel({
  associationId,
  association,
  arp,
  onSaved,
}: {
  associationId: string;
  association: AssociationInfo;
  arp: ArpConfig;
  onSaved: (arp: ArpConfig, membership: unknown) => void;
}) {
  const [membership, setMembership] = useState(() =>
    parseJson(association.membershipConfig, {
      ageMin: "",
      sponsorshipRequired: false,
      sponsorshipCount: 1,
      admissionFee: "",
      approvalProcess: "MAJORITY",
      waitingPeriod: "",
    })
  );
  const [draft, setDraft] = useState<ArpConfig>(arp);
  const [minKycLevel, setMinKycLevel] = useState(association.minKycLevel ?? 0);
  const [requireRegulation, setRequireRegulation] = useState(association.requireRegulationApproval ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setArp = (path: string, value: unknown) => {
    setDraft((current) => {
      const keys = path.split(".");
      const clone = structuredClone(current) as Record<string, unknown>;
      let cursor: Record<string, unknown> = clone;
      for (let index = 0; index < keys.length - 1; index++) {
        const key = keys[index];
        if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
        cursor = cursor[key] as Record<string, unknown>;
      }
      cursor[keys[keys.length - 1]] = value;
      return clone as ArpConfig;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const core = await fetch(`/api/associations/${associationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipConfig: membership,
          minKycLevel,
          requireRegulationApproval: requireRegulation,
        }),
      });
      const coreData = await core.json().catch(() => ({}));
      if (!core.ok) throw new Error(coreData.error ?? "Enregistrement impossible");
      const arpResponse = await fetch(`/api/associations/${associationId}/arp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: draft, publish: false }),
      });
      const arpData = await arpResponse.json().catch(() => ({}));
      if (!arpResponse.ok) throw new Error(arpData.error ?? "Cadre ARP refusé");
      onSaved(arpData.config ?? draft, membership);
      setMessage("Règles de cotisation enregistrées.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#e8e2d8] bg-[#fffdf9] p-5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d3d28]/8 text-[#0d3d28]"><Coins className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-bold text-[#1a1a1a]">Règles de cotisation et d&apos;adhésion</h2>
            <p className="mt-0.5 text-[11.5px] leading-4 text-[#7a7368]">
              L&apos;assiette, le droit d&apos;entrée et les conditions d&apos;admission sont propres à
              l&apos;association. Les appels restent des créances distinctes des paiements.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className={labelCls}>Assiette des cotisations</span>
            <select value={draft.dimensions.cotisation} onChange={(e) => setArp("dimensions.cotisation", e.target.value)} className={inputCls}>
              <option value="fixe">Montant fixe</option>
              <option value="parts">Parts</option>
              <option value="nature">Nature / produits</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Droit d&apos;entrée (FCFA)</span>
            <input value={membership.admissionFee} onChange={(e) => setMembership({ ...membership, admissionFee: e.target.value })} type="number" min={0} step={500} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Âge minimum</span>
            <input value={membership.ageMin} onChange={(e) => setMembership({ ...membership, ageMin: e.target.value })} type="number" min={0} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Mode d&apos;admission</span>
            <select value={membership.approvalProcess} onChange={(e) => setMembership({ ...membership, approvalProcess: e.target.value })} className={inputCls}>
              <option value="UNANIMITY">Unanimité</option>
              <option value="MAJORITY">Majorité</option>
              <option value="AUTO">Automatique</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Parrains requis</span>
            <input value={membership.sponsorshipCount} onChange={(e) => setMembership({ ...membership, sponsorshipCount: Number(e.target.value) })} type="number" min={0} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Délai d&apos;attente</span>
            <input value={membership.waitingPeriod} onChange={(e) => setMembership({ ...membership, waitingPeriod: e.target.value })} placeholder="Ex : 3 mois" className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Unité de plafond familial</span>
            <select value={draft.membership.familyCapUnit} onChange={(e) => setArp("membership.familyCapUnit", e.target.value)} className={inputCls}>
              <option value="MEMBRE">Par membre</option>
              <option value="MENAGE">Par ménage</option>
              <option value="AYANT_DROIT">Par ayant droit</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className={labelCls}>Définition du ménage / ayant droit</span>
            <input value={draft.membership.householdDefinition} onChange={(e) => setArp("membership.householdDefinition", e.target.value)} placeholder="Conjoint, enfants à charge, résidence…" className={inputCls} />
          </label>
        </div>

        {draft.dimensions.cotisation === "nature" ? (
          <div className="mt-4 rounded-xl border border-[#f2dfb8] bg-[#fffbf1] p-3">
            <p className="mb-2 text-[11px] font-bold text-[#92400e]">Condition C01 · cotisation en nature</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Valorisation</span>
                <input value={draft.prerequisites.natureValuation} onChange={(e) => setArp("prerequisites.natureValuation", e.target.value)} placeholder="Prix de marché, barème, expertise…" className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Règle de liquidité</span>
                <input value={draft.prerequisites.natureSaleLiquidity} onChange={(e) => setArp("prerequisites.natureSaleLiquidity", e.target.value)} placeholder="Vente préalable ou financement autorisé…" className={inputCls} />
              </label>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-[#e2ddd4] bg-[#fbf9f3] p-3.5">
          <div className="flex items-start gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d3d28]/8 text-[#0d3d28]"><ShieldCheck className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-bold text-[#1f2937]">Conformité & contrôle d&apos;accès</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#7a7368]">
                Le KYC suit une approche par risque (principes GAFI) : l&apos;association peut exiger un niveau minimal
                avant toute participation à une activité ou opération financière.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Niveau KYC minimal des membres</span>
              <select value={minKycLevel} onChange={(e) => setMinKycLevel(Number(e.target.value))} className={inputCls}>
                <option value={0}>Aucun niveau imposé</option>
                <option value={1}>KYC 1 — Identité déclarée</option>
                <option value={2}>KYC 2 — Identité vérifiée</option>
                <option value={3}>KYC 3 — Vigilance renforcée</option>
              </select>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-[#e2ddd4] bg-white px-3 py-2.5">
              <input type="checkbox" checked={requireRegulation} onChange={(e) => setRequireRegulation(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0d3d28]" />
              <span className="text-[11.5px] leading-4 text-[#3f3a33]">
                Exiger l&apos;approbation des statuts et du règlement intérieur avant toute activité
              </span>
            </label>
          </div>
          <p className="mt-2 text-[10.5px] text-[#8a8175]">
            Les seuils indicatifs par montant restent appliqués : KYC 2 au-delà de 500 000 FCFA, KYC 3 au-delà de 5 000 000 FCFA.
          </p>
        </div>

        {error ? <p className="mt-3 rounded-lg border border-[#f3cdcd] bg-[#fef6f6] px-3 py-2 text-[11.5px] text-[#991b1b]">{error}</p> : null}
        {message ? <p className="mt-3 rounded-lg border border-[#cce8d4] bg-[#f7fcf8] px-3 py-2 text-[11.5px] text-[#166534]">{message}</p> : null}
        <div className="mt-4">
          <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[#0d3d28] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {saving ? "Enregistrement…" : "Enregistrer les règles de cotisation"}
          </button>
        </div>
      </section>
    </div>
  );
}

function MeetingRulesPanel({
  associationId,
  association,
  onSaved,
}: {
  associationId: string;
  association: AssociationInfo;
  onSaved: (meeting: unknown) => void;
}) {
  const [meeting, setMeeting] = useState(() =>
    parseJson(association.meetingConfig, {
      frequency: "MONTHLY",
      dayOfWeek: 6,
      hour: 15,
      quorumPercent: 60,
      collationRate: 3000,
      collationHostPayout: 150000,
    })
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/associations/${associationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingConfig: meeting }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Enregistrement impossible");
      setMessage("Paramètres enregistrés.");
      onSaved(meeting);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e8e2d8] bg-[#fffdf9] p-5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d3d28]/8 text-[#0d3d28]"><CalendarClock className="h-4 w-4" /></span>
        <div>
          <h2 className="text-sm font-bold text-[#1a1a1a]">Réunions et collation</h2>
          <p className="mt-0.5 text-[11.5px] leading-4 text-[#7a7368]">
            La réunion et la session financière sont deux objets distincts. Une réunion peut
            couvrir plusieurs activités ; une activité peut fonctionner sans réunion physique.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className={labelCls}>Fréquence</span>
          <select value={meeting.frequency} onChange={(e) => setMeeting({ ...meeting, frequency: e.target.value })} className={inputCls}>
            <option value="MONTHLY">Mensuelle</option>
            <option value="QUARTERLY">Trimestrielle</option>
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Jour</span>
          <select value={String(meeting.dayOfWeek)} onChange={(e) => setMeeting({ ...meeting, dayOfWeek: Number(e.target.value) })} className={inputCls}>
            {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day, index) => (
              <option key={index} value={index}>{day}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Heure</span>
          <input type="number" min={0} max={23} value={meeting.hour} onChange={(e) => setMeeting({ ...meeting, hour: Number(e.target.value) })} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Quorum (%)</span>
          <input type="number" min={0} max={100} value={meeting.quorumPercent} onChange={(e) => setMeeting({ ...meeting, quorumPercent: Number(e.target.value) })} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Collation par membre (FCFA)</span>
          <input type="number" min={0} step={500} value={meeting.collationRate} onChange={(e) => setMeeting({ ...meeting, collationRate: Number(e.target.value) })} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Forfait hôte (FCFA)</span>
          <input type="number" min={0} step={5000} value={meeting.collationHostPayout} onChange={(e) => setMeeting({ ...meeting, collationHostPayout: Number(e.target.value) })} className={inputCls} />
        </label>
      </div>
      {error ? <p className="mt-3 rounded-lg border border-[#f3cdcd] bg-[#fef6f6] px-3 py-2 text-[11.5px] text-[#991b1b]">{error}</p> : null}
      {message ? <p className="mt-3 rounded-lg border border-[#cce8d4] bg-[#f7fcf8] px-3 py-2 text-[11.5px] text-[#166534]">{message}</p> : null}
      <div className="mt-4">
        <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-[#0d3d28] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
      </div>
    </section>
  );
}
