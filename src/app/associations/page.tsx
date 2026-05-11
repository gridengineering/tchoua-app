"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import {
  Plus, X, Users, Calendar, MapPin, ChevronRight, Building2,
  Handshake, Heart, TrendingUp, Wheat, Shield, Globe2,
  UserCog, Trash2, CheckCircle2, ChevronLeft,
  Mail, Phone, Link as LinkIcon, Hash, BadgeCheck,
  Banknote, Clock, AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AssocType = "TONTINE_CLUB" | "COOPERATIVE" | "SOLIDARITY" | "INVESTMENT" | "AGRICULTURAL" | "MUTUAL" | "OTHER";
type ActivityType = "TONTINE_ROTATIVE" | "TONTINE_ASCA" | "TONTINE_ENCHERES" | "EPARGNE" | "AIDE_SOLIDAIRE" | "PRET" | "NATURE" | "INVESTISSEMENT" | "ACHATS_GROUPES" | "COLLECTION";
type Participation = "MANDATORY" | "OPTIONAL" | "CONDITIONAL";
type ApprovalProcess = "UNANIMOUS" | "MAJORITY" | "AUTO";
type MeetingFrequency = "MONTHLY" | "QUARTERLY";

interface Person { name: string; email: string; phone: string }
interface Activity {
  name: string;
  type: ActivityType;
  participation: Participation;
  contributionAmount: string;
  contributionFrequency: string;
  distributionMode: string;
}
interface BureauConfig {
  president: Person;
  vicePresident: Person;
  secretaireGeneral: Person;
  secretairesAdjoints: Person[];
  tresorier: Person;
  tresorierAdjoint: Person;
  responsableSolidarite: Person;
  responsableNature: Person;
  commissaires: Person[];
  censeurs: Person[];
  conseillers: Person[];
}
interface WizardState {
  step: number;
  // Step 1
  name: string; description: string; type: AssocType; region: string; color: string;
  website: string; email: string; phone: string;
  // Step 2
  templateUsed: string;
  // Step 3
  activities: Activity[];
  // Step 4
  bureauConfig: BureauConfig;
  // Step 5
  membershipConfig: {
    ageMin: string; sponsorshipRequired: boolean; sponsorshipCount: number;
    admissionFee: string; approvalProcess: ApprovalProcess; waitingPeriod: string;
  };
  // Step 6
  meetingConfig: { frequency: MeetingFrequency; dayOfWeek: number; hour: number; quorumPercent: number };
  socialAidCaps: { illness_member: string; illness_spouse: string; death_member: string; death_spouse: string; death_child_under5: string; death_child_over5: string; death_parent: string; marriage: string; birth: string; birth_twins: string };
  sanctionsConfig: { late: number; absent1: number; absent2: number; absent3: number; indiscipline: number; missedCommission: number; agNationale: number };
  bankConfig: { bankName: string; rib: string; accountHolder: string; paymentMode: string };
  solidarityFund: { annualAmount: string; recoverable: boolean };
  // Step 7
  inviteEmails: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyPerson = (): Person => ({ name: "", email: "", phone: "" });

const emptyActivity = (): Activity => ({
  name: "", type: "TONTINE_ROTATIVE", participation: "MANDATORY",
  contributionAmount: "", contributionFrequency: "MONTHLY", distributionMode: "ROTATION",
});

const initialWizard = (): WizardState => ({
  step: 1,
  name: "", description: "", type: "TONTINE_CLUB", region: "", color: "#0d3d28",
  website: "", email: "", phone: "",
  templateUsed: "BLANK",
  activities: [emptyActivity()],
  bureauConfig: {
    president: emptyPerson(), vicePresident: emptyPerson(), secretaireGeneral: emptyPerson(),
    secretairesAdjoints: [emptyPerson()], tresorier: emptyPerson(), tresorierAdjoint: emptyPerson(),
    responsableSolidarite: emptyPerson(), responsableNature: emptyPerson(),
    commissaires: [], censeurs: [], conseillers: [],
  },
  membershipConfig: { ageMin: "", sponsorshipRequired: false, sponsorshipCount: 1, admissionFee: "", approvalProcess: "MAJORITY", waitingPeriod: "" },
  meetingConfig: { frequency: "MONTHLY", dayOfWeek: 6, hour: 15, quorumPercent: 60 },
  socialAidCaps: { illness_member: "", illness_spouse: "", death_member: "", death_spouse: "", death_child_under5: "", death_child_over5: "", death_parent: "", marriage: "", birth: "", birth_twins: "" },
  sanctionsConfig: { late: 500, absent1: 1000, absent2: 3000, absent3: 5000, indiscipline: 3000, missedCommission: 5000, agNationale: 20000 },
  bankConfig: { bankName: "", rib: "", accountHolder: "", paymentMode: "VIREMENT" },
  solidarityFund: { annualAmount: "", recoverable: false },
  inviteEmails: "",
});

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSOC_TYPES: { value: AssocType; label: string; icon: React.ReactNode }[] = [
  { value: "TONTINE_CLUB", label: "Club de Tontine", icon: <span>🔄</span> },
  { value: "COOPERATIVE", label: "Coopérative", icon: <Handshake className="w-4 h-4" /> },
  { value: "SOLIDARITY", label: "Fonds de Solidarité", icon: <Heart className="w-4 h-4" /> },
  { value: "INVESTMENT", label: "Fonds d'Investissement", icon: <TrendingUp className="w-4 h-4" /> },
  { value: "AGRICULTURAL", label: "Groupement Agricole", icon: <Wheat className="w-4 h-4" /> },
  { value: "MUTUAL", label: "Mutuelle", icon: <Shield className="w-4 h-4" /> },
  { value: "OTHER", label: "Autre", icon: <Globe2 className="w-4 h-4" /> },
];

const ASSOC_TYPE_ICON: Record<AssocType, string> = {
  TONTINE_CLUB: "🔄", COOPERATIVE: "🤝", SOLIDARITY: "❤️",
  INVESTMENT: "📈", AGRICULTURAL: "🌾", MUTUAL: "🏥", OTHER: "🌍",
};

const COLORS = ["#0d3d28", "#e68a00", "#2563eb", "#dc2626", "#7c3aed", "#db2777", "#ea580c", "#16a34a"];

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "TONTINE_ROTATIVE", label: "Tontine Rotative" },
  { value: "TONTINE_ASCA", label: "Tontine ASCA" },
  { value: "TONTINE_ENCHERES", label: "Tontine aux Enchères" },
  { value: "EPARGNE", label: "Épargne" },
  { value: "AIDE_SOLIDAIRE", label: "Aide Solidaire" },
  { value: "PRET", label: "Prêt" },
  { value: "NATURE", label: "Nature" },
  { value: "INVESTISSEMENT", label: "Investissement" },
  { value: "ACHATS_GROUPES", label: "Achats Groupés" },
  { value: "COLLECTION", label: "Collection" },
];

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const STEPS = [
  "Identité", "Template", "Activités", "Bureau",
  "Adhésion", "Règles", "Lancement",
];

