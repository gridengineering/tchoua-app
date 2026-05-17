"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle, Trash2, Check, Shield, Plus, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PERMISSIONS, ALL_PERMISSIONS, type Permission } from "@/lib/permissions";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "SOLIDARITY_OFFICER"];
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

type Person = { name: string; email: string; phone: string };
type BureauConfig = {
  president: Person; vicePresident: Person; secretaireGeneral: Person;
  secretairesAdjoints: Person[]; tresorier: Person; tresorierAdjoint: Person;
  responsableSolidarite: Person; responsableNature: Person;
  commissaires: Person[]; censeurs: Person[]; conseillers: Person[];
};
type MembershipConfig = {
  ageMin: string; sponsorshipRequired: boolean; sponsorshipCount: number;
  admissionFee: string; approvalProcess: "UNANIMOUS" | "MAJORITY" | "AUTO"; waitingPeriod: string;
};
type MeetingConfig = { frequency: "MONTHLY" | "QUARTERLY"; dayOfWeek: number; hour: number; quorumPercent: number };
type SocialAidCaps = {
  illness_member: string; illness_spouse: string; death_member: string; death_spouse: string;
  death_child_under5: string; death_child_over5: string; death_parent: string;
  marriage: string; birth: string; birth_twins: string;
};
type SanctionsConfig = {
  late: number; absent1: number; absent2: number; absent3: number;
  indiscipline: number; missedCommission: number; agNationale: number;
};
type BankConfig = { bankName: string; rib: string; accountHolder: string; paymentMode: string };

type Association = {
  id: string; name: string; description: string | null; type: string; status: string;
  isPublic: boolean; color: string; logo: string | null; region: string | null;
  website: string | null; email: string | null; phone: string | null;
  reglementHtml: string | null; reglementUrl: string | null;
  bureauConfig: string | null; membershipConfig: string | null; meetingConfig: string | null;
  socialAidCaps: string | null; sanctionsConfig: string | null; bankConfig: string | null;
  parentId: string | null; parentSubscriptionFee: number | null;
  regulations: { id?: string; title: string | null; content: string }[];
};

const emptyPerson = (): Person => ({ name: "", email: "", phone: "" });
const emptyBureau = (): BureauConfig => ({
  president: emptyPerson(), vicePresident: emptyPerson(), secretaireGeneral: emptyPerson(),
  secretairesAdjoints: [], tresorier: emptyPerson(), tresorierAdjoint: emptyPerson(),
  responsableSolidarite: emptyPerson(), responsableNature: emptyPerson(),
  commissaires: [], censeurs: [], conseillers: [],
});
const emptyMembership = (): MembershipConfig => ({
  ageMin: "", sponsorshipRequired: false, sponsorshipCount: 1,
  admissionFee: "", approvalProcess: "MAJORITY", waitingPeriod: "",
});
const emptyMeeting = (): MeetingConfig => ({ frequency: "MONTHLY", dayOfWeek: 6, hour: 15, quorumPercent: 60 });
const emptyAids = (): SocialAidCaps => ({
  illness_member: "", illness_spouse: "", death_member: "", death_spouse: "",
  death_child_under5: "", death_child_over5: "", death_parent: "",
  marriage: "", birth: "", birth_twins: "",
});
const emptySanctions = (): SanctionsConfig => ({
  late: 500, absent1: 1000, absent2: 3000, absent3: 5000,
  indiscipline: 3000, missedCommission: 5000, agNationale: 20000,
});
const emptyBank = (): BankConfig => ({ bankName: "", rib: "", accountHolder: "", paymentMode: "VIREMENT" });

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return { ...fallback, ...JSON.parse(raw) } as T; } catch { return fallback; }
}

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]";
const inputStyle = { border: "1px solid #e2ddd4", background: "white" } as const;
const labelCls = "text-xs font-semibold text-graphite uppercase tracking-wide mb-1 block";

