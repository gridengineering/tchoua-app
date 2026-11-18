"use client";

import { useMemo, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, CircleAlert,
  Coins, FileText, HeartHandshake, Landmark, Loader2, MapPin, ShieldCheck,
  Sparkles, Users, Wallet, Wand2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type ActivityKey = "TONTINE" | "EPARGNE" | "PRET" | "SOLIDARITE" | "INVESTISSEMENT" | "ACHATS";

const VOCATIONS = [
  { value: "TONTINE_CLUB", label: "Club de tontine", hint: "Tontine, épargne et entraide", template: "A30" },
  { value: "COOPERATIVE", label: "Coopérative", hint: "Activités économiques et épargne", template: "COOPERATIVE" },
  { value: "SOLIDARITY", label: "Fonds de solidarité", hint: "Aide aux membres et familles", template: "SOLIDARITY" },
  { value: "INVESTMENT", label: "Fonds d'investissement", hint: "Projets et rendements collectifs", template: "INVESTMENT" },
  { value: "MUTUAL", label: "Mutuelle", hint: "Protection et prévoyance", template: "MUTUAL" },
  { value: "AGRICULTURAL", label: "Groupement agricole", hint: "Production, achats et ventes", template: "AGRICULTURAL" },
];

const ACTIVITIES: Array<{ key: ActivityKey; label: string; hint: string; icon: typeof Coins }> = [
  { key: "TONTINE", label: "Tontine", hint: "Une cagnotte distribuée à tour de rôle", icon: Coins },
  { key: "EPARGNE", label: "Épargne", hint: "Constituer une réserve commune", icon: Landmark },
  { key: "PRET", label: "Prêts internes", hint: "Prêter aux membres depuis la caisse", icon: Wallet },
  { key: "SOLIDARITE", label: "Aide & solidarité", hint: "Décès, maladie, mariage, naissance", icon: HeartHandshake },
  { key: "INVESTISSEMENT", label: "Investissement / dividendes", hint: "Projets et partage des résultats", icon: Sparkles },
  { key: "ACHATS", label: "Achats groupés", hint: "Négocier et acheter ensemble", icon: Users },
];

const MEETING_PRESETS = [
  { id: "FIRST_SUNDAY", label: "Mensuelle — 1er dimanche", frequency: "MONTHLY", dayOfWeek: 0, sessionRule: { kind: "NTH_WEEKDAY", position: 1, weekday: 0 } },
  { id: "LAST_SUNDAY", label: "Mensuelle — dernier dimanche", frequency: "MONTHLY", dayOfWeek: 0, sessionRule: { kind: "NTH_WEEKDAY", position: 5, weekday: 0 } },
  { id: "FIRST_SATURDAY", label: "Mensuelle — 1er samedi", frequency: "MONTHLY", dayOfWeek: 6, sessionRule: { kind: "NTH_WEEKDAY", position: 1, weekday: 6 } },
  { id: "BIWEEKLY", label: "Bimensuelle — 1re et 2e quinzaine", frequency: "BIWEEKLY", dayOfWeek: 0, sessionRule: { kind: "FORTNIGHT", half: 1, weekday: 0 } },
  { id: "QUARTERLY", label: "Trimestrielle", frequency: "QUARTERLY", dayOfWeek: 0, sessionRule: { kind: "NTH_WEEKDAY", position: 1, weekday: 0 } },
] as const;

const ACTIVITY_LABELS: Record<ActivityKey, string> = {
  TONTINE: "Tontine",
  EPARGNE: "Épargne",
  PRET: "Prêts internes",
  SOLIDARITE: "Aide & solidarité",
  INVESTISSEMENT: "Investissement",
  ACHATS: "Achats groupés",
};

const AID_LABELS: Record<string, string> = {
  DEATH: "Décès",
  ILLNESS: "Maladie",
  MARRIAGE: "Mariage",
  BIRTH: "Naissance",
};

const MONEY = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function money(value: string | number) {
  const n = Number(String(value).replace(/\s/g, ""));
  return Number.isFinite(n) ? `${MONEY.format(n)} FCFA` : "—";
}

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>{children}{hint ? <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{hint}</span> : null}</label>;
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10 ${props.className ?? ""}`} />;
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10 ${props.className ?? ""}`} />;
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${checked ? "border-[#0d3d28] bg-[#0d3d28]/5" : "border-slate-200 bg-white hover:border-slate-300"}`}><span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${checked ? "border-[#0d3d28] bg-[#0d3d28] text-white" : "border-slate-300 bg-white"}`}>{checked && <Check className="h-3.5 w-3.5" />}</span><span><span className="block text-sm font-black text-slate-800">{label}</span>{hint && <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">{hint}</span>}</span></button>;
}