// ── Template Definitions ──────────────────────────────────────────────────────

const TEMPLATES = {
  BLANK: {
    label: "Personnalisé",
    icon: "✏️",
    description: "Créez votre association entièrement sur mesure, étape par étape.",
  },
  A30: {
    label: "Association Amicale du Trente (A30)",
    icon: "🌟",
    description: "Template pour associations mensuelles avec tirage unique, petite et grande tontine, et fonds de solidarité.",
  },
  AMSED: {
    label: "Amicale de Section (AMSED)",
    icon: "🏛️",
    description: "Template complet avec tontine enchères, fonds solidarité & investissement, collection, plafonds d'aide sociale détaillés.",
  },
  NDI_MBE: {
    label: "Fonds d'Investissement NDI MBE ET FILS",
    icon: "📊",
    description: "Fonds d'investissement avec apports en capital et prêts à taux progressifs.",
  },
};

function applyTemplate(templateName: string, current: WizardState): Partial<WizardState> {
  if (templateName === "A30") {
    return {
      templateUsed: "A30",
      type: "TONTINE_CLUB",
      bureauConfig: {
        president: emptyPerson(), vicePresident: emptyPerson(),
        secretaireGeneral: emptyPerson(), secretairesAdjoints: [emptyPerson()],
        tresorier: emptyPerson(), tresorierAdjoint: emptyPerson(),
        responsableSolidarite: emptyPerson(), responsableNature: emptyPerson(),
        commissaires: [], censeurs: [], conseillers: [emptyPerson()],
      },
      activities: [
        { name: "Petite Tontine", type: "TONTINE_ROTATIVE", participation: "MANDATORY", contributionAmount: "", contributionFrequency: "MONTHLY", distributionMode: "ROTATION" },
        { name: "Grande Tontine", type: "TONTINE_ROTATIVE", participation: "MANDATORY", contributionAmount: "", contributionFrequency: "MONTHLY", distributionMode: "SINGLE" },
        { name: "Fonds de Solidarité", type: "AIDE_SOLIDAIRE", participation: "MANDATORY", contributionAmount: "", contributionFrequency: "MONTHLY", distributionMode: "SOLIDARITY" },
      ],
      meetingConfig: { frequency: "MONTHLY", dayOfWeek: 6, hour: 15, quorumPercent: 60 },
      membershipConfig: { ...current.membershipConfig, sponsorshipRequired: true, sponsorshipCount: 1, approvalProcess: "UNANIMOUS" },
    };
  }
  if (templateName === "AMSED") {
    return {
      templateUsed: "AMSED",
      type: "TONTINE_CLUB",
      bureauConfig: {
        president: emptyPerson(), vicePresident: emptyPerson(),
        secretaireGeneral: emptyPerson(), secretairesAdjoints: [emptyPerson(), emptyPerson()],
        tresorier: emptyPerson(), tresorierAdjoint: emptyPerson(),
        responsableSolidarite: emptyPerson(), responsableNature: emptyPerson(),
        commissaires: [emptyPerson(), emptyPerson()], censeurs: [emptyPerson()], conseillers: [emptyPerson()],
      },
      activities: [
        { name: "Tontine Annuelle", type: "TONTINE_ENCHERES", participation: "MANDATORY", contributionAmount: "25000", contributionFrequency: "MONTHLY", distributionMode: "ENCHERES" },
        { name: "Fonds de Solidarité", type: "AIDE_SOLIDAIRE", participation: "MANDATORY", contributionAmount: "6000", contributionFrequency: "MONTHLY", distributionMode: "SOLIDARITY" },
        { name: "Fonds d'Investissement", type: "INVESTISSEMENT", participation: "MANDATORY", contributionAmount: "5000", contributionFrequency: "MONTHLY", distributionMode: "INVESTMENT" },
        { name: "Collection", type: "COLLECTION", participation: "MANDATORY", contributionAmount: "3000", contributionFrequency: "SESSION", distributionMode: "POOL" },
      ],
      meetingConfig: { frequency: "MONTHLY", dayOfWeek: 6, hour: 15, quorumPercent: 60 },
      membershipConfig: { ...current.membershipConfig, sponsorshipRequired: false, approvalProcess: "MAJORITY" },
      socialAidCaps: {
        illness_member: "70000", illness_spouse: "35000",
        death_member: "900000", death_spouse: "405000",
        death_child_under5: "100000", death_child_over5: "200000",
        death_parent: "150000", marriage: "50000", birth: "30000", birth_twins: "50000",
      },
      sanctionsConfig: { late: 500, absent1: 1000, absent2: 3000, absent3: 5000, indiscipline: 3000, missedCommission: 5000, agNationale: 20000 },
    };
  }
  if (templateName === "NDI_MBE") {
    return {
      templateUsed: "NDI_MBE",
      type: "INVESTMENT",
      bureauConfig: {
        president: emptyPerson(), vicePresident: emptyPerson(),
        secretaireGeneral: emptyPerson(), secretairesAdjoints: [],
        tresorier: emptyPerson(), tresorierAdjoint: emptyPerson(),
        responsableSolidarite: emptyPerson(), responsableNature: emptyPerson(),
        commissaires: [], censeurs: [], conseillers: [],
      },
      activities: [
        { name: "Apport en Capital", type: "INVESTISSEMENT", participation: "OPTIONAL", contributionAmount: "", contributionFrequency: "MONTHLY", distributionMode: "CAPITAL" },
        { name: "Prêt (1-3 mois, 2%/mois)", type: "PRET", participation: "OPTIONAL", contributionAmount: "", contributionFrequency: "MONTHLY", distributionMode: "LOAN_SHORT" },
        { name: "Prêt (>3 mois, 4%/mois)", type: "PRET", participation: "OPTIONAL", contributionAmount: "", contributionFrequency: "MONTHLY", distributionMode: "LOAN_LONG" },
      ],
      meetingConfig: { ...current.meetingConfig },
      bankConfig: { ...current.bankConfig, paymentMode: "VIREMENT" },
    };
  }
  return { templateUsed: "BLANK" };
}

