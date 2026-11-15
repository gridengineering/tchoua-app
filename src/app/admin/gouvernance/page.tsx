"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, CheckCircle2, Coins, Globe2, KeyRound, Loader2, Mail,
  RefreshCw, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Users, Wallet,
} from "lucide-react";
import type { GovernanceConfig } from "@/lib/governance-types";

const TABS = [
  { id: "kyc", label: "KYC", icon: ShieldCheck },
  { id: "trust", label: "Confiance", icon: SlidersHorizontal },
  { id: "quarantine", label: "Quarantaine", icon: AlertCircle },
  { id: "email", label: "Messagerie", icon: Mail },
  { id: "wallet", label: "Wallet & paiements", icon: Wallet },
  { id: "rbac", label: "RBAC / IAM / ACL", icon: Users },
  { id: "notifications", label: "Notifications", icon: Globe2 },
  { id: "openapi", label: "OpenAPI 3.1", icon: KeyRound },
] as const;
type TabId = (typeof TABS)[number]["id"];

const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const label = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const btn = "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function setPath<T>(source: T, path: string, value: unknown): T {
  const next = clone(source);
  const parts = path.split(".");
  let cursor: any = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    cursor[key] = cursor[key] ?? {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
  return next;
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={label}>{text}</label>{children}</div>;
}