export default function ParametresPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [assoc, setAssoc] = useState<Association | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    fetch(`/api/associations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setAssoc(d.association);
        setMyRole(d.myRole);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const isBureau = myRole !== null && BUREAU_ROLES.includes(myRole);

  const patch = useCallback(async (data: Record<string, unknown>) => {
    const r = await fetch(`/api/associations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur");
    }
    reload();
  }, [id, reload]);

  const dissolve = async () => {
    if (!confirm("Dissoudre définitivement l'association ? Cette action est irréversible.")) return;
    const r = await fetch(`/api/associations/${id}`, { method: "DELETE" });
    if (r.ok) router.push("/associations");
    else alert("Erreur lors de la dissolution");
  };

  if (loading) {
    return (
      <DashboardLayout title="Paramètres">
        <div className="p-8 text-center text-ash">Chargement...</div>
      </DashboardLayout>
    );
  }

  if (!assoc) {
    return (
      <DashboardLayout title="Paramètres">
        <div className="p-8 text-center text-graphite">Association introuvable</div>
      </DashboardLayout>
    );
  }

  if (!isBureau) {
    return (
      <DashboardLayout title="Paramètres">
        <div className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold mb-1">Accès réservé au bureau</p>
          <p className="text-sm text-graphite mb-4">Seuls les membres du bureau peuvent modifier les paramètres.</p>
          <Link href={`/associations/${id}`} className="text-sm font-semibold text-[#0d3d28] hover:underline">
            ← Retour à l&apos;association
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Paramètres — ${assoc.name}`}>
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/associations/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#0d3d28]"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
        </div>

        <IdentitySection assoc={assoc} onSave={patch} />
        <HierarchieSection assoc={assoc} onSave={patch} />
        <ContactSection assoc={assoc} onSave={patch} />
        <ReglementSection assoc={assoc} onSave={patch} />
        <BureauSection assoc={assoc} onSave={patch} />
        <MembershipSection assoc={assoc} onSave={patch} />
        <MeetingSection assoc={assoc} onSave={patch} />
        <SocialAidsSection assoc={assoc} onSave={patch} />
        <SanctionsSection assoc={assoc} onSave={patch} />
        <BankSection assoc={assoc} onSave={patch} />
        <CustomRolesSection associationId={id} />

        {(myRole === "PRESIDENT" || myRole === "FOUNDER") && (
          <DangerZone onDissolve={dissolve} />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Section shell ─────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  dirty,
  saving,
  onSave,
  children,
}: {
  title: string;
  description?: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  children: ReactNode;
}) {
  const [justSaved, setJustSaved] = useState(false);
  return (
    <section className="bg-warm-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-graphite mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={async () => {
            await onSave();
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: justSaved ? "#16a34a" : dirty ? "#0d3d28" : "#f3f4f6",
            color: justSaved || dirty ? "white" : "#9ca3af",
          }}
        >
          {justSaved ? <><Check className="w-3.5 h-3.5" /> Enregistré</> : <><Save className="w-3.5 h-3.5" /> Enregistrer</>}
        </button>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </section>
  );
}

function useSection<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [base, setBase] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValue(initial); setBase(initial); }, [JSON.stringify(initial)]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(value) !== JSON.stringify(base);
  return { value, setValue, dirty, saving, setSaving };
}

// ─── Sections ──────────────────────────────────────────────────────────────

function IdentitySection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = {
    name: assoc.name, description: assoc.description ?? "", type: assoc.type,
    status: assoc.status, isPublic: assoc.isPublic, color: assoc.color, region: assoc.region ?? "",
  };
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave(s.value); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Identité" description="Nom, description, type et statut" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nom</label>
          <input className={inputCls} style={inputStyle} value={s.value.name}
            onChange={(e) => s.setValue({ ...s.value, name: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Région</label>
          <input className={inputCls} style={inputStyle} value={s.value.region}
            onChange={(e) => s.setValue({ ...s.value, region: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} style={inputStyle} rows={3} value={s.value.description}
            onChange={(e) => s.setValue({ ...s.value, description: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} style={inputStyle} value={s.value.type}
            onChange={(e) => s.setValue({ ...s.value, type: e.target.value })}>
            <option value="TONTINE_CLUB">Club de tontine</option>
            <option value="COOPERATIVE">Coopérative</option>
            <option value="SOLIDARITY">Solidarité</option>
            <option value="INVESTMENT">Investissement</option>
            <option value="AGRICULTURAL">Agricole</option>
            <option value="MUTUAL">Mutuelle</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} style={inputStyle} value={s.value.status}
            onChange={(e) => s.setValue({ ...s.value, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspendue</option>
            <option value="DISSOLVED">Dissoute</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Couleur</label>
          <input type="color" className="w-full h-10 rounded-lg border" style={{ borderColor: "#e2ddd4" }}
            value={s.value.color} onChange={(e) => s.setValue({ ...s.value, color: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" className="w-4 h-4 accent-[#0d3d28]" checked={s.value.isPublic}
            onChange={(e) => s.setValue({ ...s.value, isPublic: e.target.checked })} />
          <span className="text-sm text-gray-700">Association publique (visible sans invitation)</span>
        </label>
      </div>
    </SectionCard>
  );
}

function ContactSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = { logo: assoc.logo ?? "", website: assoc.website ?? "", email: assoc.email ?? "", phone: assoc.phone ?? "" };
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave(s.value); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Contact & logo" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className={labelCls}>URL du logo</label>
          <input className={inputCls} style={inputStyle} value={s.value.logo}
            onChange={(e) => s.setValue({ ...s.value, logo: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className={labelCls}>Site web</label>
          <input className={inputCls} style={inputStyle} value={s.value.website}
            onChange={(e) => s.setValue({ ...s.value, website: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={inputCls} style={inputStyle} value={s.value.email}
            onChange={(e) => s.setValue({ ...s.value, email: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input className={inputCls} style={inputStyle} value={s.value.phone}
            onChange={(e) => s.setValue({ ...s.value, phone: e.target.value })} />
        </div>
      </div>
    </SectionCard>
  );
}

function ReglementSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = { regulations: assoc.regulations ?? [] };
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave(s.value); } finally { s.setSaving(false); }
  };

  const addArticle = () => s.setValue({ ...s.value, regulations: [...s.value.regulations, { title: `Article ${s.value.regulations.length + 1}`, content: "" }] });
  const updateArticle = (i: number, field: string, val: string) => {
    const r = [...s.value.regulations];
    r[i] = { ...r[i], [field]: val };
    s.setValue({ ...s.value, regulations: r });
  };
  const removeArticle = (i: number) => {
    s.setValue({ ...s.value, regulations: s.value.regulations.filter((_, idx) => idx !== i) });
  };

  return (
    <SectionCard title="Règlement intérieur (Articles)" description="Définissez les règles article par article" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="space-y-4">
        {s.value.regulations.map((reg, i) => (
          <div key={i} className="p-3 bg-cream border border-gray-200 rounded-xl relative group">
            <div className="flex justify-between items-center mb-2">
              <input className="font-bold text-sm bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                value={reg.title ?? ""} onChange={(e) => updateArticle(i, "title", e.target.value)} placeholder="Titre de l'article" />
              <button aria-label="Supprimer" onClick={() => removeArticle(i)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
            </div>
            <textarea className="w-full bg-warm-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none min-h-[60px]"
              value={reg.content} onChange={(e) => updateArticle(i, "content", e.target.value)} placeholder="Contenu de l'article" />
          </div>
        ))}
        <button onClick={addArticle} className="text-xs px-3 py-2 rounded-lg font-medium text-[#0d3d28] bg-forest/10 w-full text-center hover:bg-forest/20 transition-colors">+ Ajouter un article</button>
      </div>
    </SectionCard>
  );
}

function HierarchieSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = { parentId: assoc.parentId ?? "", parentSubscriptionFee: assoc.parentSubscriptionFee ?? "" };
  const s = useSection(init);
  const [parents, setParents] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    fetch("/api/associations").then(r => r.json()).then(d => {
      if(d.associations) setParents(d.associations.filter((a: any) => a.id !== assoc.id).map((a: any) => ({id: a.id, name: a.name})));
    });
  }, [assoc.id]);

  const save = async () => {
    s.setSaving(true);
    try { await onSave(s.value); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Hiérarchie" description="Rattachement à une association parente" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Association Parente</label>
          <select className={inputCls} style={inputStyle} value={s.value.parentId}
            onChange={(e) => s.setValue({ ...s.value, parentId: e.target.value })}>
            <option value="">Indépendante</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {s.value.parentId && (
          <div>
            <label className={labelCls}>Frais de souscription parent (FCFA)</label>
            <input type="number" className={inputCls} style={inputStyle} value={s.value.parentSubscriptionFee}
              onChange={(e) => s.setValue({ ...s.value, parentSubscriptionFee: e.target.value })} />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function PersonRow({ label, value, onChange }: { label: string; value: Person; onChange: (p: Person) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
      <div className="md:col-span-1">
        <label className={labelCls}>{label}</label>
        <input className={inputCls} style={inputStyle} placeholder="Nom" value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </div>
      <input className={inputCls} style={inputStyle} placeholder="Email" value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })} />
      <input className={inputCls} style={inputStyle} placeholder="Téléphone" value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      <span className="hidden md:block" />
    </div>
  );
}

function MultiPerson({ label, items, onChange }: { label: string; items: Person[]; onChange: (arr: Person[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={labelCls}>{label}</span>
        <button type="button" className="text-xs px-2 py-1 rounded-lg font-medium text-[#0d3d28] bg-forest/10"
          onClick={() => onChange([...items, emptyPerson()])}>+ Ajouter</button>
      </div>
      {items.length === 0 && <p className="text-xs text-ash italic">Aucun</p>}
      {items.map((p, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className={inputCls} style={inputStyle} placeholder="Nom" value={p.name}
            onChange={(e) => onChange(items.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} />
          <input className={inputCls} style={inputStyle} placeholder="Email" value={p.email}
            onChange={(e) => onChange(items.map((x, k) => k === i ? { ...x, email: e.target.value } : x))} />
          <input className={inputCls} style={inputStyle} placeholder="Téléphone" value={p.phone}
            onChange={(e) => onChange(items.map((x, k) => k === i ? { ...x, phone: e.target.value } : x))} />
          <button type="button" className="text-xs text-red-600 hover:underline"
            onClick={() => onChange(items.filter((_, k) => k !== i))}>Supprimer</button>
        </div>
      ))}
    </div>
  );
}

function BureauSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = parseJson<BureauConfig>(assoc.bureauConfig, emptyBureau());
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave({ bureauConfig: s.value }); } finally { s.setSaving(false); }
  };
  const set = (patch: Partial<BureauConfig>) => s.setValue({ ...s.value, ...patch });
  return (
    <SectionCard title="Bureau" description="Membres dirigeants" dirty={s.dirty} saving={s.saving} onSave={save}>
      <PersonRow label="Président(e)" value={s.value.president} onChange={(v) => set({ president: v })} />
      <PersonRow label="Vice-président(e)" value={s.value.vicePresident} onChange={(v) => set({ vicePresident: v })} />
      <PersonRow label="Secrétaire général(e)" value={s.value.secretaireGeneral} onChange={(v) => set({ secretaireGeneral: v })} />
      <MultiPerson label="Secrétaires adjoint(e)s" items={s.value.secretairesAdjoints}
        onChange={(arr) => set({ secretairesAdjoints: arr })} />
      <PersonRow label="Trésorier(ère)" value={s.value.tresorier} onChange={(v) => set({ tresorier: v })} />
      <PersonRow label="Trésorier(ère) adjoint(e)" value={s.value.tresorierAdjoint} onChange={(v) => set({ tresorierAdjoint: v })} />
      <PersonRow label="Resp. solidarité" value={s.value.responsableSolidarite} onChange={(v) => set({ responsableSolidarite: v })} />
      <PersonRow label="Resp. nature" value={s.value.responsableNature} onChange={(v) => set({ responsableNature: v })} />
      <MultiPerson label="Commissaires aux comptes" items={s.value.commissaires} onChange={(arr) => set({ commissaires: arr })} />
      <MultiPerson label="Censeurs" items={s.value.censeurs} onChange={(arr) => set({ censeurs: arr })} />
      <MultiPerson label="Conseillers" items={s.value.conseillers} onChange={(arr) => set({ conseillers: arr })} />
    </SectionCard>
  );
}

function MembershipSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = parseJson<MembershipConfig>(assoc.membershipConfig, emptyMembership());
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave({ membershipConfig: s.value }); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Adhésion" description="Conditions d'admission" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Âge minimum</label>
          <input type="number" className={inputCls} style={inputStyle} value={s.value.ageMin}
            onChange={(e) => s.setValue({ ...s.value, ageMin: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Délai d&apos;attente (jours)</label>
          <input type="number" className={inputCls} style={inputStyle} value={s.value.waitingPeriod}
            onChange={(e) => s.setValue({ ...s.value, waitingPeriod: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Frais d&apos;admission</label>
          <input type="number" className={inputCls} style={inputStyle} value={s.value.admissionFee}
            onChange={(e) => s.setValue({ ...s.value, admissionFee: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Processus d&apos;approbation</label>
          <select className={inputCls} style={inputStyle} value={s.value.approvalProcess}
            onChange={(e) => s.setValue({ ...s.value, approvalProcess: e.target.value as MembershipConfig["approvalProcess"] })}>
            <option value="UNANIMOUS">Unanimité</option>
            <option value="MAJORITY">Majorité</option>
            <option value="AUTO">Automatique</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4 accent-[#0d3d28]" checked={s.value.sponsorshipRequired}
            onChange={(e) => s.setValue({ ...s.value, sponsorshipRequired: e.target.checked })} />
          <span className="text-sm text-gray-700">Parrainage obligatoire</span>
        </label>
        {s.value.sponsorshipRequired && (
          <div>
            <label className={labelCls}>Nombre de parrains</label>
            <input type="number" min={1} max={10} className={inputCls} style={inputStyle} value={s.value.sponsorshipCount}
              onChange={(e) => s.setValue({ ...s.value, sponsorshipCount: parseInt(e.target.value) || 1 })} />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function MeetingSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = parseJson<MeetingConfig>(assoc.meetingConfig, emptyMeeting());
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave({ meetingConfig: s.value }); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Réunions" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>Fréquence</label>
          <select className={inputCls} style={inputStyle} value={s.value.frequency}
            onChange={(e) => s.setValue({ ...s.value, frequency: e.target.value as MeetingConfig["frequency"] })}>
            <option value="MONTHLY">Mensuelle</option>
            <option value="QUARTERLY">Trimestrielle</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Jour</label>
          <select className={inputCls} style={inputStyle} value={s.value.dayOfWeek}
            onChange={(e) => s.setValue({ ...s.value, dayOfWeek: parseInt(e.target.value) })}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Heure</label>
          <input type="number" min={6} max={22} className={inputCls} style={inputStyle} value={s.value.hour}
            onChange={(e) => s.setValue({ ...s.value, hour: parseInt(e.target.value) || 15 })} />
        </div>
        <div>
          <label className={labelCls}>Quorum (%)</label>
          <input type="number" min={1} max={100} className={inputCls} style={inputStyle} value={s.value.quorumPercent}
            onChange={(e) => s.setValue({ ...s.value, quorumPercent: parseInt(e.target.value) || 60 })} />
        </div>
      </div>
    </SectionCard>
  );
}

const AID_LABELS: { key: keyof SocialAidCaps; label: string }[] = [
  { key: "illness_member", label: "Maladie membre" },
  { key: "illness_spouse", label: "Maladie conjoint" },
  { key: "death_member", label: "Décès membre" },
  { key: "death_spouse", label: "Décès conjoint" },
  { key: "death_child_under5", label: "Décès enfant <5 ans" },
  { key: "death_child_over5", label: "Décès enfant >5 ans" },
  { key: "death_parent", label: "Décès parent" },
  { key: "marriage", label: "Mariage" },
  { key: "birth", label: "Naissance" },
  { key: "birth_twins", label: "Naissance jumeaux" },
];

function SocialAidsSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = parseJson<SocialAidCaps>(assoc.socialAidCaps, emptyAids());
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave({ socialAidCaps: s.value }); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Plafonds des aides sociales" description="Montants maximaux par catégorie" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AID_LABELS.map(({ key, label }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <input type="number" className={inputCls} style={inputStyle} value={s.value[key]}
              onChange={(e) => s.setValue({ ...s.value, [key]: e.target.value })} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const SANCTION_LABELS: { key: keyof SanctionsConfig; label: string }[] = [
  { key: "late", label: "Retard" },
  { key: "absent1", label: "Absence (1ère)" },
  { key: "absent2", label: "Absence (2ème)" },
  { key: "absent3", label: "Absence (3ème)" },
  { key: "indiscipline", label: "Indiscipline" },
  { key: "missedCommission", label: "Commission manquée" },
  { key: "agNationale", label: "AG nationale ratée" },
];

function SanctionsSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = parseJson<SanctionsConfig>(assoc.sanctionsConfig, emptySanctions());
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave({ sanctionsConfig: s.value }); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Sanctions" description="Pénalités financières" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SANCTION_LABELS.map(({ key, label }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <input type="number" className={inputCls} style={inputStyle} value={s.value[key]}
              onChange={(e) => s.setValue({ ...s.value, [key]: parseInt(e.target.value) || 0 })} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function BankSection({ assoc, onSave }: { assoc: Association; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const init = parseJson<BankConfig>(assoc.bankConfig, emptyBank());
  const s = useSection(init);
  const save = async () => {
    s.setSaving(true);
    try { await onSave({ bankConfig: s.value }); } finally { s.setSaving(false); }
  };
  return (
    <SectionCard title="Banque" dirty={s.dirty} saving={s.saving} onSave={save}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Banque</label>
          <input className={inputCls} style={inputStyle} value={s.value.bankName}
            onChange={(e) => s.setValue({ ...s.value, bankName: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Titulaire</label>
          <input className={inputCls} style={inputStyle} value={s.value.accountHolder}
            onChange={(e) => s.setValue({ ...s.value, accountHolder: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>RIB / IBAN</label>
          <input className={inputCls} style={inputStyle} value={s.value.rib}
            onChange={(e) => s.setValue({ ...s.value, rib: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Mode de paiement par défaut</label>
          <select className={inputCls} style={inputStyle} value={s.value.paymentMode}
            onChange={(e) => s.setValue({ ...s.value, paymentMode: e.target.value })}>
            <option value="VIREMENT">Virement</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CASH">Espèces</option>
            <option value="CHEQUE">Chèque</option>
          </select>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Custom roles management ──────────────────────────────────────────────

type CustomRole = {
  id: string;
  name: string;
  color: string;
  permissions: string;
};

function parsePerms(json: string): Permission[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((p): p is Permission => p in PERMISSIONS) : [];
  } catch { return []; }
}

function CustomRolesSection({ associationId }: { associationId: string }) {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [editing, setEditing] = useState<CustomRole | "new" | null>(null);

  const reload = useCallback(() => {
    fetch(`/api/associations/${associationId}/roles`)
      .then((r) => r.json())
      .then((d) => setRoles(d.roles ?? []));
  }, [associationId]);

  useEffect(() => { reload(); }, [reload]);

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce rôle ? Les membres concernés seront détachés.")) return;
    await fetch(`/api/associations/${associationId}/roles/${id}`, { method: "DELETE" });
    reload();
  };

  return (
    <section className="bg-warm-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Rôles personnalisés
          </h3>
          <p className="text-xs text-graphite mt-0.5">Définissez des rôles avec permissions sur mesure</p>
        </div>
        <button type="button" onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-forest">
          <Plus className="w-3.5 h-3.5" /> Nouveau rôle
        </button>
      </div>
      <div className="p-5 space-y-2">
        {roles.length === 0 && (
          <p className="text-sm text-ash italic">Aucun rôle personnalisé. Cliquez sur "Nouveau rôle".</p>
        )}
        {roles.map((r) => {
          const perms = parsePerms(r.permissions);
          return (
            <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border" style={{ borderColor: "#e2ddd4" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                  <span className="font-semibold text-sm text-gray-900">{r.name}</span>
                  <span className="text-xs text-ash">({perms.length} permission{perms.length > 1 ? "s" : ""})</span>
                </div>
                <p className="text-xs text-graphite line-clamp-2">
                  {perms.length === 0 ? "Aucune permission" : perms.map((p) => PERMISSIONS[p]).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setEditing(r)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-cream text-gray-700">Éditer</button>
                <button type="button" onClick={() => remove(r.id)}
                  className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-error/10 text-red-600">Supprimer</button>
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <RoleEditorModal
          associationId={associationId}
          role={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </section>
  );
}

function RoleEditorModal({
  associationId,
  role,
  onClose,
  onSaved,
}: {
  associationId: string;
  role: CustomRole | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [color, setColor] = useState(role?.color ?? "#0d3d28");
  const [perms, setPerms] = useState<Permission[]>(role ? parsePerms(role.permissions) : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePerm = (p: Permission) => {
    setPerms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
  };

  const save = async () => {
    if (!name.trim()) { setError("Nom requis"); return; }
    setSaving(true);
    setError(null);
    const url = role
      ? `/api/associations/${associationId}/roles/${role.id}`
      : `/api/associations/${associationId}/roles`;
    const r = await fetch(url, {
      method: role ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, permissions: perms }),
    });
    setSaving(false);
    if (r.ok) onSaved();
    else {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-warm-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-stone flex items-center justify-between">
          <h3 className="text-base font-bold">{role ? "Éditer le rôle" : "Nouveau rôle"}</h3>
          <button aria-label="Fermer" onClick={onClose} className="text-ash hover:text-gray-700"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Nom</label>
              <input className={inputCls} style={inputStyle} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="ex: Trésorier-adjoint" />
            </div>
            <div>
              <label className={labelCls}>Couleur</label>
              <input type="color" className="w-full h-10 rounded-lg border" style={{ borderColor: "#e2ddd4" }}
                value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Permissions</label>
            <div className="space-y-1.5 max-h-72 overflow-y-auto p-3 rounded-lg border" style={{ borderColor: "#e2ddd4" }}>
              {ALL_PERMISSIONS.map((p) => (
                <label key={p} className="flex items-start gap-2 cursor-pointer hover:bg-cream p-1 rounded">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#0d3d28]"
                    checked={perms.includes(p)} onChange={() => togglePerm(p)} />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{PERMISSIONS[p]}</span>
                    <span className="text-xs text-ash ml-2">{p}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="px-5 py-3 border-t border-stone flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-cream">Annuler</button>
          <button onClick={save} disabled={saving}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-forest disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DangerZone({ onDissolve }: { onDissolve: () => void }) {
  return (
    <section className="bg-warm-white rounded-xl border-2 border-red-200 overflow-hidden">
      <div className="px-5 py-3 bg-error/10 border-b border-red-200">
        <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Zone de danger
        </h3>
        <p className="text-xs text-red-600 mt-0.5">Réservé au président ou fondateur</p>
      </div>
      <div className="p-5">
        <button type="button" onClick={onDissolve}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700">
          <Trash2 className="w-4 h-4" /> Dissoudre l&apos;association
        </button>
      </div>
    </section>
  );
}