// ── CSS Helpers ───────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28] bg-warm-white";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1";
const sectionCls = "p-4 rounded-xl space-y-3";

// ── Sub-components ────────────────────────────────────────────────────────────

function PersonFields({ label, value, onChange, accent = "#0d3d28" }: { label: string; value: Person; onChange: (p: Person) => void; accent?: string }) {
  return (
    <div className={sectionCls} style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}>
      <div className="flex items-center gap-2">
        <UserCog className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
        <span className="text-xs font-semibold" style={{ color: accent }}>{label}</span>
      </div>
      <input className={inputCls} style={{ border: "1px solid #e2ddd4" }} placeholder="Nom complet"
        value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} style={{ border: "1px solid #e2ddd4" }} placeholder="Email" type="email"
          value={value.email} onChange={e => onChange({ ...value, email: e.target.value })} />
        <input className={inputCls} style={{ border: "1px solid #e2ddd4" }} placeholder="Téléphone"
          value={value.phone} onChange={e => onChange({ ...value, phone: e.target.value })} />
      </div>
    </div>
  );
}

function MultiPersonFields({ label, items, onChange, accent = "#0d3d28", singular }: { label: string; singular: string; items: Person[]; onChange: (arr: Person[]) => void; accent?: string }) {
  return (
    <div className={sectionCls} style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
          <span className="text-xs font-semibold" style={{ color: accent }}>{label}</span>
        </div>
        <button type="button" onClick={() => onChange([...items, emptyPerson()])}
          className="text-xs px-2 py-1 rounded-lg font-medium transition-colors"
          style={{ color: accent, background: `${accent}14` }}>
          + Ajouter
        </button>
      </div>
      {items.length === 0 && <p className="text-xs text-ash italic">Aucun {singular} défini.</p>}
      {items.map((p, i) => (
        <div key={i} className="space-y-2 pt-2 border-t border-stone">
          <div className="flex items-center gap-2">
            <input className={inputCls} style={{ border: "1px solid #e2ddd4", flex: 1 }} placeholder={`${singular} ${i + 1} — Nom`}
              value={p.name} onChange={e => { const arr = [...items]; arr[i] = { ...arr[i], name: e.target.value }; onChange(arr); }} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} style={{ border: "1px solid #e2ddd4" }} placeholder="Email" type="email"
              value={p.email} onChange={e => { const arr = [...items]; arr[i] = { ...arr[i], email: e.target.value }; onChange(arr); }} />
            <input className={inputCls} style={{ border: "1px solid #e2ddd4" }} placeholder="Téléphone"
              value={p.phone} onChange={e => { const arr = [...items]; arr[i] = { ...arr[i], phone: e.target.value }; onChange(arr); }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AssociationsPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [wizard, setWizard] = useState<WizardState>(initialWizard());

  const loadAssociations = useCallback(() => {
    fetch("/api/associations?mine=true")
      .then(r => r.json())
      .then(d => { setAssociations(d.associations || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadAssociations(); }, [loadAssociations]);

  const resetWizard = () => { setWizard(initialWizard()); setError(""); };

  const openWizard = () => { resetWizard(); setShowWizard(true); };

  // ── Template application ─────────────────────────────────────────────────

  const handleSelectTemplate = (tpl: string) => {
    const patch = applyTemplate(tpl, wizard);
    setWizard(prev => ({ ...prev, ...patch }));
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    if (wizard.step === 1) return wizard.name.trim().length > 0;
    if (wizard.step === 3) return wizard.activities.length > 0 && wizard.activities.every(a => a.name.trim().length > 0);
    return true;
  };

  const nextStep = () => {
    if (!canProceed()) { setError("Veuillez remplir les champs obligatoires."); return; }
    setError("");
    setWizard(prev => ({ ...prev, step: Math.min(prev.step + 1, 7) }));
  };

  const prevStep = () => setWizard(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));

  // ── Submission ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wizard.name, description: wizard.description, type: wizard.type,
          region: wizard.region, color: wizard.color, website: wizard.website,
          email: wizard.email, phone: wizard.phone, templateUsed: wizard.templateUsed,
          activities: wizard.activities,
          bureauConfig: wizard.bureauConfig,
          membershipConfig: wizard.membershipConfig,
          meetingConfig: wizard.meetingConfig,
          socialAidCaps: wizard.socialAidCaps,
          sanctionsConfig: wizard.sanctionsConfig,
          bankConfig: wizard.bankConfig,
          solidarityFund: wizard.solidarityFund,
          inviteEmails: wizard.inviteEmails,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors de la création."); setSubmitting(false); return; }
      setShowWizard(false);
      resetWizard();
      router.push(`/associations/${data.id}`);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setSubmitting(false);
    }
  };

  // ── Join association ─────────────────────────────────────────────────────

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch("/api/associations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || "Code invalide."); setJoining(false); return; }
      setShowJoin(false);
      setJoinCode("");
      router.push(`/associations/${data.id}`);
    } catch {
      setJoinError("Erreur réseau.");
      setJoining(false);
    }
  };

  // ── Wizard update helpers ────────────────────────────────────────────────

  const updateWizard = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setWizard(prev => ({ ...prev, [key]: value }));

  const updateActivity = (i: number, patch: Partial<Activity>) =>
    setWizard(prev => {
      const acts = [...prev.activities];
      acts[i] = { ...acts[i], ...patch };
      return { ...prev, activities: acts };
    });

  const removeActivity = (i: number) =>
    setWizard(prev => ({ ...prev, activities: prev.activities.filter((_, j) => j !== i) }));

  const addActivity = () =>
    setWizard(prev => ({ ...prev, activities: [...prev.activities, emptyActivity()] }));

  const updateBureau = (patch: Partial<BureauConfig>) =>
    setWizard(prev => ({ ...prev, bureauConfig: { ...prev.bureauConfig, ...patch } }));

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Mes Associations">
      <div className="space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mes Associations</h2>
            <p className="text-sm text-graphite">{associations.length} association(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all hover:bg-cream"
              style={{ borderColor: "#e68a00", color: "#7c2d12" }}>
              <Hash className="w-4 h-4" /> Rejoindre
            </button>
            <button
              onClick={openWizard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "#0d3d28" }}>
              <Plus className="w-4 h-4" /> Créer une association
            </button>
          </div>
        </div>

        {/* ── List / Empty state ───────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : associations.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Building2 className="w-16 h-16 text-ash/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune association</h3>
              <p className="text-graphite mb-6 max-w-sm mx-auto">
                Créez votre première association ou rejoignez une association existante avec un code d'invitation.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={openWizard}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-all"
                  style={{ background: "#0d3d28" }}>
                  <Plus className="w-4 h-4" /> Créer une association
                </button>
                <button onClick={() => setShowJoin(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border transition-all hover:bg-cream"
                  style={{ borderColor: "#e68a00", color: "#7c2d12" }}>
                  <Hash className="w-4 h-4" /> Rejoindre
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {associations.map((a: any) => (
              <button key={a.id} onClick={() => router.push(`/associations/${a.id}`)}
                className="text-left w-full">
                <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: a.color ? `${a.color}18` : "rgba(13,61,40,0.08)" }}>
                        {ASSOC_TYPE_ICON[a.type as AssocType] || "🏛️"}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: a.status === "ACTIVE" ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                          color: a.status === "ACTIVE" ? "#16a34a" : "#6b7280",
                        }}>
                        {a.status === "ACTIVE" ? "Active" : a.status === "PENDING" ? "En attente" : a.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">{a.name}</h3>
                    <p className="text-sm text-graphite mb-3 line-clamp-2">
                      {a.description || ASSOC_TYPES.find(t => t.value === a.type)?.label || a.type}
                    </p>
                    <div className="space-y-1.5">
                      {a.region && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-ash" />
                          <span>{a.region}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5 text-ash" />
                        <span>{a._count?.members ?? 0} membre(s)</span>
                      </div>
                      {a._count?.activities > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BadgeCheck className="w-3.5 h-3.5 text-ash" />
                          <span>{a._count.activities} activité(s)</span>
                        </div>
                      )}
                      {a.nextMeeting && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-ash" />
                          <span>{new Date(a.nextMeeting).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        </div>
                      )}
                    </div>
                    {a.myRole && (
                      <div className="mt-3 pt-3 border-t border-stone flex items-center justify-between">
                        <span className="text-xs text-graphite">Rôle : <strong>{a.myRole}</strong></span>
                        <ChevronRight className="w-4 h-4 text-ash" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </button>
            ))}
            <button onClick={openWizard}
              className="border-2 border-dashed rounded-xl p-5 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
              style={{ borderColor: "#e2ddd4" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d3d28"; e.currentTarget.style.background = "rgba(13,61,40,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2ddd4"; e.currentTarget.style.background = "transparent"; }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#f7f3eb" }}>
                <Plus className="w-6 h-6 text-ash" />
              </div>
              <span className="text-sm text-graphite font-medium">Créer une association</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Join Modal ────────────────────────────────────────────────────── */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-warm-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Rejoindre une association</h3>
              <button onClick={() => { setShowJoin(false); setJoinCode(""); setJoinError(""); }} className="text-ash hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-graphite">Entrez le code d'invitation transmis par un membre de l'association.</p>
            <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
              placeholder="Code d'invitation (ex: ASSOC-XK9P2)"
              value={joinCode} onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleJoin(); }} />
            {joinError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-error/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {joinError}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowJoin(false); setJoinCode(""); setJoinError(""); }}
                className="flex-1 py-2.5 rounded-xl border font-medium text-sm" style={{ borderColor: "#e2ddd4", color: "#374151" }}>
                Annuler
              </button>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60 transition-all hover:opacity-90"
                style={{ background: "#e68a00" }}>
                {joining ? "Vérification…" : "Rejoindre"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Wizard Modal ──────────────────────────────────────────────────── */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="bg-warm-white rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl">

            {/* Wizard Header */}
            <div className="px-6 py-4 border-b border-stone flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-bold" style={{ color: "#0d3d28" }}>
                    {wizard.name ? `Créer "${wizard.name}"` : "Créer une association"}
                  </h2>
                  <p className="text-xs text-ash mt-0.5">{STEPS[wizard.step - 1]}</p>
                </div>
                <button onClick={() => { setShowWizard(false); resetWizard(); }} className="text-ash hover:text-gray-600 ml-4">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-1 mt-3">
                {STEPS.map((label, i) => {
                  const s = i + 1;
                  const done = wizard.step > s;
                  const active = wizard.step === s;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                          style={{
                            background: done ? "#e68a00" : active ? "#0d3d28" : "#e2ddd4",
                            color: done || active ? "white" : "#9ca3af",
                          }}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        <span className="hidden sm:block text-[9px] text-ash whitespace-nowrap">{label}</span>
                      </div>
                      {s < 7 && <div className="flex-1 h-0.5 mx-0.5 rounded transition-all" style={{ background: done ? "#e68a00" : "#e2ddd4" }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wizard Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* ── Step 1: Identité ─────────────────────────────────────── */}
              {wizard.step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nom de l'association *</label>
                    <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                      placeholder="Association Amicale du Trente"
                      value={wizard.name} onChange={e => updateWizard("name", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea rows={3} className={inputCls} style={{ border: "1px solid #e2ddd4", resize: "none" }}
                      placeholder="Objectif et mission de l'association…"
                      value={wizard.description} onChange={e => updateWizard("description", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Type d'association *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ASSOC_TYPES.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => updateWizard("type", opt.value)}
                          className="flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all text-sm"
                          style={{
                            borderColor: wizard.type === opt.value ? "#0d3d28" : "#e2ddd4",
                            background: wizard.type === opt.value ? "rgba(13,61,40,0.06)" : "white",
                            color: wizard.type === opt.value ? "#0d3d28" : "#374151",
                            fontWeight: wizard.type === opt.value ? 600 : 400,
                          }}>
                          <span className="flex-shrink-0">{opt.icon}</span>
                          <span className="text-xs leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Zone géographique / Région</label>
                      <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                        placeholder="Bafoussam, Douala, Paris…"
                        value={wizard.region} onChange={e => updateWizard("region", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Couleur d'identification</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {COLORS.map(c => (
                          <button key={c} type="button" onClick={() => updateWizard("color", c)}
                            className="w-8 h-8 rounded-full border-2 transition-all"
                            style={{ background: c, borderColor: wizard.color === c ? "#374151" : "transparent", transform: wizard.color === c ? "scale(1.2)" : "scale(1)" }} />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 overflow-hidden" style={{ borderColor: "#e2ddd4" }}>
                          <input type="color" value={wizard.color}
                            onChange={e => updateWizard("color", e.target.value)}
                            className="w-10 h-10 -m-1 cursor-pointer" title="Couleur personnalisée" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}><Mail className="w-3 h-3 inline mr-1" />Email</label>
                      <input className={inputCls} style={{ border: "1px solid #e2ddd4" }} type="email"
                        placeholder="contact@asso.org"
                        value={wizard.email} onChange={e => updateWizard("email", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Téléphone</label>
                      <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                        placeholder="+237 6xx xxx xxx"
                        value={wizard.phone} onChange={e => updateWizard("phone", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}><LinkIcon className="w-3 h-3 inline mr-1" />Site web</label>
                      <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                        placeholder="https://…"
                        value={wizard.website} onChange={e => updateWizard("website", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Template ─────────────────────────────────────── */}
              {wizard.step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-graphite">Choisissez un template pour pré-configurer votre association ou partez de zéro.</p>
                  {Object.entries(TEMPLATES).map(([key, tpl]) => (
                    <button key={key} type="button"
                      onClick={() => handleSelectTemplate(key)}
                      className="w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                      style={{
                        borderColor: wizard.templateUsed === key ? "#e68a00" : "#e2ddd4",
                        background: wizard.templateUsed === key ? "rgba(212,163,67,0.06)" : "white",
                      }}>
                      <span className="text-3xl flex-shrink-0 mt-0.5">{tpl.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900">{tpl.label}</p>
                          {wizard.templateUsed === key && (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#e68a00" }} />
                          )}
                        </div>
                        <p className="text-xs text-graphite mt-0.5 leading-relaxed">{tpl.description}</p>
                        {key === "A30" && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {["Président", "VP", "SG", "SA", "Trésorier", "TA", "Conseillers"].map(r => (
                              <span key={r} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(13,61,40,0.08)", color: "#0d3d28" }}>{r}</span>
                            ))}
                          </div>
                        )}
                        {key === "AMSED" && (
                          <div className="mt-2 space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {["Président", "VP", "SG", "2SA", "Trésorier", "TA", "2CAC", "Censeur"].map(r => (
                                <span key={r} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(13,61,40,0.08)", color: "#0d3d28" }}>{r}</span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["Tontine 25 000 FCFA", "Solidarité 72 000/an", "Invest 5 000/mois", "Collection 3 000/séance"].map(a => (
                                <span key={a} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(212,163,67,0.12)", color: "#7c2d12" }}>{a}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {key === "NDI_MBE" && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {["Apport en capital", "Prêt 2%/mois (1-3m)", "Prêt 4%/mois (>3m)", "Virement obligatoire"].map(a => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(37,99,235,0.08)", color: "#1d4ed8" }}>{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Step 3: Activités ────────────────────────────────────── */}
              {wizard.step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-graphite">Définissez les activités financières de l'association. Au moins une activité est obligatoire.</p>
                  {wizard.activities.map((act, i) => (
                    <div key={i} className={sectionCls} style={{ background: "rgba(13,61,40,0.03)", border: "1px solid rgba(13,61,40,0.1)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: "#0d3d28" }}>Activité {i + 1}</span>
                        {wizard.activities.length > 1 && (
                          <button type="button" onClick={() => removeActivity(i)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Nom *</label>
                        <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          placeholder="Ex : Petite Tontine, Fonds Solidarité…"
                          value={act.name} onChange={e => updateActivity(i, { name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Type</label>
                          <select className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                            value={act.type} onChange={e => updateActivity(i, { type: e.target.value as ActivityType })}>
                            {ACTIVITY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Participation</label>
                          <select className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                            value={act.participation} onChange={e => updateActivity(i, { participation: e.target.value as Participation })}>
                            <option value="MANDATORY">Obligatoire</option>
                            <option value="OPTIONAL">Optionnelle</option>
                            <option value="CONDITIONAL">Conditionnelle</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Montant cotisation (FCFA)</label>
                          <input type="number" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                            placeholder="25000"
                            value={act.contributionAmount} onChange={e => updateActivity(i, { contributionAmount: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Fréquence</label>
                          <select className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                            value={act.contributionFrequency} onChange={e => updateActivity(i, { contributionFrequency: e.target.value })}>
                            <option value="SESSION">Par séance</option>
                            <option value="MONTHLY">Mensuelle</option>
                            <option value="QUARTERLY">Trimestrielle</option>
                            <option value="ANNUAL">Annuelle</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addActivity}
                    className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all hover:bg-cream"
                    style={{ borderColor: "#e68a00", color: "#7c2d12" }}>
                    <Plus className="w-4 h-4 inline mr-1" /> Ajouter une activité
                  </button>
                </div>
              )}

              {/* ── Step 4: Bureau ───────────────────────────────────────── */}
              {wizard.step === 4 && (
                <div className="space-y-3">
                  <p className="text-xs text-graphite bg-cream p-3 rounded-lg">Configurez les membres du bureau. Tous les champs sont optionnels à cette étape.</p>
                  <PersonFields label="Président(e)" value={wizard.bureauConfig.president}
                    onChange={v => updateBureau({ president: v })} />
                  <PersonFields label="Vice-Président(e)" value={wizard.bureauConfig.vicePresident}
                    onChange={v => updateBureau({ vicePresident: v })} />
                  <PersonFields label="Secrétaire Général(e)" value={wizard.bureauConfig.secretaireGeneral}
                    onChange={v => updateBureau({ secretaireGeneral: v })} />
                  <MultiPersonFields label="Secrétaires Adjoint(e)s" singular="Secrétaire adjoint"
                    items={wizard.bureauConfig.secretairesAdjoints}
                    onChange={arr => updateBureau({ secretairesAdjoints: arr })} />
                  <PersonFields label="Trésorier(ère)" value={wizard.bureauConfig.tresorier}
                    onChange={v => updateBureau({ tresorier: v })} />
                  <PersonFields label="Trésorier(ère) Adjoint(e)" value={wizard.bureauConfig.tresorierAdjoint}
                    onChange={v => updateBureau({ tresorierAdjoint: v })} />
                  <PersonFields label="Responsable Solidarité" value={wizard.bureauConfig.responsableSolidarite}
                    onChange={v => updateBureau({ responsableSolidarite: v })} />
                  <PersonFields label="Responsable Nature" value={wizard.bureauConfig.responsableNature}
                    onChange={v => updateBureau({ responsableNature: v })} />
                  <MultiPersonFields label="Commissaires aux Comptes" singular="Commissaire"
                    items={wizard.bureauConfig.commissaires}
                    onChange={arr => updateBureau({ commissaires: arr })} accent="#e68a00" />
                  <MultiPersonFields label="Censeurs" singular="Censeur"
                    items={wizard.bureauConfig.censeurs}
                    onChange={arr => updateBureau({ censeurs: arr })} accent="#7c3aed" />
                  <MultiPersonFields label="Conseillers" singular="Conseiller"
                    items={wizard.bureauConfig.conseillers}
                    onChange={arr => updateBureau({ conseillers: arr })} accent="#2563eb" />
                </div>
              )}

              {/* ── Step 5: Adhésion ─────────────────────────────────────── */}
              {wizard.step === 5 && (
                <div className="space-y-4">
                  <div className={sectionCls} style={{ background: "rgba(13,61,40,0.03)", border: "1px solid rgba(13,61,40,0.1)" }}>
                    <h3 className="text-sm font-semibold" style={{ color: "#0d3d28" }}>Critères d'admission</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Âge minimum</label>
                        <input type="number" min="0" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          placeholder="18"
                          value={wizard.membershipConfig.ageMin}
                          onChange={e => updateWizard("membershipConfig", { ...wizard.membershipConfig, ageMin: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>Délai de carence (mois)</label>
                        <input type="number" min="0" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          placeholder="0"
                          value={wizard.membershipConfig.waitingPeriod}
                          onChange={e => updateWizard("membershipConfig", { ...wizard.membershipConfig, waitingPeriod: e.target.value })} />
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={wizard.membershipConfig.sponsorshipRequired}
                        onChange={e => updateWizard("membershipConfig", { ...wizard.membershipConfig, sponsorshipRequired: e.target.checked })}
                        className="w-4 h-4 accent-[#0d3d28]" />
                      <span className="text-sm text-gray-700">Parrainage obligatoire</span>
                    </label>
                    {wizard.membershipConfig.sponsorshipRequired && (
                      <div>
                        <label className={labelCls}>Nombre de parrains requis</label>
                        <input type="number" min="1" max="10" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          value={wizard.membershipConfig.sponsorshipCount}
                          onChange={e => updateWizard("membershipConfig", { ...wizard.membershipConfig, sponsorshipCount: parseInt(e.target.value) || 1 })} />
                      </div>
                    )}
                  </div>
                  <div className={sectionCls} style={{ background: "rgba(212,163,67,0.05)", border: "1px solid rgba(212,163,67,0.2)" }}>
                    <h3 className="text-sm font-semibold" style={{ color: "#7c2d12" }}>Cotisation d'adhésion</h3>
                    <div>
                      <label className={labelCls}>Montant (FCFA)</label>
                      <input type="number" min="0" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                        placeholder="10000"
                        value={wizard.membershipConfig.admissionFee}
                        onChange={e => updateWizard("membershipConfig", { ...wizard.membershipConfig, admissionFee: e.target.value })} />
                    </div>
                  </div>
                  <div className={sectionCls} style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)" }}>
                    <h3 className="text-sm font-semibold text-blue-800">Processus d'approbation</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "UNANIMOUS", label: "Unanime", desc: "Tous les membres" },
                        { value: "MAJORITY", label: "Majorité", desc: "> 50%" },
                        { value: "AUTO", label: "Automatique", desc: "Sans vote" },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => updateWizard("membershipConfig", { ...wizard.membershipConfig, approvalProcess: opt.value as ApprovalProcess })}
                          className="p-3 rounded-lg border-2 text-left transition-all"
                          style={{
                            borderColor: wizard.membershipConfig.approvalProcess === opt.value ? "#2563eb" : "#e2ddd4",
                            background: wizard.membershipConfig.approvalProcess === opt.value ? "rgba(37,99,235,0.08)" : "white",
                          }}>
                          <p className="text-xs font-semibold text-gray-800">{opt.label}</p>
                          <p className="text-[10px] text-graphite">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 6: Règles ───────────────────────────────────────── */}
              {wizard.step === 6 && (
                <div className="space-y-4">
                  {/* Réunions */}
                  <div className={sectionCls} style={{ background: "rgba(13,61,40,0.03)", border: "1px solid rgba(13,61,40,0.1)" }}>
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#0d3d28" }}>
                      <Calendar className="w-4 h-4" /> Réunions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Fréquence</label>
                        <select className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          value={wizard.meetingConfig.frequency}
                          onChange={e => updateWizard("meetingConfig", { ...wizard.meetingConfig, frequency: e.target.value as MeetingFrequency })}>
                          <option value="MONTHLY">Mensuelle</option>
                          <option value="QUARTERLY">Trimestrielle</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Jour de la semaine</label>
                        <select className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          value={wizard.meetingConfig.dayOfWeek}
                          onChange={e => updateWizard("meetingConfig", { ...wizard.meetingConfig, dayOfWeek: parseInt(e.target.value) })}>
                          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Heure de réunion</label>
                        <input type="number" min="6" max="22" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          value={wizard.meetingConfig.hour}
                          onChange={e => updateWizard("meetingConfig", { ...wizard.meetingConfig, hour: parseInt(e.target.value) || 15 })} />
                      </div>
                      <div>
                        <label className={labelCls}>Quorum (%)</label>
                        <input type="number" min="1" max="100" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          value={wizard.meetingConfig.quorumPercent}
                          onChange={e => updateWizard("meetingConfig", { ...wizard.meetingConfig, quorumPercent: parseInt(e.target.value) || 60 })} />
                      </div>
                    </div>
                  </div>

                  {/* Fonds de solidarité */}
                  <div className={sectionCls} style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-red-700">
                      <Heart className="w-4 h-4" /> Fonds de solidarité
                    </h3>
                    <div>
                      <label className={labelCls}>Montant annuel (FCFA)</label>
                      <input type="number" min="0" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                        placeholder="72000"
                        value={wizard.solidarityFund.annualAmount}
                        onChange={e => updateWizard("solidarityFund", { ...wizard.solidarityFund, annualAmount: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={wizard.solidarityFund.recoverable}
                        onChange={e => updateWizard("solidarityFund", { ...wizard.solidarityFund, recoverable: e.target.checked })}
                        className="w-4 h-4 accent-[#dc2626]" />
                      <span className="text-sm text-gray-700">Récupérable à la fin (restituable aux membres)</span>
                    </label>
                  </div>

                  {/* Plafonds aide sociale */}
                  <div className={sectionCls} style={{ background: "rgba(212,163,67,0.05)", border: "1px solid rgba(212,163,67,0.2)" }}>
                    <h3 className="text-sm font-semibold" style={{ color: "#7c2d12" }}>Plafonds d'aide sociale (FCFA)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "illness_member" as const, label: "Maladie — membre" },
                        { key: "illness_spouse" as const, label: "Maladie — conjoint" },
                        { key: "death_member" as const, label: "Décès — membre" },
                        { key: "death_spouse" as const, label: "Décès — conjoint" },
                        { key: "death_child_under5" as const, label: "Décès enfant < 5 ans" },
                        { key: "death_child_over5" as const, label: "Décès enfant ≥ 5 ans" },
                        { key: "death_parent" as const, label: "Décès parent" },
                        { key: "marriage" as const, label: "Mariage" },
                        { key: "birth" as const, label: "Naissance" },
                        { key: "birth_twins" as const, label: "Naissance (jumeaux)" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className={labelCls}>{label}</label>
                          <input type="number" min="0" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                            placeholder="0"
                            value={wizard.socialAidCaps[key]}
                            onChange={e => updateWizard("socialAidCaps", { ...wizard.socialAidCaps, [key]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sanctions */}
                  <div className={sectionCls} style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
                    <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Sanctions (FCFA)
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "late" as const, label: "Retard" },
                        { key: "absent1" as const, label: "1re absence" },
                        { key: "absent2" as const, label: "2e absence" },
                        { key: "absent3" as const, label: "3e absence" },
                        { key: "indiscipline" as const, label: "Indiscipline" },
                        { key: "missedCommission" as const, label: "Commission manquée" },
                        { key: "agNationale" as const, label: "AG Nationale" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className={labelCls}>{label}</label>
                          <input type="number" min="0" className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                            value={wizard.sanctionsConfig[key]}
                            onChange={e => updateWizard("sanctionsConfig", { ...wizard.sanctionsConfig, [key]: parseInt(e.target.value) || 0 })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compte bancaire */}
                  <div className={sectionCls} style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.1)" }}>
                    <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <Banknote className="w-4 h-4" /> Compte bancaire
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Banque</label>
                        <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          placeholder="BICEC, UBA, Ecobank…"
                          value={wizard.bankConfig.bankName}
                          onChange={e => updateWizard("bankConfig", { ...wizard.bankConfig, bankName: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>Mode de paiement</label>
                        <select className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                          value={wizard.bankConfig.paymentMode}
                          onChange={e => updateWizard("bankConfig", { ...wizard.bankConfig, paymentMode: e.target.value })}>
                          <option value="VIREMENT">Virement bancaire</option>
                          <option value="MOBILE_MONEY">Mobile Money</option>
                          <option value="CASH">Espèces</option>
                          <option value="CHEQUE">Chèque</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>RIB / Numéro de compte</label>
                      <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                        placeholder="CMXXXX-XXXXX-XXXXXXXXXX-XX"
                        value={wizard.bankConfig.rib}
                        onChange={e => updateWizard("bankConfig", { ...wizard.bankConfig, rib: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Titulaire du compte</label>
                      <input className={inputCls} style={{ border: "1px solid #e2ddd4" }}
                        placeholder="Nom de l'association ou du trésorier"
                        value={wizard.bankConfig.accountHolder}
                        onChange={e => updateWizard("bankConfig", { ...wizard.bankConfig, accountHolder: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 7: Lancement ────────────────────────────────────── */}
              {wizard.step === 7 && (
                <div className="space-y-5">
                  {/* Récapitulatif */}
                  <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(13,61,40,0.04)", border: "1px solid rgba(13,61,40,0.12)" }}>
                    <h3 className="font-semibold text-sm" style={{ color: "#0d3d28" }}>Récapitulatif</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: `${wizard.color}18` }}>
                          {ASSOC_TYPE_ICON[wizard.type]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{wizard.name}</p>
                          <p className="text-xs text-graphite">{ASSOC_TYPES.find(t => t.value === wizard.type)?.label} {wizard.region && `— ${wizard.region}`}</p>
                        </div>
                        <div className="ml-auto w-5 h-5 rounded-full flex-shrink-0" style={{ background: wizard.color }} />
                      </div>
                      {wizard.description && <p className="text-xs text-gray-600 bg-warm-white p-2 rounded-lg">{wizard.description}</p>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-warm-white rounded-lg p-2">
                        <span className="text-ash block">Template</span>
                        <span className="font-medium">{TEMPLATES[wizard.templateUsed as keyof typeof TEMPLATES]?.label || wizard.templateUsed}</span>
                      </div>
                      <div className="bg-warm-white rounded-lg p-2">
                        <span className="text-ash block">Activités</span>
                        <span className="font-medium">{wizard.activities.length} configurée(s)</span>
                      </div>
                      <div className="bg-warm-white rounded-lg p-2">
                        <span className="text-ash block">Réunions</span>
                        <span className="font-medium">{wizard.meetingConfig.frequency === "MONTHLY" ? "Mensuelles" : "Trimestrielles"} — {DAYS[wizard.meetingConfig.dayOfWeek]} {wizard.meetingConfig.hour}h</span>
                      </div>
                      <div className="bg-warm-white rounded-lg p-2">
                        <span className="text-ash block">Approbation</span>
                        <span className="font-medium">{wizard.membershipConfig.approvalProcess === "UNANIMOUS" ? "Unanime" : wizard.membershipConfig.approvalProcess === "MAJORITY" ? "Majorité" : "Automatique"}</span>
                      </div>
                      <div className="bg-warm-white rounded-lg p-2">
                        <span className="text-ash block">Parrainage</span>
                        <span className="font-medium">{wizard.membershipConfig.sponsorshipRequired ? `Requis (${wizard.membershipConfig.sponsorshipCount})` : "Non requis"}</span>
                      </div>
                      <div className="bg-warm-white rounded-lg p-2">
                        <span className="text-ash block">Quorum</span>
                        <span className="font-medium">{wizard.meetingConfig.quorumPercent}%</span>
                      </div>
                    </div>
                    {wizard.activities.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-600">Activités :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {wizard.activities.map((a, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(13,61,40,0.1)", color: "#0d3d28" }}>
                              {a.name || `Activité ${i + 1}`}
                              {a.contributionAmount && ` — ${parseInt(a.contributionAmount).toLocaleString("fr-FR")} FCFA`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Invitations */}
                  <div className="space-y-2">
                    <label className={labelCls}>
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      Inviter des membres fondateurs (email ou téléphone)
                    </label>
                    <textarea rows={3} className={inputCls} style={{ border: "1px solid #e2ddd4", resize: "none" }}
                      placeholder="membre1@email.com, +237 6xx xxx xxx, membre2@email.com…"
                      value={wizard.inviteEmails}
                      onChange={e => updateWizard("inviteEmails", e.target.value)} />
                    <p className="text-xs text-ash">Séparez les adresses par des virgules. Les invitations seront envoyées après la création.</p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl text-sm"
                    style={{ background: "rgba(212,163,67,0.08)", border: "1px solid rgba(212,163,67,0.2)" }}>
                    <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#e68a00" }} />
                    <p className="text-gray-700">
                      En cliquant sur <strong>Lancer l'association</strong>, vous serez automatiquement désigné comme fondateur et administrateur principal. Vous pourrez modifier toutes les configurations depuis les paramètres de l'association.
                    </p>
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-error/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="px-6 py-4 border-t border-stone flex gap-3 flex-shrink-0">
              {wizard.step > 1 ? (
                <button type="button" onClick={prevStep}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all hover:bg-cream"
                  style={{ borderColor: "#e2ddd4", color: "#374151" }}>
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </button>
              ) : (
                <button type="button" onClick={() => { setShowWizard(false); resetWizard(); }}
                  className="px-4 py-2.5 rounded-xl border font-medium text-sm transition-all hover:bg-cream"
                  style={{ borderColor: "#e2ddd4", color: "#374151" }}>
                  Annuler
                </button>
              )}
              <div className="flex-1" />
              {wizard.step < 7 ? (
                <button type="button" onClick={nextStep}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "#0d3d28" }}>
                  Suivant <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#e68a00" }}>
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Création en cours…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Lancer l'association
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