function Toggle({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        {desc && <div className="text-xs text-slate-500">{desc}</div>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-indigo-600" />
    </label>
  );
}

export default function GovernancePage() {
  const [config, setConfig] = useState<GovernanceConfig | null>(null);
  const [initial, setInitial] = useState("");
  const [tab, setTab] = useState<TabId>("kyc");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/governance", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Chargement impossible");
      setConfig(data.config);
      setInitial(JSON.stringify(data.config));
    } catch (error: any) {
      setToast({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const dirty = useMemo(() => Boolean(config) && JSON.stringify(config) !== initial, [config, initial]);
  const update = (path: string, value: unknown) => setConfig((current) => (current ? setPath(current, path, value) : current));

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/governance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible");
      setConfig(data.config);
      setInitial(JSON.stringify(data.config));
      setToast({ type: "success", message: "Gouvernance enregistrée" });
    } catch (error: any) {
      setToast({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 pb-16">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gouvernance & conformité</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Paramétrez les niveaux KYC, les restrictions financières, la confiance, la quarantaine, la messagerie,
            les moyens de paiement, le RBAC/IAM/ACL, les notifications Tchoua Mobile et le contrat OpenAPI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => setConfig(JSON.parse(initial))}><RotateCcw className="h-4 w-4" /> Annuler</button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={!dirty || saving} onClick={save}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {TABS.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${tab === item.id ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-5">
          {tab === "kyc" && (
            <>
              <Section title="Politique KYC" desc="Activez les niveaux, leurs exigences et les restrictions par opération.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle title="KYC activé" desc="Les contrôles KYC sont appliqués aux opérations configurées." checked={config.kyc.enabled} onChange={(v) => update("kyc.enabled", v)} />
                  <Toggle title="Auto-amélioration" desc="Le membre peut demander un niveau supérieur depuis son espace." checked={config.kyc.allowSelfUpgrade} onChange={(v) => update("kyc.allowSelfUpgrade", v)} />
                  <Toggle title="Consentements obligatoires" desc="Conditions, confidentialité et protection des données." checked={config.kyc.requireConsents} onChange={(v) => update("kyc.requireConsents", v)} />
                </div>
              </Section>

              <Section title="Niveaux et plafonds" desc="Chaque niveau peut être renommé et recevoir ses propres plafonds et autorisations.">
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="p-2">Niveau</th><th className="p-2">Libellé</th><th className="p-2">Approbation</th>
                      <th className="p-2">Max / transaction</th><th className="p-2">Max / jour</th><th className="p-2">Max / mois</th>
                    </tr></thead>
                    <tbody>
                      {config.kyc.levels.map((level, index) => (
                        <tr key={level.level} className="border-b border-slate-100">
                          <td className="p-2 font-bold">{level.level}</td>
                          <td className="p-2"><input className={input} value={level.label} onChange={(e) => update(`kyc.levels.${index}.label`, e.target.value)} /></td>
                          <td className="p-2"><select className={input} value={level.approval} onChange={(e) => update(`kyc.levels.${index}.approval`, e.target.value)}>
                            <option value="AUTO">Automatique</option><option value="BUREAU">Bureau</option><option value="ADMIN">Administration</option>
                          </select></td>
                          {(["maxAmountPerTx", "maxDaily", "maxMonthly"] as const).map((key) => (
                            <td className="p-2" key={key}><input type="number" className={input} value={level[key]} onChange={(e) => update(`kyc.levels.${index}.${key}`, Number(e.target.value))} /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {config.kyc.levels.map((level, index) => (
                    <div key={level.level} className="rounded-xl border border-slate-100 p-3">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{level.shortLabel} · autorisations</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(["deposit", "withdrawal", "transfer", "video", "chat", "loan", "socialAid", "joinAssociation"] as const).map((key) => (
                          <label key={key} className="flex items-center gap-2">
                            <input type="checkbox" checked={level.access[key]} onChange={(e) => update(`kyc.levels.${index}.access.${key}`, e.target.checked)} className="accent-indigo-600" />
                            {({ deposit: "Dépôt", withdrawal: "Retrait", transfer: "Virement", video: "Visio", chat: "Chat", loan: "Prêt", socialAid: "Aide", joinAssociation: "Adhésion" } as any)[key]}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <label className={label}>Exigences documentaires par niveau (séparées par des virgules)</label>
                  {config.kyc.levels.map((level, index) => (
                    <div key={level.level} className="mt-2 flex items-center gap-2">
                      <span className="w-14 text-xs font-bold">{level.shortLabel}</span>
                      <input className={input} value={level.documents.join(", ")} onChange={(e) => update(`kyc.levels.${index}.documents`, e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} placeholder="ID_DOCUMENT, PASSPORT_PHOTO, LOCATION_PROOF" />
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Seuils de montant" desc="Un montant supérieur ou égal au seuil exige le niveau indiqué.">
                {config.kyc.amountThresholds.map((threshold, index) => (
                  <div key={index} className="mb-2 grid grid-cols-[1fr_120px_40px] gap-2">
                    <input type="number" className={input} value={threshold.amount} onChange={(e) => update(`kyc.amountThresholds.${index}.amount`, Number(e.target.value))} />
                    <select className={input} value={threshold.level} onChange={(e) => update(`kyc.amountThresholds.${index}.level`, Number(e.target.value))}>
                      <option value={1}>KYC 1</option><option value={2}>KYC 2</option><option value={3}>KYC 3</option>
                    </select>
                    <button className="text-red-600" onClick={() => update("kyc.amountThresholds", config.kyc.amountThresholds.filter((_, i) => i !== index))}>×</button>
                  </div>
                ))}
                <button className={btn} onClick={() => update("kyc.amountThresholds", [...config.kyc.amountThresholds, { amount: 0, level: 1 }])}>+ Ajouter un seuil</button>
              </Section>
            </>
          )}

          {tab === "trust" && (
            <>
              <Section title="Niveaux de confiance" desc="Paliers et seuils utilisés par la gamification des associations.">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Toggle title="Confiance activée" checked={config.trust.enabled} onChange={(v) => update("trust.enabled", v)} />
                  <Toggle title="Recalcul après KYC" checked={config.trust.recalculateOnKyc} onChange={(v) => update("trust.recalculateOnKyc", v)} />
                  <Field label="Quarantaine sous le score"><input type="number" className={input} value={config.trust.quarantineBelow} onChange={(e) => update("trust.quarantineBelow", Number(e.target.value))} /></Field>
                </div>
                <div className="mt-5 space-y-2">
                  {config.trust.levels.map((level, index) => (
                    <div key={level.level} className="grid grid-cols-[60px_1fr_100px_100px] items-center gap-2">
                      <span className="text-xs font-bold">Niv. {level.level}</span>
                      <input className={input} value={level.label} onChange={(e) => update(`trust.levels.${index}.label`, e.target.value)} />
                      <input type="number" className={input} value={level.min} onChange={(e) => update(`trust.levels.${index}.min`, Number(e.target.value))} />
                      <input type="number" className={input} value={level.max} onChange={(e) => update(`trust.levels.${index}.max`, Number(e.target.value))} />
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="Critères et pondérations" desc="Modifiez les points maximum de chaque critère ; le score est normalisé sur 100.">
                <div className="space-y-2">
                  {config.trust.criteria.map((criterion, index) => (
                    <div key={criterion.key} className="grid grid-cols-[1fr_90px_80px] items-center gap-2">
                      <input className={input} value={criterion.label} onChange={(e) => update(`trust.criteria.${index}.label`, e.target.value)} />
                      <input type="number" className={input} value={criterion.max} onChange={(e) => update(`trust.criteria.${index}.max`, Number(e.target.value))} />
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={criterion.enabled} onChange={(e) => update(`trust.criteria.${index}.enabled`, e.target.checked)} /> Actif</label>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === "quarantine" && (
            <Section title="Règles de quarantaine" desc="Déclencheurs, durées et restrictions appliquées aux membres ou associations.">
              <Toggle title="Quarantaine activée" checked={config.quarantine.enabled} onChange={(v) => update("quarantine.enabled", v)} />
              <Toggle title="Motif obligatoire" checked={config.quarantine.requireReason} onChange={(v) => update("quarantine.requireReason", v)} />
              <div className="mt-4 space-y-3">
                {config.quarantine.rules.map((rule, index) => (
                  <div key={rule.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={rule.enabled} onChange={(e) => update(`quarantine.rules.${index}.enabled`, e.target.checked)} />
                      <input className={input} value={rule.label} onChange={(e) => update(`quarantine.rules.${index}.label`, e.target.value)} />
                      <span className="text-xs text-slate-400">{rule.trigger}</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <Field label="Seuil"><input type="number" className={input} value={rule.threshold} onChange={(e) => update(`quarantine.rules.${index}.threshold`, Number(e.target.value))} /></Field>
                      <Field label="Durée (jours)"><input type="number" className={input} value={rule.durationDays} onChange={(e) => update(`quarantine.rules.${index}.durationDays`, Number(e.target.value))} /></Field>
                      <div className="flex flex-wrap items-end gap-2 text-xs">
                        {(["blockLogin", "blockWallet", "blockAssociations", "blockRtc", "notify"] as const).map((key) => (
                          <label key={key} className="flex items-center gap-1"><input type="checkbox" checked={rule[key]} onChange={(e) => update(`quarantine.rules.${index}.${key}`, e.target.checked)} />{key}</label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tab === "email" && (
            <Section title="Messagerie SMTP / IMAP / POP" desc="Configuration des envois transactionnels et de la boîte de réception Tchoua.">
              <Toggle title="Messagerie activée" checked={config.email.enabled} onChange={(v) => update("email.enabled", v)} />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Field label="Nom expéditeur"><input className={input} value={config.email.fromName} onChange={(e) => update("email.fromName", e.target.value)} /></Field>
                <Field label="Email expéditeur"><input className={input} value={config.email.fromEmail} onChange={(e) => update("email.fromEmail", e.target.value)} /></Field>
                <Field label="Reply-To"><input className={input} value={config.email.replyTo} onChange={(e) => update("email.replyTo", e.target.value)} /></Field>
              </div>
              {(["smtp", "imap", "pop3"] as const).map((kind) => (
                <div key={kind} className="mt-5 rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold uppercase text-slate-700">{kind}</span>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config.email[kind].enabled} onChange={(e) => update(`email.${kind}.enabled`, e.target.checked)} /> Actif</label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Hôte"><input className={input} value={config.email[kind].host} onChange={(e) => update(`email.${kind}.host`, e.target.value)} /></Field>
                    <Field label="Port"><input type="number" className={input} value={config.email[kind].port} onChange={(e) => update(`email.${kind}.port`, Number(e.target.value))} /></Field>
                    <Field label="Utilisateur"><input className={input} value={config.email[kind].user} onChange={(e) => update(`email.${kind}.user`, e.target.value)} /></Field>
                    <Field label="Mot de passe"><input type="password" className={input} value={config.email[kind].password} onChange={(e) => update(`email.${kind}.password`, e.target.value)} /></Field>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {tab === "wallet" && (
            <>
              <Section title="Règles du Wallet" desc="Un seul wallet par membre, un wallet par association et des plafonds par niveau KYC.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle title="Wallet activé" checked={config.wallet.enabled} onChange={(v) => update("wallet.enabled", v)} />
                  <Toggle title="Un wallet par membre" checked={config.wallet.oneWalletPerMember} onChange={(v) => update("wallet.oneWalletPerMember", v)} />
                  <Toggle title="Wallet d'association" checked={config.wallet.associationWalletEnabled} onChange={(v) => update("wallet.associationWalletEnabled", v)} />
                  <Toggle title="Dépôt autorisé" checked={config.wallet.allowDeposit} onChange={(v) => update("wallet.allowDeposit", v)} />
                  <Toggle title="Retrait autorisé" checked={config.wallet.allowWithdrawal} onChange={(v) => update("wallet.allowWithdrawal", v)} />
                  <Toggle title="Virement autorisé" checked={config.wallet.allowTransfer} onChange={(v) => update("wallet.allowTransfer", v)} />
                  <Toggle title="Alimentation association" checked={config.wallet.allowAssociationFunding} onChange={(v) => update("wallet.allowAssociationFunding", v)} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[["depositMaxTx", "Dépôt max / Tx"], ["depositMaxDay", "Dépôt max / jour"], ["withdrawalMaxTx", "Retrait max / Tx"], ["withdrawalMaxDay", "Retrait max / jour"], ["transferMaxTx", "Virement max / Tx"], ["transferMaxDay", "Virement max / jour"], ["otpWithdrawalThreshold", "OTP retrait"], ["otpTransferThreshold", "OTP virement"]].map(([key, text]) => (
                    <Field key={key} label={text}><input type="number" className={input} value={(config.wallet as any)[key]} onChange={(e) => update(`wallet.${key}`, Number(e.target.value))} /></Field>
                  ))}
                </div>
              </Section>
              <Section title="Moyens de paiement" desc="Activez et paramétrez Mobile Money, cartes, PayPal, virement et espèces.">
                <div className="space-y-3">
                  {config.wallet.providers.map((provider, index) => (
                    <div key={provider.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <input type="checkbox" checked={provider.enabled} onChange={(e) => update(`wallet.providers.${index}.enabled`, e.target.checked)} />
                        <input className={input} value={provider.label} onChange={(e) => update(`wallet.providers.${index}.label`, e.target.value)} />
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{provider.type}</span>
                        <select className={`${input} max-w-[160px]`} value={provider.requiresKycLevel} onChange={(e) => update(`wallet.providers.${index}.requiresKycLevel`, Number(e.target.value))}>
                          <option value={0}>KYC 0</option><option value={1}>KYC 1</option><option value={2}>KYC 2</option><option value={3}>KYC 3</option>
                        </select>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-4">
                        <Field label="Frais %"><input type="number" step="0.1" className={input} value={provider.feePct} onChange={(e) => update(`wallet.providers.${index}.feePct`, Number(e.target.value))} /></Field>
                        <Field label="Frais fixe"><input type="number" className={input} value={provider.feeFixed} onChange={(e) => update(`wallet.providers.${index}.feeFixed`, Number(e.target.value))} /></Field>
                        <Field label="Min"><input type="number" className={input} value={provider.min} onChange={(e) => update(`wallet.providers.${index}.min`, Number(e.target.value))} /></Field>
                        <Field label="Max"><input type="number" className={input} value={provider.max} onChange={(e) => update(`wallet.providers.${index}.max`, Number(e.target.value))} /></Field>
                      </div>
                      <div className="mt-2"><Field label="Instructions"><input className={input} value={provider.instructions} onChange={(e) => update(`wallet.providers.${index}.instructions`, e.target.value)} /></Field></div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === "rbac" && (
            <Section title="RBAC / IAM / ACL" desc="Les rôles détaillés se gèrent aussi dans Rôles & permissions ; cette matrice définit la politique globale.">
              <div className="flex flex-wrap items-center gap-3">
                <Toggle title="RBAC activé" checked={config.rbac.enabled} onChange={(v) => update("rbac.enabled", v)} />
                <Toggle title="Refus par défaut" checked={config.rbac.defaultDeny} onChange={(v) => update("rbac.defaultDeny", v)} />
                <Link href="/admin/roles" className={btn}>Gérer les rôles détaillés</Link>
              </div>
              <div className="mt-4">
                <Field label="Rôles système (séparés par des virgules)"><input className={input} value={config.rbac.roles.join(", ")} onChange={(e) => update("rbac.roles", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} /></Field>
              </div>
              <div className="mt-5 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-500">ACL par ressource</div>
                {config.rbac.acl.map((rule, index) => (
                  <div key={rule.id} className="grid gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-[1fr_1fr_1fr_32px]">
                    <input className={input} value={rule.resource} onChange={(e) => update(`rbac.acl.${index}.resource`, e.target.value)} />
                    <input className={input} value={rule.actions.join(", ")} onChange={(e) => update(`rbac.acl.${index}.actions`, e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} placeholder="READ, UPDATE" />
                    <input className={input} value={rule.roles.join(", ")} onChange={(e) => update(`rbac.acl.${index}.roles`, e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} placeholder="Administrateur" />
                    <button className="text-red-600" onClick={() => update("rbac.acl", config.rbac.acl.filter((_, i) => i !== index))}>×</button>
                  </div>
                ))}
                <button className={btn} onClick={() => update("rbac.acl", [...config.rbac.acl, { id: `acl-${Date.now()}`, resource: "RESOURCE", actions: ["READ"], roles: ["Administrateur"], description: "" }])}>+ Règle ACL</button>
              </div>
              <div className="mt-5 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-500">Politiques IAM</div>
                {config.rbac.iamPolicies.map((policy, index) => (
                  <div key={policy.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="grid gap-2 sm:grid-cols-4">
                      <input className={input} value={policy.name} onChange={(e) => update(`rbac.iamPolicies.${index}.name`, e.target.value)} />
                      <input className={input} value={policy.subject} onChange={(e) => update(`rbac.iamPolicies.${index}.subject`, e.target.value)} />
                      <input className={input} value={policy.resource} onChange={(e) => update(`rbac.iamPolicies.${index}.resource`, e.target.value)} />
                      <select className={input} value={policy.effect} onChange={(e) => update(`rbac.iamPolicies.${index}.effect`, e.target.value)}><option value="ALLOW">ALLOW</option><option value="DENY">DENY</option></select>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tab === "notifications" && (
            <Section title="Notifications Tchoua Mobile" desc="Chaque événement peut être diffusé dans le chat, la visio, TURN, l'e-mail ou l'application.">
              <Toggle title="Notifications activées" checked={config.notifications.enabled} onChange={(v) => update("notifications.enabled", v)} />
              <div className="mt-3">
                <Field label="Nom de l'application mobile"><input className={input} value={config.notifications.mobileAppName} onChange={(e) => update("notifications.mobileAppName", e.target.value)} /></Field>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500"><th className="p-2">Événement</th><th className="p-2">Actif</th><th className="p-2">Canaux</th></tr></thead>
                  <tbody>
                    {config.notifications.events.map((event, index) => (
                      <tr key={event.key} className="border-b border-slate-100">
                        <td className="p-2"><input className={input} value={event.label} onChange={(e) => update(`notifications.events.${index}.label`, e.target.value)} /></td>
                        <td className="p-2"><input type="checkbox" checked={event.enabled} onChange={(e) => update(`notifications.events.${index}.enabled`, e.target.checked)} /></td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {(["IN_APP", "CHAT", "MEET", "TURN", "EMAIL"] as const).map((channel) => (
                              <label key={channel} className="flex items-center gap-1">
                                <input type="checkbox" checked={event.channels.includes(channel)} onChange={(e) => {
                                  const channels = e.target.checked ? [...event.channels, channel] : event.channels.filter((c) => c !== channel);
                                  update(`notifications.events.${index}.channels`, channels);
                                }} /> {channel}
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {tab === "openapi" && (
            <Section title="Contrat OpenAPI 3.1" desc="Les partenaires et fintechs peuvent consommer les APIs Tchoua via un contrat documenté.">
              <Toggle title="API externe activée" checked={config.openapi.enabled} onChange={(v) => update("openapi.enabled", v)} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Titre"><input className={input} value={config.openapi.title} onChange={(e) => update("openapi.title", e.target.value)} /></Field>
                <Field label="Version"><input className={input} value={config.openapi.version} readOnly /></Field>
                <Field label="URL de base"><input className={input} value={config.openapi.baseUrl} onChange={(e) => update("openapi.baseUrl", e.target.value)} /></Field>
                <Field label="Authentification"><select className={input} value={config.openapi.auth} onChange={(e) => update("openapi.auth", e.target.value)}><option value="NONE">Aucune</option><option value="API_KEY">API Key</option><option value="OAUTH2">OAuth 2</option></select></Field>
                <Field label="En-tête API Key"><input className={input} value={config.openapi.apiKeyHeader} onChange={(e) => update("openapi.apiKeyHeader", e.target.value)} /></Field>
                <Field label="Email contact"><input className={input} value={config.openapi.contactEmail} onChange={(e) => update("openapi.contactEmail", e.target.value)} /></Field>
              </div>
              <div className="mt-3"><Field label="Description"><textarea className={`${input} min-h-[80px]`} value={config.openapi.description} onChange={(e) => update("openapi.description", e.target.value)} /></Field></div>
              <div className="mt-3"><Field label="Scopes (virgules)"><input className={input} value={config.openapi.scopes.join(", ")} onChange={(e) => update("openapi.scopes", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} /></Field></div>
              <a href="/api/openapi.json" target="_blank" rel="noreferrer" className={`${btn} mt-4`}>Voir le contrat OpenAPI JSON</a>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
