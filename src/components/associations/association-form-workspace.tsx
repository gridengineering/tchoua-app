"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Coins,
  FileText,
  Gauge,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ArpModulesPanel } from "@/components/arp/arp-modules-panel";
import { IssueList, ProgressBar, StatusPill } from "@/components/arp/arp-ui";
import { FrequencyPicker } from "@/components/ui/frequency-picker";
import { FrequencyConfigV2, frequencyLabel, getNextSessions } from "@/lib/frequency";
import {
  defaultArpConfig,
  deriveCapabilities,
  validateArpConfig,
} from "@/lib/arp/profile";
import { conditionsFor } from "@/lib/arp/catalogue";
import type { ArpConfig } from "@/lib/arp/types";

type Regulation = { title: string; content: string };
type ActivitySummary = {
  id: string;
  name: string;
  type: string;
  status?: string;
  contributionAmount?: number | null;
};

export type AssociationFormInitial = {
  id?: string;
  name?: string;
  description?: string | null;
  type?: string;
  color?: string;
  logo?: string | null;
  region?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  parentId?: string | null;
  parentSubscriptionFee?: number | null;
  isPublic?: boolean;
  meetingConfig?: string | null;
  membershipConfig?: string | null;
  socialAidCaps?: string | null;
  sanctionsConfig?: string | null;
  bankConfig?: string | null;
  regulations?: Array<{ id?: string; title?: string | null; content: string }>;
  activities?: ActivitySummary[];
  arpConfig?: ArpConfig;
};

type MeetingConfig = {
  frequency: "MONTHLY" | "QUARTERLY";
  dayOfWeek: number;
  hour: number;
  quorumPercent: number;
  collationRate: number;
  collationHostPayout: number;
};
type MembershipConfig = {
  ageMin: string;
  sponsorshipRequired: boolean;
  sponsorshipCount: number;
  admissionFee: string;
  approvalProcess: "UNANIMITY" | "MAJORITY" | "AUTO";
  waitingPeriod: string;
};
type SocialAidCaps = {
  illness_member: string;
  illness_spouse: string;
  death_member: string;
  death_spouse: string;
  death_child_under5: string;
  death_child_over5: string;
  death_parent: string;
  marriage: string;
  birth: string;
  birth_twins: string;
};
type SanctionsConfig = {
  late: number;
  absent1: number;
  absent2: number;
  absent3: number;
  indiscipline: number;
  missedCommission: number;
  agNationale: number;
};
type BankConfig = { bankName: string; rib: string; accountHolder: string; paymentMode: string };
type ModuleSelection = {
  tontine: boolean;
  epargne: boolean;
  prets: boolean;
  solidarite: boolean;
  investissement: boolean;
  nature: boolean;
  achats: boolean;
  collation: boolean;
};
type TontineDraft = {
  contributionAmount: string;
  distributionMode: string;
  auctionMinBidPct: string;
  auctionMinBidders: string;
  partAmount: string;
  beneficiaryAmountPerShare: string;
  minShareFraction: string;
  cycleMode: string;
  cycleSessions: string;
};
type TabKey =
  | "identite"
  | "contacts"
  | "arp"
  | "activites"
  | "reunions"
  | "finances"
  | "reglement"
  | "recap";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const inputCls =
  "w-full rounded-lg border border-[#e2ddd4] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10 disabled:bg-[#f6f3ec] disabled:text-[#9ca3af]";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]";

const DEFAULT_MEETING: MeetingConfig = {
  frequency: "MONTHLY",
  dayOfWeek: 6,
  hour: 15,
  quorumPercent: 60,
  collationRate: 3000,
  collationHostPayout: 150000,
};
const DEFAULT_MEMBERSHIP: MembershipConfig = {
  ageMin: "",
  sponsorshipRequired: false,
  sponsorshipCount: 1,
  admissionFee: "",
  approvalProcess: "MAJORITY",
  waitingPeriod: "",
};
const DEFAULT_AIDS: SocialAidCaps = {
  illness_member: "",
  illness_spouse: "",
  death_member: "",
  death_spouse: "",
  death_child_under5: "",
  death_child_over5: "",
  death_parent: "",
  marriage: "",
  birth: "",
  birth_twins: "",
};
const DEFAULT_SANCTIONS: SanctionsConfig = {
  late: 500,
  absent1: 1000,
  absent2: 3000,
  absent3: 5000,
  indiscipline: 3000,
  missedCommission: 5000,
  agNationale: 20000,
};
const DEFAULT_BANK: BankConfig = { bankName: "", rib: "", accountHolder: "", paymentMode: "VIREMENT" };
const DEFAULT_MODULES: ModuleSelection = {
  tontine: true,
  epargne: false,
  prets: false,
  solidarite: true,
  investissement: false,
  nature: false,
  achats: false,
  collation: false,
};
const DEFAULT_TONTINE: TontineDraft = {
  contributionAmount: "25000",
  distributionMode: "ROTATION",
  auctionMinBidPct: "5",
  auctionMinBidders: "2",
  partAmount: "",
  beneficiaryAmountPerShare: "550000",
  minShareFraction: "1",
  cycleMode: "FIXED_SESSIONS",
  cycleSessions: "12",
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function setByPath<T>(source: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone = structuredClone(source) as Record<string, unknown>;
  let cursor: Record<string, unknown> = clone;
  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return clone as T;
}

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[10.5px] leading-4 text-[#8a8378]">{hint}</span> : null}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text", hint, className }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string; className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </Field>
  );
}

function NumberInput({ label, value, onChange, hint, min, max, step, className }: {
  label: string; value: string | number; onChange: (v: string) => void; hint?: string; min?: number; max?: number; step?: number; className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} min={min} max={max} step={step} className={inputCls} />
    </Field>
  );
}