export default function AssociationAssistantPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "TONTINE_CLUB",
    region: "",
    description: "",
    isPublic: false,
    size: "20_50",
    entryFee: "0",
    requireRegulationApproval: true,
    minKycLevel: "1",
    activities: ["TONTINE"] as ActivityKey[],
    tontineShare: "25000",
    tontineFrequency: "MONTHLY",
    distributionMode: "ROTATION",
    loanRate: "3",
    aidEvents: ["DEATH", "ILLNESS"] as string[],
    meetingPreset: "FIRST_SUNDAY",
    modality: "PHYSICAL",
    collation: false,
    quorum: "60",
    payments: ["WALLET", "CASH"] as string[],
    cashMax: "",
    finesLate: "1000",
    finesAbsence: "2000",
    generateRegulation: true,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const has = (key: ActivityKey) => form.activities.includes(key);
  const toggleActivity = (key: ActivityKey) => set("activities", has(key) ? form.activities.filter((item) => item !== key) : [...form.activities, key]);
  const togglePayment = (key: string) => set("payments", form.payments.includes(key) ? form.payments.filter((item) => item !== key) : [...form.payments, key]);
  const toggleAid = (key: string) => set("aidEvents", form.aidEvents.includes(key) ? form.aidEvents.filter((item) => item !== key) : [...form.aidEvents, key]);

  const meetingPreset = MEETING_PRESETS.find((preset) => preset.id === form.meetingPreset) ?? MEETING_PRESETS[0];

  const validateStep = (current: number): string | null => {
    if (current === 1) {
      if (form.name.trim().length < 3) return "Donnez un nom d'au moins 3 caractères à votre association.";
      if (!form.region.trim()) return "Indiquez la ville ou la région de l'association.";
    }
    if (current === 2 && form.activities.length === 0) return "Sélectionnez au moins une activité.";
    if (current === 2 && has("TONTINE") && (!Number(form.tontineShare) || Number(form.tontineShare) <= 0)) return "Indiquez le montant d'une part de tontine.";
    if (current === 4 && form.payments.length === 0) return "Sélectionnez au moins un moyen d'encaissement.";
    if (current === 5 && form.payments.length === 0) return "Sélectionnez au moins un moyen d'encaissement.";
    return null;
  };

  const next = () => {
    const message = validateStep(step);
    if (message) return setError(message);
    setError(null);
    setStep((current) => Math.min(5, current + 1));
  };

  const previous = () => {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  };

  const create = async () => {
    for (const check of [1, 2, 4, 5]) {
      const message = validateStep(check);
      if (message) {
        setStep(check);
        setError(message);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const meeting = {
        frequency: meetingPreset.frequency,
        dayOfWeek: meetingPreset.dayOfWeek,
        hour: 15,
        quorumPercent: Number(form.quorum) || 60,
        collationRate: form.collation ? 3000 : 0,
        collationHostPayout: form.collation ? 150000 : 0,
        sessionsEnabled: true,
        modality: form.modality,
        sessionRule: meetingPreset.sessionRule,
        agendaTemplate: [
          "Appel et vérification du quorum",
          "Lecture et adoption du procès-verbal précédent",
          "Situation financière de l'association",
          "Point sur les activités et engagements",
          "Décisions et résolutions",
          "Prochaine session : lieu, date et heure",
        ],
      };

      const membershipConfig = {
        ageMin: "18",
        sponsorshipRequired: false,
        sponsorshipCount: 0,
        admissionFee: String(Number(form.entryFee) || 0),
        approvalProcess: form.requireRegulationApproval ? "MAJORITY" : "AUTO",
        waitingPeriod: "0",
        annualDues: "0",
        solidarityFund: "0",
        investmentMonthly: "0",
        tontineAnnual: "0",
      };

      const sanctionsConfig = {
        late: Number(form.finesLate) || 0,
        absent1: Number(form.finesAbsence) || 0,
        absent2: Number(form.finesAbsence) * 2 || 0,
        absent3: Number(form.finesAbsence) * 3 || 0,
        indiscipline: 0,
        missedCommission: 0,
        agNationale: 0,
      };

      const socialAidCaps = {
        illness_member: form.aidEvents.includes("ILLNESS") ? "50000" : "0",
        illness_spouse: "0",
        death_member: form.aidEvents.includes("DEATH") ? "500000" : "0",
        death_spouse: "0",
        death_child_under5: "0",
        death_child_over5: "0",
        death_parent: "0",
        marriage: form.aidEvents.includes("MARRIAGE") ? "100000" : "0",
        birth: form.aidEvents.includes("BIRTH") ? "50000" : "0",
        birth_twins: "0",
      };

      const bankConfig = {
        bankName: "",
        rib: "",
        accountHolder: "",
        paymentMode: form.payments.includes("BANK") ? "VIREMENT" : "ESPECES",
        cashEnabled: form.payments.includes("CASH"),
        cashMaxAmount: Number(form.cashMax) || 0,
      };

      const commonActivity = { status: "ACTIVE", contributionUnit: "CASH", paymentMethods: JSON.stringify(form.payments) };
      const activities = [] as any[];
      if (has("TONTINE")) {
        activities.push({
          ...commonActivity,
          name: "Tontine principale",
          description: "Tontine des membres, distribuée selon le mode choisi.",
          type: form.distributionMode === "AUCTION" ? "TONTINE_ENCHERES" : "TONTINE_ROTATIVE",
          participation: "MANDATORY",
          contributionAmount: Number(form.tontineShare) || 0,
          contributionFrequency: form.tontineFrequency,
          distributionMode: form.distributionMode,
          partAmount: Number(form.tontineShare) || 0,
          maxPartsPerSession: 1,
          cycleMode: "FIXED_SESSIONS",
          cycleSessions: 12,
          auctionMinBidPct: form.distributionMode === "AUCTION" ? 5 : null,
          auctionMinBidders: form.distributionMode === "AUCTION" ? 2 : null,
        });
      }
      if (has("EPARGNE")) activities.push({ ...commonActivity, name: "Épargne commune", description: "Réserve d'épargne des membres.", type: "EPARGNE", participation: "OPTIONAL" });
      if (has("PRET")) activities.push({ ...commonActivity, name: "Caisse de prêts", description: "Prêts internes accordés par le bureau.", type: "PRET", participation: "OPTIONAL", loanRate1: Number(form.loanRate) || 3, loanRate2: (Number(form.loanRate) || 3) * 2, loanApprovalMode: "BUREAU", loanMaxActive: 1, caisseLoanRate: Number(form.loanRate) || 3 });
      if (has("SOLIDARITE")) activities.push({ ...commonActivity, name: "Caisse de solidarité", description: "Aide aux membres et à leurs familles.", type: "AIDE_SOLIDAIRE", participation: "MANDATORY" });
      if (has("INVESTISSEMENT")) activities.push({ ...commonActivity, name: "Investissement collectif", description: "Projets communs et dividendes.", type: "INVESTISSEMENT", participation: "OPTIONAL" });
      if (has("ACHATS")) activities.push({ ...commonActivity, name: "Achats groupés", description: "Achats négociés pour les membres.", type: "ACHATS_GROUPES", participation: "OPTIONAL" });

      const regulations = form.generateRegulation ? [
        { title: "Article 1 — Adhésion", content: `Toute personne admise dans ${form.name.trim()} s'engage à respecter le présent règlement intérieur et à s'acquitter de son droit d'adhésion.` },
        { title: "Article 2 — Cotisations et activités", content: "Les cotisations et participations sont dues selon la périodicité et les montants fixés par le bureau et l'assemblée." },
        { title: "Article 3 — Réunions", content: `Les membres se réunissent selon la fréquence choisie. Le quorum requis est de ${form.quorum || 60} % des membres actifs.` },
        { title: "Article 4 — Discipline", content: "Les retards, absences non excusées et manquements peuvent entraîner les amendes prévues par le barème de l'association." },
        { title: "Article 5 — Solidarité", content: "La caisse de solidarité intervient selon les événements et plafonds définis par l'association." },
        { title: "Article 6 — Transparence", content: "Les comptes et décisions sont présentés aux membres lors des réunions ; chaque membre peut demander un relevé de sa situation." },
      ] : [];

      const response = await fetch("/api/associations/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          type: form.type,
          templateUsed: VOCATIONS.find((item) => item.value === form.type)?.template ?? "ASSISTANT",
          region: form.region.trim(),
          isPublic: form.isPublic,
          color: "#0d3d28",
          minKycLevel: Number(form.minKycLevel) || 0,
          requireRegulationApproval: form.requireRegulationApproval,
          meetingConfig: meeting,
          membershipConfig,
          socialAidCaps,
          sanctionsConfig,
          bankConfig,
          activities,
          regulations,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "La création de l'association a échoué.");
      const id = data.association?.id ?? data.id;
      if (!id) throw new Error("L'association a été créée mais son identifiant est introuvable.");
      router.push(`/associations/${id}/modifier`);
    } catch (cause: any) {
      setError(cause.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const summaryActivities = useMemo(() => form.activities.map((key) => ACTIVITY_LABELS[key]).join(" · "), [form.activities]);

  return (
    <DashboardLayout title="Assistant de génération">
      <div className="mx-auto max-w-5xl space-y-5 animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard/associations/new" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Choisir une autre méthode</Link>
          <span className="rounded-full bg-[#0d3d28]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#0d3d28]">Assistant · 5 étapes</span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#0d3d28] px-5 py-6 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#d4a343] text-[#0d3d28]"><Wand2 className="h-5 w-5" /></div>
              <div><h1 className="text-2xl font-black tracking-tight">Créons votre association</h1><p className="mt-1 text-sm text-white/70">Quelques informations essentielles suffisent. Tout restera modifiable dans la configuration.</p></div>
            </div>
            <div className="mt-6 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((number) => <div key={number} className={`h-1.5 flex-1 rounded-full ${number <= step ? "bg-[#d4a343]" : "bg-white/20"}`} />)}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wide text-white/50"><span>Identité</span><span>Membres</span><span>Activités</span><span>Réunions</span><span>Finances</span></div>
          </div>

          <div className="p-5 sm:p-8">
            {error && <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />{error}</div>}

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#a47718]">Étape 1 sur 5</p><h2 className="mt-1 text-xl font-black text-slate-900">Identité &amp; vocation</h2><p className="mt-1 text-sm text-slate-500">Les fondations de votre association.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom de l'association *" className="sm:col-span-2"><TextInput value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Ex. Association Amicale du Quartier" autoFocus /></Field>
                  <Field label="Vocation principale *" hint="Le modèle de départ adapte les modules proposés."><SelectInput value={form.type} onChange={(event) => set("type", event.target.value)}>{VOCATIONS.map((item) => <option key={item.value} value={item.value}>{item.label} — {item.hint}</option>)}</SelectInput></Field>
                  <Field label="Ville / région *"><TextInput value={form.region} onChange={(event) => set("region", event.target.value)} placeholder="Ex. Douala, Cameroun" /></Field>
                  <Field label="Objet de l'association" hint="Une phrase simple, modifiable plus tard." className="sm:col-span-2"><TextInput value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Ex. Mutualiser l'épargne et soutenir les membres dans les moments difficiles." /></Field>
                  <div className="sm:col-span-2"><Toggle checked={form.isPublic} onChange={(value) => set("isPublic", value)} label="Association publique" hint={form.isPublic ? "Visible dans l'annuaire public ; l'adhésion reste soumise aux règles." : "Privée : les nouveaux membres rejoignent avec un code ou une invitation."} /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#a47718]">Étape 2 sur 5</p><h2 className="mt-1 text-xl font-black text-slate-900">Membres &amp; adhésion</h2><p className="mt-1 text-sm text-slate-500">Qui peut rejoindre et comment ?</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Taille attendue"><SelectInput value={form.size} onChange={(event) => set("size", event.target.value)}><option value="SMALL">Moins de 20 membres</option><option value="20_50">20 à 50 membres</option><option value="LARGE">Plus de 50 membres</option></SelectInput></Field>
                  <Field label="Droit d'adhésion (FCFA) *"><TextInput type="number" min="0" value={form.entryFee} onChange={(event) => set("entryFee", event.target.value)} /></Field>
                  <Field label="Niveau KYC minimum"><SelectInput value={form.minKycLevel} onChange={(event) => set("minKycLevel", event.target.value)}><option value="0">Aucune vérification</option><option value="1">Basique — téléphone ou e-mail</option><option value="2">Complète — pièce d'identité</option></SelectInput></Field>
                  <div className="sm:col-span-2"><Toggle checked={form.requireRegulationApproval} onChange={(value) => set("requireRegulationApproval", value)} label="Adhésion validée par le bureau" hint="Les nouveaux membres sont approuvés avant de participer aux activités." /></div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500"><Users className="mr-2 inline h-4 w-4 text-[#0d3d28]" /> Le fondateur est automatiquement membre actif. Les autres membres passeront par le parcours d&apos;adhésion.</div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#a47718]">Étape 3 sur 5</p><h2 className="mt-1 text-xl font-black text-slate-900">Activités</h2><p className="mt-1 text-sm text-slate-500">Sélectionnez ce que votre association fera ensemble.</p></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ACTIVITIES.map((activity) => {
                    const Icon = activity.icon;
                    const active = has(activity.key);
                    return <button key={activity.key} type="button" onClick={() => toggleActivity(activity.key)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-[#0d3d28] bg-[#0d3d28]/5" : "border-slate-200 bg-white hover:border-slate-300"}`}><span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#0d3d28] text-white" : "bg-slate-100 text-slate-500"}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="flex items-center gap-2 text-sm font-black text-slate-800">{activity.label}{active && <Check className="h-3.5 w-3.5 text-[#0d3d28]" />}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">{activity.hint}</span></span></button>;
                  })}
                </div>
                {has("TONTINE") && <div className="grid gap-4 rounded-2xl border border-[#d4a343]/30 bg-[#fbf7ec] p-4 sm:grid-cols-3"><Field label="Montant d'une part (FCFA) *"><TextInput type="number" min="0" value={form.tontineShare} onChange={(event) => set("tontineShare", event.target.value)} /></Field><Field label="Périodicité"><SelectInput value={form.tontineFrequency} onChange={(event) => set("tontineFrequency", event.target.value)}><option value="MONTHLY">Mensuelle</option><option value="BIWEEKLY">Quinzaine</option><option value="WEEKLY">Hebdomadaire</option><option value="QUARTERLY">Trimestrielle</option></SelectInput></Field><Field label="Attribution"><SelectInput value={form.distributionMode} onChange={(event) => set("distributionMode", event.target.value)}><option value="ROTATION">Rotation — ordre fixe</option><option value="LOTTERY_MONTHLY">Tirage mensuel</option><option value="AUCTION">Enchères</option></SelectInput></Field></div>}
                {has("PRET") && <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"><Field label="Taux d'intérêt mensuel (%)"><TextInput type="number" min="0" step="0.5" value={form.loanRate} onChange={(event) => set("loanRate", event.target.value)} /></Field><p className="self-end text-xs leading-relaxed text-slate-500">Les prêts sont accordés depuis la caisse après validation du bureau.</p></div>}
                {has("SOLIDARITE") && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">Événements couverts</p><div className="flex flex-wrap gap-2">{Object.entries(AID_LABELS).map(([key, label]) => <button key={key} type="button" onClick={() => toggleAid(key)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${form.aidEvents.includes(key) ? "border-[#0d3d28] bg-[#0d3d28] text-white" : "border-slate-200 bg-white text-slate-500"}`}>{label}</button>)}</div></div>}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#a47718]">Étape 4 sur 5</p><h2 className="mt-1 text-xl font-black text-slate-900">Réunions &amp; sessions</h2><p className="mt-1 text-sm text-slate-500">Comment et quand les membres se retrouvent-ils ?</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fréquence des réunions *" className="sm:col-span-2"><SelectInput value={form.meetingPreset} onChange={(event) => set("meetingPreset", event.target.value)}>{MEETING_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</SelectInput></Field>
                  <Field label="Lieu habituel *"><SelectInput value={form.modality} onChange={(event) => set("modality", event.target.value)}><option value="PHYSICAL">Fixe — lieu habituel</option><option value="ONLINE">En ligne</option><option value="ROTATING">Rotatif chez les membres</option></SelectInput></Field>
                  <Field label="Quorum requis (%)"><TextInput type="number" min="0" max="100" value={form.quorum} onChange={(event) => set("quorum", event.target.value)} /></Field>
                  <div className="sm:col-span-2"><Toggle checked={form.collation} onChange={(value) => set("collation", value)} label="Collation à la charge de l'hôte" hint="Une contribution de 3 000 FCFA et un forfait hôte de 150 000 FCFA seront proposés par défaut." /></div>
                </div>
                <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0d3d28]" /> Le prochain rendez-vous sera calculé automatiquement à partir de la fréquence choisie. Vous pourrez ajouter le lieu exact dans la fiche de l&apos;association.</div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#a47718]">Étape 5 sur 5</p><h2 className="mt-1 text-xl font-black text-slate-900">Finances &amp; récapitulatif</h2><p className="mt-1 text-sm text-slate-500">Derniers réglages avant la génération.</p></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { key: "WALLET", label: "Wallet membre", icon: Wallet },
                    { key: "BANK", label: "Banque", icon: Landmark },
                    { key: "CASH", label: "Espèces", icon: Coins },
                  ].map((payment) => { const Icon = payment.icon; const active = form.payments.includes(payment.key); return <button key={payment.key} type="button" onClick={() => togglePayment(payment.key)} className={`flex items-center gap-2 rounded-2xl border p-3 text-left ${active ? "border-[#0d3d28] bg-[#0d3d28]/5" : "border-slate-200 bg-white"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-[#0d3d28] text-white" : "bg-slate-100 text-slate-500"}`}><Icon className="h-4 w-4" /></span><span className="text-xs font-black text-slate-700">{payment.label}</span></button>; })}
                </div>
                {form.payments.includes("CASH") && <Field label="Plafond des versements en espèces (FCFA)" hint="Laissez vide pour appliquer le plafond global de la plateforme."><TextInput type="number" min="0" value={form.cashMax} onChange={(event) => set("cashMax", event.target.value)} placeholder="Ex. 100 000" /></Field>}
                <div className="grid gap-4 sm:grid-cols-2"><Field label="Amende de retard (FCFA)"><TextInput type="number" min="0" value={form.finesLate} onChange={(event) => set("finesLate", event.target.value)} /></Field><Field label="Amende d'absence non excusée (FCFA)"><TextInput type="number" min="0" value={form.finesAbsence} onChange={(event) => set("finesAbsence", event.target.value)} /></Field></div>
                <Toggle checked={form.generateRegulation} onChange={(value) => set("generateRegulation", value)} label="Générer un règlement intérieur standard" hint="Six articles de base seront créés et pourront être modifiés par le bureau." />
                <div className="rounded-2xl border border-[#d4a343]/30 bg-[#fbf7ec] p-5">
                  <div className="flex items-center gap-2 text-sm font-black text-[#0d3d28]"><CheckCircle2 className="h-4 w-4" /> Votre association en un coup d&apos;œil</div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <p><span className="font-black">Nom :</span> {form.name || "À compléter"}</p>
                    <p><span className="font-black">Vocation :</span> {VOCATIONS.find((item) => item.value === form.type)?.label}</p>
                    <p><span className="font-black">Région :</span> {form.region || "À compléter"}</p>
                    <p><span className="font-black">Accès :</span> {form.isPublic ? "Public" : "Privé"}</p>
                    <p className="sm:col-span-2"><span className="font-black">Activités :</span> {summaryActivities || "À compléter"}</p>
                    <p><span className="font-black">Réunions :</span> {meetingPreset.label}</p>
                    <p><span className="font-black">Encaissement :</span> {form.payments.map((key) => ({ WALLET: "Wallet", BANK: "Banque", CASH: "Espèces" } as Record<string, string>)[key]).join(" · ")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-8">
            <button type="button" onClick={step === 1 ? () => router.push("/dashboard/associations/new") : previous} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /> {step === 1 ? "Annuler" : "Retour"}</button>
            {step < 5 ? <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-[#0d3d28] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#0d3d28]/15 hover:bg-[#15563a]">Continuer <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={create} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#d4a343] px-5 py-2.5 text-sm font-black text-[#0d3d28] shadow-lg shadow-[#d4a343]/20 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {saving ? "Génération…" : "Générer l'association"}</button>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> Vous pourrez tout modifier après la création, sans perdre les informations déjà saisies.</div>
      </div>
    </DashboardLayout>
  );
}