function SelectInput({ label, value, onChange, options, hint, className }: {
  label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; hint?: string; className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
}

function Section({ title, description, icon, children }: { title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e8e2d8] bg-[#fffdf9]">
      <div className="flex items-start gap-2.5 border-b border-[#efe9dd] px-5 py-3.5">
        {icon ? <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d3d28]/8 text-[#0d3d28]">{icon}</span> : null}
        <div>
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">{title}</h3>
          {description ? <p className="mt-0.5 text-[11.5px] leading-4 text-[#7a7368]">{description}</p> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const MODULE_DEFS: Array<{
  key: keyof ModuleSelection;
  title: string;
  description: string;
  type: string;
}> = [
  { key: "tontine", title: "Tontine", description: "Cotisations, droits, attribution et cycle.", type: "TONTINE_ROTATIVE" },
  { key: "epargne", title: "Épargne", description: "Dépôts, retraits, blocages et intérêts.", type: "EPARGNE" },
  { key: "prets", title: "Prêts", description: "Demandes, plafonds, échéanciers et recouvrement.", type: "PRET" },
  { key: "solidarite", title: "Solidarité", description: "Aides maladie, décès, naissance et secours.", type: "AIDE_SOLIDAIRE" },
  { key: "investissement", title: "Investissement", description: "Capital, projets, revenus et dividendes.", type: "INVESTISSEMENT" },
  { key: "nature", title: "Nature", description: "Cotisations en produits, stocks et valorisation.", type: "NATURE" },
  { key: "achats", title: "Achats groupés", description: "Commandes, réception et répartition.", type: "ACHATS_GROUPES" },
  { key: "collation", title: "Collation", description: "Contribution par séance et forfait hôte.", type: "COLLECTION" },
];

export function AssociationFormWorkspace({
  mode,
  associationId,
  initial,
}: {
  mode: "create" | "edit";
  associationId?: string;
  initial?: AssociationFormInitial | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("identite");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [parents, setParents] = useState<Array<{ id: string; name: string }>>([]);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "TONTINE_CLUB",
    color: initial?.color ?? "#165E39",
    logo: initial?.logo ?? "",
    region: initial?.region ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    website: initial?.website ?? "",
    parentId: initial?.parentId ?? "",
    parentSubscriptionFee: initial?.parentSubscriptionFee != null ? String(initial.parentSubscriptionFee) : "",
    isPublic: initial?.isPublic ?? false,
  });

  const [arp, setArp] = useState<ArpConfig>(() =>
    initial?.arpConfig ??
    defaultArpConfig({ type: initial?.type ?? "TONTINE_CLUB", parentId: initial?.parentId ?? null })
  );
  const [meeting, setMeeting] = useState<MeetingConfig>(() => parseJson(initial?.meetingConfig, DEFAULT_MEETING));
  const [membership, setMembership] = useState<MembershipConfig>(() => parseJson(initial?.membershipConfig, DEFAULT_MEMBERSHIP));
  const [socialAids, setSocialAids] = useState<SocialAidCaps>(() => parseJson(initial?.socialAidCaps, DEFAULT_AIDS));
  const [sanctions, setSanctions] = useState<SanctionsConfig>(() => parseJson(initial?.sanctionsConfig, DEFAULT_SANCTIONS));
  const [bank, setBank] = useState<BankConfig>(() => parseJson(initial?.bankConfig, DEFAULT_BANK));
  const [regulations, setRegulations] = useState<Regulation[]>(() => {
    if (initial?.regulations) {
      return initial.regulations.map((item) => ({ title: item.title ?? "", content: item.content }));
    }
    if (mode === "edit") return [];
    return [
      { title: "Article 1 : Adhésion", content: "Tout membre s'engage à respecter le présent règlement intérieur et à s'acquitter de ses cotisations." },
      { title: "Article 2 : Cotisations", content: "Les cotisations sont dues à chaque session. Tout retard entraîne une pénalité conformément aux barèmes de l'association." },
      { title: "Article 3 : Discipline", content: "Les absences non justifiées, retards et manquements sont sanctionnés par le bureau selon les montants fixés en assemblée." },
    ];
  });

  const [modules, setModules] = useState<ModuleSelection>(() => ({
    tontine: arp.modules.tontine,
    epargne: arp.modules.savings,
    prets: arp.modules.credit,
    solidarite: arp.modules.socialAid,
    investissement: arp.modules.investment,
    nature: arp.modules.nature,
    achats: arp.modules.stocks,
    collation: arp.modules.collation,
  }));
  const [tontine, setTontine] = useState<TontineDraft>(DEFAULT_TONTINE);
  const [frequency, setFrequency] = useState<FrequencyConfigV2>({
    mode: "MONTHLY",
    every: 1,
    rule: { kind: "FIXED_DAY", day: 1 },
  });

  useEffect(() => {
    fetch("/api/associations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.associations) {
          setParents(
            data.associations
              .filter((association: { id: string }) => association.id !== associationId)
              .map((association: { id: string; name: string }) => ({ id: association.id, name: association.name }))
          );
        }
      })
      .catch(() => {});
  }, [associationId]);

  const updateArp = (path: string, value: unknown) => {
    setArp((current) => setByPath(current, path, value));
    if (path.startsWith("modules.")) {
      const key = path.slice("modules.".length) as keyof ModuleSelection;
      const map: Record<string, keyof ModuleSelection> = {
        tontine: "tontine",
        savings: "epargne",
        credit: "prets",
        socialAid: "solidarite",
        nature: "nature",
        investment: "investissement",
        stocks: "achats",
        collation: "collation",
      };
      if (map[key]) setModules((current) => ({ ...current, [map[key]]: Boolean(value) }));
    }
    setNotice(null);
  };

  const toggleModule = (key: keyof ModuleSelection) => {
    const next = !modules[key];
    setModules((current) => ({ ...current, [key]: next }));
    const arpModule: Record<keyof ModuleSelection, string> = {
      tontine: "tontine",
      epargne: "savings",
      prets: "credit",
      solidarite: "socialAid",
      nature: "nature",
      investissement: "investment",
      achats: "stocks",
      collation: "collation",
    };
    setArp((current) => {
      let nextArp = setByPath(current, `modules.${arpModule[key]}`, next);
      if (next) {
        if (key === "tontine" && nextArp.dimensions.tontine === "aucune") nextArp = setByPath(nextArp, "dimensions.tontine", "rotation");
        if (key === "prets" && nextArp.dimensions.credit === "aucun") nextArp = setByPath(nextArp, "dimensions.credit", "amortissable");
        if (key === "solidarite" && nextArp.dimensions.aide === "aucune") nextArp = setByPath(nextArp, "dimensions.aide", "forfait");
        if (key === "nature" && nextArp.dimensions.cotisation !== "nature") nextArp = setByPath(nextArp, "dimensions.cotisation", "nature");
      }
      return nextArp;
    });
    setNotice(null);
  };

  const applyTypeProfile = () => {
    const seed = defaultArpConfig({ type: form.type, parentId: form.parentId || null });
    setArp((current) => ({
      ...seed,
      identity: { ...seed.identity, ...current.identity, parentId: form.parentId || null },
      governance: current.governance,
      membership: current.membership,
      finance: current.finance,
      notes: current.notes,
    }));
    setModules({
      tontine: seed.modules.tontine,
      epargne: seed.modules.savings,
      prets: seed.modules.credit,
      solidarite: seed.modules.socialAid,
      investissement: seed.modules.investment,
      nature: seed.modules.nature,
      achats: seed.modules.stocks,
      collation: seed.modules.collation,
    });
    setNotice("Profil type appliqué au cadre ARP et aux modules.");
  };

  const arpValidation = useMemo(() => validateArpConfig(arp), [arp]);
  const conditions = conditionsFor(arp.dimensions);
  const capabilities = deriveCapabilities(arp);
  const previewDates = useMemo(() => getNextSessions(frequency, 12), [frequency]);

  const buildActivities = () => {
    const list: Record<string, unknown>[] = [];
    const common = { frequencyConfig: frequency, contributionFrequency: "MONTHLY" };
    if (modules.tontine) {
      list.push({
        ...common,
        name: "Tontine principale",
        description: "Tontine principale de l'association",
        type: tontine.distributionMode === "AUCTION" ? "TONTINE_ENCHERES" : "TONTINE_ROTATIVE",
        participation: "MANDATORY",
        contributionAmount: Number(tontine.contributionAmount) || 0,
        distributionMode: tontine.distributionMode,
        auctionMinBidPct: tontine.distributionMode === "AUCTION" ? Number(tontine.auctionMinBidPct) || null : null,
        auctionMinBidders: tontine.distributionMode === "AUCTION" ? Number(tontine.auctionMinBidders) || null : null,
        partAmount: tontine.partAmount ? Number(tontine.partAmount) : null,
        beneficiaryAmountPerShare: tontine.beneficiaryAmountPerShare ? Number(tontine.beneficiaryAmountPerShare) : null,
        minShareFraction: Number(tontine.minShareFraction) || 1,
        allowPartialShares: Number(tontine.minShareFraction) < 1,
        cycleMode: tontine.cycleMode,
        cycleSessions: tontine.cycleMode === "FIXED_SESSIONS" ? Number(tontine.cycleSessions) || null : null,
        caisseLoanRate: 5,
      });
    }
    if (modules.epargne) {
      list.push({ ...common, name: "Épargne & investissement", type: "EPARGNE", participation: "OPTIONAL", contributionAmount: null });
    }
    if (modules.prets) {
      list.push({
        ...common,
        name: "Caisse de prêts",
        type: "PRET",
        participation: "OPTIONAL",
        contributionAmount: null,
        loanRate1: 2,
        loanRate2: 4,
        loanApprovalMode: "BUREAU",
        loanMaxActive: 1,
        caisseLoanRate: 5,
      });
    }
    if (modules.solidarite) {
      list.push({ ...common, name: "Caisse de solidarité", type: "AIDE_SOLIDAIRE", participation: "MANDATORY", contributionAmount: null });
    }
    if (modules.investissement) {
      list.push({ ...common, name: "Investissement collectif", type: "INVESTISSEMENT", participation: "OPTIONAL", contributionAmount: null });
    }
    if (modules.nature) {
      list.push({ ...common, name: "Cotisation en nature", type: "NATURE", participation: "OPTIONAL", contributionAmount: null, contributionUnit: "NATURE" });
    }
    if (modules.achats) {
      list.push({ ...common, name: "Achats groupés", type: "ACHATS_GROUPES", participation: "OPTIONAL", contributionAmount: null });
    }
    if (modules.collation) {
      list.push({ ...common, name: "Collation", type: "COLLECTION", participation: "MANDATORY", contributionAmount: null, collectionAmount: 3000 });
    }
    return list;
  };

  const save = async () => {
    setError(null);
    setNotice(null);
    if (form.name.trim().length < 3) {
      setError("Le nom de l'association doit comporter au moins 3 caractères.");
      setTab("identite");
      return;
    }
    if (mode === "create") {
      const capabilityMap: Record<keyof ModuleSelection, keyof typeof capabilities> = {
        tontine: "TONTINE",
        epargne: "SAVINGS",
        prets: "CREDIT",
        solidarite: "SOCIAL_AID",
        nature: "NATURE",
        investissement: "INVESTMENT",
        achats: "STOCKS",
        collation: "COLLATION",
      };
      const blocked = Object.entries(modules)
        .filter(([key, active]) => active && !capabilities[capabilityMap[key as keyof ModuleSelection]])
        .map(([key]) => key);
      if (blocked.length > 0) {
        setError(
          `Ces modules ne sont pas autorisés par le cadre ARP : ${blocked.join(", ")}. Activez-les dans l'onglet Cadre ARP.`
        );
        setTab("arp");
        return;
      }
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const payload = {
          ...form,
          parentId: form.parentId || null,
          parentSubscriptionFee: form.parentSubscriptionFee || null,
          meetingConfig: meeting,
          membershipConfig: membership,
          socialAidCaps: socialAids,
          sanctionsConfig: sanctions,
          bankConfig: bank,
          arpConfig: arp,
          activities: buildActivities(),
          regulations: regulations.filter((item) => item.title.trim() || item.content.trim()),
        };
        const response = await fetch("/api/associations/wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.association) {
          throw new Error(data.error ?? "Création impossible");
        }
        router.push(`/associations/${data.association.id}/configuration`);
        return;
      }

      if (!associationId) throw new Error("Association introuvable");
      const coreResponse = await fetch(`/api/associations/${associationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description,
          type: form.type,
          color: form.color,
          logo: form.logo || null,
          region: form.region,
          email: form.email,
          phone: form.phone,
          website: form.website,
          isPublic: form.isPublic,
          parentId: form.parentId || null,
          parentSubscriptionFee: form.parentSubscriptionFee || null,
          meetingConfig: meeting,
          membershipConfig: membership,
          socialAidCaps: socialAids,
          sanctionsConfig: sanctions,
          bankConfig: bank,
          regulations: regulations.filter((item) => item.title.trim() || item.content.trim()),
        }),
      });
      const coreData = await coreResponse.json().catch(() => ({}));
      if (!coreResponse.ok) throw new Error(coreData.error ?? "Enregistrement impossible");

      const arpChanged = JSON.stringify(arp) !== JSON.stringify(initial?.arpConfig ?? null);
      if (arpChanged) {
        const arpResponse = await fetch(`/api/associations/${associationId}/arp`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: arp, publish: false }),
        });
        const arpData = await arpResponse.json().catch(() => ({}));
        if (!arpResponse.ok) throw new Error(arpData.error ?? "Le cadre ARP n'a pas pu être enregistré");
        // Le cadre est enregistré en brouillon : la page ARP permet de le publier.
        router.push(`/associations/${associationId}/arp`);
      } else {
        router.push(`/associations/${associationId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setSaving(false);
    }
  };

  const tabs: Array<{ key: TabKey; label: string; icon: React.ElementType; badge?: number }> = [
    { key: "identite", label: "Identité", icon: Building2 },
    { key: "contacts", label: "Contacts", icon: MapPin },
    { key: "arp", label: "Cadre ARP", icon: Gauge, badge: arpValidation.errors.length },
    { key: "activites", label: "Activités", icon: Layers },
    { key: "reunions", label: "Réunions & collation", icon: CalendarClock },
    { key: "finances", label: "Adhésion & finances", icon: Wallet },
    { key: "reglement", label: "Règlement", icon: FileText },
    { key: "recap", label: "Récapitulatif", icon: ShieldCheck },
  ];

  const totalActivities = mode === "edit" ? initial?.activities?.length ?? 0 : Object.values(modules).filter(Boolean).length;

  return (
    <DashboardLayout title={mode === "create" ? "Créer une association" : `Modifier — ${initial?.name ?? "association"}`}>
      <div className="mx-auto max-w-6xl pb-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href={mode === "create" ? "/dashboard" : `/associations/${associationId}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0d3d28]"
            >
              <ArrowLeft className="h-4 w-4" /> {mode === "create" ? "Tableau de bord" : "Retour à l'association"}
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-[#1a1a1a]">
              {mode === "create" ? "Créer une association" : "Modifier l'association"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#6b7280]">
              Formulaire par onglets : naviguez librement, enregistrez à tout moment. Le cadre ARP
              vérifie les combinaisons et les conditions avant les nouveaux engagements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={arpValidation.ok ? "green" : "amber"}>
              {arpValidation.ok ? "Cadre ARP valide" : `${arpValidation.errors.length} contrôle(s)`}
            </StatusPill>
            <StatusPill tone="gray">{totalActivities} activité(s)</StatusPill>
          </div>
        </div>

        {error ? (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#f3cdcd] bg-[#fef6f6] px-4 py-3 text-xs text-[#991b1b]">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#cce8d4] bg-[#f7fcf8] px-4 py-3 text-xs text-[#166534]">
            <CheckCircle2 className="h-4 w-4" /> {notice}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] p-1">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11.5px] font-semibold transition ${
                tab === key ? "bg-white text-[#0d3d28] shadow-sm" : "text-[#7a7368] hover:bg-white/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
              {badge ? (
                <span className="rounded-full bg-[#fff1e6] px-1.5 py-0.5 text-[9px] font-bold text-[#b45309]">{badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === "identite" ? (
          <div className="space-y-4">
            <Section title="Identité de l'association" description="Un identifiant stable survit au changement de dénomination (ORG01)." icon={<Building2 className="h-4 w-4" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Nom de l'association *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ex : Tontine des Anciens" />
                <SelectInput
                  label="Type fonctionnel"
                  value={form.type}
                  onChange={(v) => setForm({ ...form, type: v })}
                  options={[
                    { value: "TONTINE_CLUB", label: "Club de tontine" },
                    { value: "COOPERATIVE", label: "Coopérative" },
                    { value: "SOLIDARITY", label: "Fonds de solidarité" },
                    { value: "INVESTMENT", label: "Club d'investissement" },
                    { value: "MUTUAL", label: "Mutuelle" },
                    { value: "AGRICULTURAL", label: "Coopérative agricole" },
                    { value: "AMICALE", label: "Amicale d'élites / ressortissants" },
                    { value: "SECTION", label: "Section / démembrement" },
                    { value: "FEDERATION", label: "Fédération / union" },
                    { value: "CULTURAL", label: "Association culturelle" },
                    { value: "PROFESSIONAL", label: "Association professionnelle" },
                    { value: "OTHER", label: "Autre" },
                  ]}
                  hint="Le type oriente les modules proposés ; il ne vaut pas qualification juridique."
                />
                <Field label="Description" className="md:col-span-2">
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} placeholder="But et objectifs de l'association…" />
                </Field>
                <SelectInput
                  label="Association parente"
                  value={form.parentId}
                  onChange={(v) => {
                    setForm({ ...form, parentId: v });
                    setArp((current) => setByPath(current, "identity.parentId", v || null));
                  }}
                  options={[{ value: "", label: "Aucune — association indépendante" }, ...parents.map((p) => ({ value: p.id, label: p.name }))]}
                  hint="Une section doit être rattachée à une mère ; une fédération peut rester autonome."
                />
                {form.parentId ? (
                  <NumberInput label="Frais de souscription au parent (FCFA)" value={form.parentSubscriptionFee} onChange={(v) => setForm({ ...form, parentSubscriptionFee: v })} min={0} step={500} />
                ) : null}
                <SelectInput
                  label="Statut juridique déclaré"
                  value={arp.identity.legalStatus}
                  onChange={(v) => updateArp("identity.legalStatus", v)}
                  options={[
                    { value: "", label: "Non renseigné" },
                    { value: "DECLAREE", label: "Déclarée" },
                    { value: "EN_COURS", label: "En cours de déclaration" },
                    { value: "NON_DECLAREE", label: "Non déclarée" },
                    { value: "COOPERATIVE", label: "Coopérative agréée" },
                  ]}
                />
                <TextInput label="Référence de la preuve" value={arp.identity.legalStatusProof} onChange={(v) => updateArp("identity.legalStatusProof", v)} placeholder="Récépissé, statuts, décision…" />
                <SelectInput
                  label="Pays"
                  value={arp.identity.country}
                  onChange={(v) => updateArp("identity.country", v)}
                  options={[
                    { value: "CM", label: "Cameroun" },
                    { value: "CI", label: "Côte d'Ivoire" },
                    { value: "SN", label: "Sénégal" },
                    { value: "GA", label: "Gabon" },
                    { value: "CG", label: "Congo" },
                    { value: "FR", label: "France" },
                    { value: "BE", label: "Belgique" },
                    { value: "CA", label: "Canada" },
                    { value: "US", label: "États-Unis" },
                  ]}
                />
                <SelectInput
                  label="Devise fonctionnelle"
                  value={arp.identity.currency}
                  onChange={(v) => {
                    updateArp("identity.currency", v);
                    updateArp("prerequisites.presentationCurrency", v);
                  }}
                  options={[
                    { value: "XAF", label: "XAF — Franc CFA (BEAC)" },
                    { value: "XOF", label: "XOF — Franc CFA (BCEAO)" },
                    { value: "EUR", label: "EUR — Euro" },
                    { value: "USD", label: "USD — Dollar" },
                    { value: "GBP", label: "GBP — Livre" },
                    { value: "CAD", label: "CAD — Dollar canadien" },
                  ]}
                  hint="Verrouillée après la première écriture."
                />
                <TextInput label="Fuseau horaire" value={arp.identity.timezone} onChange={(v) => updateArp("identity.timezone", v)} placeholder="Africa/Douala" />
                <SelectInput
                  label="Modèle de départ"
                  value={arp.identity.startModel}
                  onChange={(v) => updateArp("identity.startModel", v)}
                  options={[
                    { value: "BLANK", label: "Vierge" },
                    { value: "QUARTIER", label: "Tontine de quartier" },
                    { value: "AMICALE", label: "Amicale familiale" },
                    { value: "FEV", label: "Fédération (type FEV)" },
                    { value: "SLD", label: "Section (type SLD)" },
                    { value: "HORIZON", label: "Investissement (type HORIZON)" },
                    { value: "AGRICOLE", label: "Groupement agricole" },
                    { value: "CULTUREL", label: "Club culturel ou sportif" },
                    { value: "PROJET", label: "Association de développement" },
                    { value: "DIASPORA", label: "Diaspora multi-pays" },
                  ]}
                />
                <TextInput label="Date de création" type="date" value={arp.identity.creationDate ?? ""} onChange={(v) => updateArp("identity.creationDate", v || null)} />
              </div>

              <div className="mt-4">
                <p className={labelCls}>Finalités (plusieurs possibles)</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["ENTRAIDE", "Entraide"], ["EPARGNE", "Épargne"], ["INVESTISSEMENT", "Investissement"],
                    ["CULTURE", "Culture"], ["SPORT", "Sport"], ["DEVELOPPEMENT", "Développement"],
                    ["PROFESSIONNEL", "Professionnel"], ["RELIGIEUX", "Religieux"], ["DIASPORA", "Diaspora"],
                    ["EDUCATION", "Éducation"], ["SANTE", "Santé"],
                  ].map(([value, label]) => {
                    const active = arp.identity.purposes.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateArp("identity.purposes", active ? arp.identity.purposes.filter((p) => p !== value) : [...arp.identity.purposes, value])}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          active ? "border-[#0d3d28] bg-[#0d3d28] text-white" : "border-[#ddd6c8] bg-white text-[#4b5563]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>
          </div>
        ) : null}

        {tab === "contacts" ? (
          <Section title="Contacts, territoire et visibilité" description="Les coordonnées de l'association sont distinctes de l'annuaire des membres." icon={<MapPin className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Région / ville" value={form.region} onChange={(v) => setForm({ ...form, region: v })} placeholder="Ex : Douala, Cameroun" />
              <TextInput label="Email de contact" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="contact@association.com" />
              <TextInput label="Téléphone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+237 XXX XX XX XX" />
              <TextInput label="Site web" type="url" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://…" />
              <TextInput label="Logo (URL)" value={form.logo} onChange={(v) => setForm({ ...form, logo: v })} placeholder="https://…/logo.png" />
              <Field label="Couleur du thème">
                <div className="flex gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg" />
                  <input value={form.color} readOnly className={`${inputCls} font-mono`} />
                </div>
              </Field>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
              className="mt-4 flex w-full items-start gap-3 rounded-lg border border-[#e8e2d8] bg-white px-3 py-2.5 text-left"
            >
              <span className={`mt-0.5 inline-flex h-5 w-9 items-center rounded-full p-0.5 ${form.isPublic ? "bg-[#0d3d28]" : "bg-[#d6d1c7]"}`}>
                <span className={`h-4 w-4 rounded-full bg-white shadow ${form.isPublic ? "translate-x-4" : "translate-x-0"}`} />
              </span>
              <span>
                <span className="block text-sm font-medium text-[#1f2937]">Association visible publiquement</span>
                <span className="block text-[11px] text-[#8a8378]">Les données financières et les membres restent protégés ; seuls la fiche et les documents publics sont visibles.</span>
              </span>
            </button>
          </Section>
        ) : null}

        {tab === "arp" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-[#3f3a33]">Cadre ARP et combinaisons</p>
                <p className="text-[10.5px] text-[#8a8378]">
                  {conditions.length ? `${conditions.length} condition(s) — ${conditions.join(", ")}` : "Aucune condition supplémentaire"}
                </p>
              </div>
              <button type="button" onClick={applyTypeProfile} className="rounded-lg border border-[#ddd6c8] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#57534e]">
                Appliquer le profil type
              </button>
            </div>
            <ArpModulesPanel config={arp} canEdit update={updateArp} />
          </div>
        ) : null}

        {tab === "activites" ? (
          <div className="space-y-4">
            {mode === "edit" ? (
              <Section title="Activités de l'association" description="Chaque activité se configure individuellement dans l'espace Configuration." icon={<Layers className="h-4 w-4" />}>
                {(initial?.activities ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#ddd6c8] bg-[#fbf9f3] px-3 py-4 text-sm text-[#8a8378]">
                    Aucune activité. Créez-en une depuis la configuration.
                  </p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {(initial?.activities ?? []).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eee8dc] bg-white px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1f2937]">{activity.name}</p>
                          <p className="text-[10.5px] text-[#8a8378]">{activity.type} · {activity.status ?? "ACTIVE"}</p>
                        </div>
                        <Link href={`/associations/${associationId}/configuration?activity=${activity.id}`} className="flex-shrink-0 text-[11px] font-semibold text-[#0d3d28] hover:underline">
                          Configurer →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  <Link href={`/associations/${associationId}/configuration`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3d28] px-3 py-2 text-xs font-semibold text-white">
                    <Settings2 className="h-3.5 w-3.5" /> Ouvrir la configuration des activités
                  </Link>
                </div>
              </Section>
            ) : (
              <>
                <Section title="Modules à activer" description="Les modules choisis créent les activités initiales ; le paramétrage fin se fait ensuite dans Configuration." icon={<Layers className="h-4 w-4" />}>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {MODULE_DEFS.map((module) => (
                      <button
                        key={module.key}
                        type="button"
                        onClick={() => toggleModule(module.key)}
                        className={`rounded-xl border p-3 text-left transition ${
                          modules[module.key] ? "border-[#0d3d28] bg-[#0d3d28] text-white" : "border-[#e5dfd3] bg-white text-[#3f3a33] hover:border-[#0d3d28]/40"
                        }`}
                      >
                        <p className="text-sm font-bold">{module.title}</p>
                        <p className={`mt-0.5 text-[10.5px] leading-4 ${modules[module.key] ? "text-white/70" : "text-[#8a8378]"}`}>{module.description}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-[#e8e2d8] bg-[#fbf9f3] px-3 py-2 text-[11px] leading-4 text-[#7a7368]">
                    Cohérence ARP : {Object.entries(modules).filter(([, active]) => active).length} module(s) sélectionné(s),{" "}
                    {Object.values(capabilities).filter(Boolean).length} capacité(s) active(s) dans le cadre.
                    {Object.entries(modules).some(([key, active]) => {
                      const map: Record<string, string> = { tontine: "TONTINE", epargne: "SAVINGS", prets: "CREDIT", solidarite: "SOCIAL_AID", nature: "NATURE", investissement: "INVESTMENT", achats: "STOCKS", collation: "COLLATION" };
                      return active && !capabilities[map[key] as keyof typeof capabilities];
                    }) ? " Certains modules ne sont pas encore autorisés par le cadre ARP ; activez-les dans l'onglet Cadre ARP." : " Le cadre et les modules sont cohérents."}
                  </div>
                </Section>

                {modules.tontine ? (
                  <Section title="Paramètres initiaux de la tontine" description="Ils restent modifiables individuellement après la création." icon={<Coins className="h-4 w-4" />}>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <NumberInput label="Cotisation par session (FCFA)" value={tontine.contributionAmount} onChange={(v) => setTontine({ ...tontine, contributionAmount: v })} min={0} step={500} />
                      <SelectInput
                        label="Mode d'attribution"
                        value={tontine.distributionMode}
                        onChange={(v) => setTontine({ ...tontine, distributionMode: v })}
                        options={[
                          { value: "ROTATION", label: "Rotation" },
                          { value: "LOTTERY_MONTHLY", label: "Tirage mensuel" },
                          { value: "AUCTION", label: "Enchères" },
                        ]}
                      />
                      <NumberInput label="Montant d'une part (FCFA)" value={tontine.partAmount} onChange={(v) => setTontine({ ...tontine, partAmount: v })} min={0} step={500} hint="Laisser vide si pas de système de parts." />
                      <NumberInput label="Droit par part bénéficiaire (FCFA)" value={tontine.beneficiaryAmountPerShare} onChange={(v) => setTontine({ ...tontine, beneficiaryAmountPerShare: v })} min={0} step={500} />
                      <SelectInput
                        label="Fraction minimale"
                        value={tontine.minShareFraction}
                        onChange={(v) => setTontine({ ...tontine, minShareFraction: v })}
                        options={[
                          { value: "1", label: "Part entière" },
                          { value: "0.5", label: "Demi-part" },
                          { value: "0.25", label: "Quart de part" },
                        ]}
                      />
                      <SelectInput
                        label="Mode de cycle"
                        value={tontine.cycleMode}
                        onChange={(v) => setTontine({ ...tontine, cycleMode: v })}
                        options={[
                          { value: "FIXED_SESSIONS", label: "Nombre de sessions fixe" },
                          { value: "FIXED_PERIOD", label: "Période fixe" },
                          { value: "UNTIL_ALL_BENEFITED", label: "Jusqu'à épuisement des droits" },
                        ]}
                      />
                      {tontine.cycleMode === "FIXED_SESSIONS" ? (
                        <NumberInput label="Nombre de sessions" value={tontine.cycleSessions} onChange={(v) => setTontine({ ...tontine, cycleSessions: v })} min={1} />
                      ) : null}
                      {tontine.distributionMode === "AUCTION" ? (
                        <>
                          <NumberInput label="Mise à prix (%)" value={tontine.auctionMinBidPct} onChange={(v) => setTontine({ ...tontine, auctionMinBidPct: v })} min={0} max={100} step={0.5} />
                          <NumberInput label="Enchérisseurs minimum" value={tontine.auctionMinBidders} onChange={(v) => setTontine({ ...tontine, auctionMinBidders: v })} min={1} />
                        </>
                      ) : null}
                    </div>
                  </Section>
                ) : null}

                <Section title="Fréquence des sessions" description="La fréquence est commune aux activités créées ; chaque activité peut ensuite avoir son propre cycle." icon={<CalendarClock className="h-4 w-4" />}>
                  <FrequencyPicker value={frequency} onChange={setFrequency} />
                  <div className="mt-3 rounded-lg bg-[#fbf9f3] p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8a8378]">Prochaines sessions — {frequencyLabel(frequency)}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewDates.map((date, index) => (
                        <span key={index} className="rounded-md bg-white px-2 py-1 text-[10.5px] text-[#0d3d28]">
                          {date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                        </span>
                      ))}
                    </div>
                  </div>
                </Section>
              </>
            )}
          </div>
        ) : null}

        {tab === "reunions" ? (
          <Section title="Réunions, présence et collation" description="La réunion rassemble les membres ; les sessions financières restent liées aux activités." icon={<CalendarClock className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SelectInput label="Fréquence" value={meeting.frequency} onChange={(v) => setMeeting({ ...meeting, frequency: v as MeetingConfig["frequency"] })} options={[{ value: "MONTHLY", label: "Mensuelle" }, { value: "QUARTERLY", label: "Trimestrielle" }]} />
              <SelectInput label="Jour" value={String(meeting.dayOfWeek)} onChange={(v) => setMeeting({ ...meeting, dayOfWeek: Number(v) })} options={DAYS.map((day, index) => ({ value: String(index), label: day }))} />
              <NumberInput label="Heure" value={meeting.hour} onChange={(v) => setMeeting({ ...meeting, hour: Number(v) })} min={0} max={23} />
              <NumberInput label="Quorum" value={meeting.quorumPercent} onChange={(v) => setMeeting({ ...meeting, quorumPercent: Number(v) })} min={0} max={100} hint="Pourcentage des membres requis." />
              <NumberInput label="Contribution collation (FCFA)" value={meeting.collationRate} onChange={(v) => setMeeting({ ...meeting, collationRate: Number(v) })} min={0} step={500} />
              <NumberInput label="Forfait hôte (FCFA)" value={meeting.collationHostPayout} onChange={(v) => setMeeting({ ...meeting, collationHostPayout: Number(v) })} min={0} step={5000} />
            </div>
            <div className="mt-3 rounded-lg border border-[#e8e2d8] bg-[#fbf9f3] px-3 py-2 text-[11px] leading-4 text-[#7a7368]">
              Une réunion peut être liée à plusieurs activités. Un changement de date ne crée pas une nouvelle cotisation pour la même échéance (REU02).
            </div>
          </Section>
        ) : null}

        {tab === "finances" ? (
          <div className="space-y-4">
            <Section title="Adhésion" description="L'adhésion est un contrat distinct du compte utilisateur (MEM01–MEM04)." icon={<Users className="h-4 w-4" />}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <NumberInput label="Âge minimum" value={membership.ageMin} onChange={(v) => setMembership({ ...membership, ageMin: v })} min={0} />
                <NumberInput label="Droit d'entrée (FCFA)" value={membership.admissionFee} onChange={(v) => setMembership({ ...membership, admissionFee: v })} min={0} step={500} />
                <NumberInput label="Parrains requis" value={membership.sponsorshipCount} onChange={(v) => setMembership({ ...membership, sponsorshipCount: Number(v) })} min={0} />
                <SelectInput label="Processus d'admission" value={membership.approvalProcess} onChange={(v) => setMembership({ ...membership, approvalProcess: v as MembershipConfig["approvalProcess"] })} options={[{ value: "UNANIMITY", label: "Unanimité" }, { value: "MAJORITY", label: "Majorité" }, { value: "AUTO", label: "Automatique" }]} />
                <TextInput label="Délai d'attente" value={membership.waitingPeriod} onChange={(v) => setMembership({ ...membership, waitingPeriod: v })} placeholder="Ex : 3 mois" />
                <button type="button" onClick={() => setMembership({ ...membership, sponsorshipRequired: !membership.sponsorshipRequired })} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${membership.sponsorshipRequired ? "border-[#0d3d28] bg-[#0d3d28] text-white" : "border-[#ddd6c8] bg-white text-[#57534e]"}`}>
                  Parrainage {membership.sponsorshipRequired ? "obligatoire" : "facultatif"}
                </button>
              </div>
            </Section>

            <Section title="Plafonds des aides sociales" description="Les montants sont des plafonds, pas des droits automatiques." icon={<Coins className="h-4 w-4" />}>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                {[
                  ["illness_member", "Maladie membre"],
                  ["illness_spouse", "Maladie conjoint"],
                  ["death_member", "Décès membre"],
                  ["death_spouse", "Décès conjoint"],
                  ["death_child_under5", "Décès enfant < 5 ans"],
                  ["death_child_over5", "Décès enfant > 5 ans"],
                  ["death_parent", "Décès parent"],
                  ["marriage", "Mariage"],
                  ["birth", "Naissance"],
                  ["birth_twins", "Naissance jumeaux"],
                ].map(([key, label]) => (
                  <NumberInput key={key} label={label} value={socialAids[key as keyof SocialAidCaps]} onChange={(v) => setSocialAids({ ...socialAids, [key]: v })} min={0} step={5000} />
                ))}
              </div>
            </Section>

            <Section title="Sanctions et barèmes" description="Chaque montant doit rester contestable et rattaché au constat initial." icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {[
                  ["late", "Retard"],
                  ["absent1", "Absence 1"],
                  ["absent2", "Absence 2"],
                  ["absent3", "Absence 3"],
                  ["indiscipline", "Indiscipline"],
                  ["missedCommission", "Commission manquée"],
                  ["agNationale", "AG nationale"],
                ].map(([key, label]) => (
                  <NumberInput key={key} label={label} value={sanctions[key as keyof SanctionsConfig]} onChange={(v) => setSanctions({ ...sanctions, [key]: Number(v) })} min={0} step={500} />
                ))}
              </div>
            </Section>

            <Section title="Compte bancaire" description="Le compte est un lieu de conservation ; il ne définit pas l'usage des fonds." icon={<Wallet className="h-4 w-4" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Banque" value={bank.bankName} onChange={(v) => setBank({ ...bank, bankName: v })} placeholder="Nom de la banque" />
                <TextInput label="RIB / IBAN" value={bank.rib} onChange={(v) => setBank({ ...bank, rib: v })} placeholder="Numéro de compte" />
                <TextInput label="Titulaire" value={bank.accountHolder} onChange={(v) => setBank({ ...bank, accountHolder: v })} placeholder="Nom du titulaire" />
                <SelectInput label="Mode de paiement" value={bank.paymentMode} onChange={(v) => setBank({ ...bank, paymentMode: v })} options={[{ value: "VIREMENT", label: "Virement" }, { value: "CHEQUE", label: "Chèque" }, { value: "ESPECES", label: "Espèces" }, { value: "MOBILE_MONEY", label: "Mobile Money" }]} />
              </div>
            </Section>
          </div>
        ) : null}

        {tab === "reglement" ? (
          <Section title="Règlement intérieur" description="Les articles sont versionnés et approuvés par les membres." icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-3">
              {regulations.map((regulation, index) => (
                <div key={index} className="rounded-xl border border-[#eee8dc] bg-white p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={regulation.title}
                      onChange={(e) => setRegulations((current) => current.map((item, i) => (i === index ? { ...item, title: e.target.value } : item)))}
                      placeholder={`Article ${index + 1}`}
                      className={`${inputCls} flex-1`}
                    />
                    <button type="button" onClick={() => setRegulations((current) => current.filter((_, i) => i !== index))} className="rounded-lg border border-[#f3cdcd] bg-[#fef6f6] p-2 text-[#991b1b]" aria-label="Supprimer l'article">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={regulation.content}
                    onChange={(e) => setRegulations((current) => current.map((item, i) => (i === index ? { ...item, content: e.target.value } : item)))}
                    rows={2}
                    placeholder="Contenu de l'article"
                    className={`${inputCls} mt-2`}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setRegulations((current) => [...current, { title: `Article ${current.length + 1}`, content: "" }])} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#ddd6c8] bg-white px-3 py-1.5 text-xs font-semibold text-[#57534e]">
              <Plus className="h-3.5 w-3.5" /> Ajouter un article
            </button>
          </Section>
        ) : null}

        {tab === "recap" ? (
          <div className="space-y-4">
            <Section title="Récapitulatif avant enregistrement" description="Les onglets restent accessibles : revenez en arrière sans perdre vos modifications." icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[#eee8dc] bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8378]">Association</p>
                  <p className="mt-1 text-sm font-bold text-[#1f2937]">{form.name || "Sans nom"}</p>
                  <p className="text-[11px] text-[#8a8378]">{form.type} · {arp.identity.currency} · {form.region || "Territoire non renseigné"}</p>
                </div>
                <div className="rounded-xl border border-[#eee8dc] bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8378]">Cadre ARP</p>
                  <p className="mt-1 text-sm font-bold text-[#1f2937]">{conditions.length ? `${conditions.length} condition(s)` : "Sans condition"}</p>
                  <p className="text-[11px] text-[#8a8378]">{arp.dimensions.organisation} · {arp.dimensions.tontine} · {arp.dimensions.credit}</p>
                </div>
                <div className="rounded-xl border border-[#eee8dc] bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8378]">Activités</p>
                  <p className="mt-1 text-sm font-bold text-[#1f2937]">{totalActivities}</p>
                  <p className="text-[11px] text-[#8a8378]">{mode === "edit" ? "Modifiables individuellement dans Configuration" : Object.entries(modules).filter(([, active]) => active).map(([key]) => key).join(" · ")}</p>
                </div>
                <div className="rounded-xl border border-[#eee8dc] bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8378]">Complétude ARP</p>
                  <p className="mt-1 text-sm font-bold text-[#0d3d28]">{arpValidation.completeness}%</p>
                  <div className="mt-1"><ProgressBar value={arpValidation.completeness} /></div>
                </div>
              </div>
            </Section>
            {arpValidation.errors.length > 0 ? (
              <IssueList issues={arpValidation.errors} tone="error" title={`${arpValidation.errors.length} contrôle(s) ARP à compléter`} />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-[#cce8d4] bg-[#f7fcf8] px-4 py-3 text-xs text-[#166534]">
                <CheckCircle2 className="h-4 w-4" /> Le cadre ARP ne présente aucun contrôle bloquant.
              </div>
            )}
            {arpValidation.warnings.length > 0 ? (
              <IssueList issues={arpValidation.warnings} tone="warning" />
            ) : null}
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e2ddd4] bg-[#fffdf9]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-[#7a7368]">
              {tab === "recap" ? "Vérifiez le récapitulatif puis enregistrez." : "Vous pouvez changer d'onglet ou enregistrer à tout moment."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={mode === "create" ? "/associations" : `/associations/${associationId}`} className="rounded-lg border border-[#ddd6c8] bg-white px-3 py-2 text-xs font-semibold text-[#57534e]">
                Annuler
              </Link>
              <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3d28] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2f1f] disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {mode === "create" ? "Créer l'association" : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
