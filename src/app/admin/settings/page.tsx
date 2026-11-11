"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Bell, CheckCircle2, Cloud, Coins, Download, Globe, Layout,
  Lock, RefreshCw, RotateCcw, Save, Settings2, ShieldCheck, Sliders, Sparkles,
  ToggleLeft, ToggleRight, Wrench,
} from "lucide-react";
import { PlatformSettings } from "@/lib/platform-settings-shared";

const TABS = [
  { id: "general", label: "Identité", icon: Layout },
  { id: "localization", label: "Localisation", icon: Globe },
  { id: "access", label: "Accès & sécurité", icon: Lock },
  { id: "limits", label: "Limites & finances", icon: Coins },
  { id: "features", label: "Fonctionnalités", icon: Sparkles },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
] as const;

type TabId = (typeof TABS)[number]["id"];

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
];

const TIMEZONES = [
  "Africa/Douala",
  "Africa/Lagos",
  "Africa/Abidjan",
  "Africa/Nairobi",
  "Europe/Paris",
  "UTC",
];

const featureLabels: Array<{ key: keyof PlatformSettings["features"]; title: string; desc: string }> = [
  { key: "marketplace", title: "Marketplace", desc: "Achats groupés et échanges entre membres" },
  { key: "academy", title: "Académie", desc: "Formations et contenus pédagogiques" },
  { key: "chat", title: "Chat de groupe", desc: "Messagerie par association" },
  { key: "ai", title: "Conseils IA", desc: "Assistant et recommandations" },
  { key: "gamification", title: "Gamification", desc: "Points, badges et niveaux" },
  { key: "events", title: "Événements", desc: "Sorties et rencontres communautaires" },
  { key: "templates", title: "Bibliothèque de modèles", desc: "Création d'associations depuis un modèle" },
];

function setDeep(obj: any, path: string, value: any) {
  const parts = path.split(".");
  const clone = { ...obj };
  let cursor = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    cursor[parts[i]] = { ...(cursor[parts[i]] ?? {}) };
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
  return clone;
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [initial, setInitial] = useState("");
  const [meta, setMeta] = useState<{ updatedAt: string | null; updatedBy: string | null } | null>(null);
  const [tab, setTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      setSettings(data.settings);
      setInitial(JSON.stringify(data.settings));
      setMeta(data.meta ?? null);
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const dirty = useMemo(
    () => Boolean(settings) && JSON.stringify(settings) !== initial,
    [settings, initial]
  );

  const update = (path: string, value: any) =>
    setSettings((current) => (current ? setDeep(current, path, value) : current));

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      setSettings(data.settings);
      setInitial(JSON.stringify(data.settings));
      setToast({ message: "Paramètres enregistrés", type: "success" });
      load();
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Réinitialiser tous les paramètres aux valeurs par défaut ?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Réinitialisation impossible");
      setSettings(data.settings);
      setInitial(JSON.stringify(data.settings));
      setToast({ message: "Paramètres réinitialisés", type: "success" });
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const exportConfig = () => {
    if (!settings) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tchoua-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !settings) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="text-sm font-medium text-red-700">Impossible de charger les paramètres.</p>
        <button onClick={load} className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paramètres de la plateforme</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configuration globale : identité, accès, limites, fonctionnalités et maintenance.
            {meta?.updatedAt && (
              <span className="ml-1 text-slate-400">
                Dernière mise à jour : {new Date(meta.updatedAt).toLocaleString("fr-FR")}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportConfig}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Exporter
          </button>
          <button
            onClick={reset}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4" />
          Modifications non enregistrées.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-indigo-300" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-6">
          {tab === "general" && (
            <Section title="Identité de la plateforme" icon={Layout} desc="Nom, logo et coordonnées affichés publiquement.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom de la plateforme">
                  <input className={inputCls} value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} />
                </Field>
                <Field label="Slogan">
                  <input className={inputCls} value={settings.siteTagline} onChange={(e) => update("siteTagline", e.target.value)} />
                </Field>
                <Field label="Email de support">
                  <input type="email" className={inputCls} value={settings.supportEmail} onChange={(e) => update("supportEmail", e.target.value)} />
                </Field>
                <Field label="Téléphone de support">
                  <input className={inputCls} value={settings.supportPhone} onChange={(e) => update("supportPhone", e.target.value)} />
                </Field>
                <Field label="URL du logo">
                  <input className={inputCls} value={settings.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://…/logo.png" />
                </Field>
                <Field label="Couleur principale">
                  <div className="flex gap-2">
                    <input type="color" value={settings.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200" />
                    <input className={inputCls} value={settings.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} />
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {tab === "localization" && (
            <Section title="Localisation" icon={Globe} desc="Devise, fuseau horaire, langues et format des dates.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Devise par défaut">
                  <select className={inputCls} value={settings.defaultCurrency} onChange={(e) => update("defaultCurrency", e.target.value)}>
                    <option value="XAF">FCFA (XAF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar (USD)</option>
                    <option value="GBP">Livre (GBP)</option>
                  </select>
                </Field>
                <Field label="Fuseau horaire">
                  <select className={inputCls} value={settings.timezone} onChange={(e) => update("timezone", e.target.value)}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Format des dates">
                  <select className={inputCls} value={settings.dateFormat} onChange={(e) => update("dateFormat", e.target.value)}>
                    <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                    <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                    <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                  </select>
                </Field>
              </div>
              <div className="mt-4">
                <label className={labelCls}>Langues disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => {
                    const active = settings.languages.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() =>
                          update(
                            "languages",
                            active
                              ? settings.languages.filter((l) => l !== lang.code)
                              : [...settings.languages, lang.code]
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200"
                        }`}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

          {tab === "access" && (
            <Section title="Accès & sécurité" icon={Lock} desc="Inscriptions, vérification et politique de sécurité.">
              <div className="space-y-3">
                <Toggle
                  title="Autoriser les nouvelles inscriptions"
                  desc="Si désactivé, l'API d'inscription refuse toute création de compte."
                  checked={settings.allowRegistration}
                  onChange={(v) => update("allowRegistration", v)}
                />
                <Toggle
                  title="Vérification email obligatoire"
                  desc="Demande la confirmation de l'adresse email à l'inscription."
                  checked={settings.requireEmailVerification}
                  onChange={(v) => update("requireEmailVerification", v)}
                />
                <Toggle
                  title="2FA obligatoire pour les administrateurs"
                  desc="Renforce l'accès à la console d'administration."
                  checked={settings.security.require2FAForAdmins}
                  onChange={(v) => update("security.require2FAForAdmins", v)}
                />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Field label="Expiration de session (min)">
                  <input type="number" min={5} className={inputCls} value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) => update("security.sessionTimeoutMinutes", Number(e.target.value))} />
                </Field>
                <Field label="Tentatives de connexion max">
                  <input type="number" min={1} className={inputCls} value={settings.security.maxLoginAttempts}
                    onChange={(e) => update("security.maxLoginAttempts", Number(e.target.value))} />
                </Field>
                <Field label="Longueur minimale du mot de passe">
                  <input type="number" min={6} className={inputCls} value={settings.security.passwordMinLength}
                    onChange={(e) => update("security.passwordMinLength", Number(e.target.value))} />
                </Field>
              </div>
            </Section>
          )}

          {tab === "limits" && (
            <Section title="Limites & finances" icon={Coins} desc="Plafonds appliqués aux membres, associations et prêts.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Associations max / membre">
                  <input type="number" min={1} className={inputCls} value={settings.maxAssociationsPerMember}
                    onChange={(e) => update("maxAssociationsPerMember", Number(e.target.value))} />
                </Field>
                <Field label="Membres max / association">
                  <input type="number" min={1} className={inputCls} value={settings.maxMembersPerAssociation}
                    onChange={(e) => update("maxMembersPerAssociation", Number(e.target.value))} />
                </Field>
                <Field label="Prêts actifs max / membre">
                  <input type="number" min={1} className={inputCls} value={settings.maxLoansPerMember}
                    onChange={(e) => update("maxLoansPerMember", Number(e.target.value))} />
                </Field>
                <Field label="Commission plateforme (%)">
                  <input type="number" min={0} step={0.1} className={inputCls} value={settings.defaultCommissionRate}
                    onChange={(e) => update("defaultCommissionRate", Number(e.target.value))} />
                </Field>
                <Field label="Taux de prêt par défaut (%)">
                  <input type="number" min={0} step={0.1} className={inputCls} value={settings.defaultLoanRate}
                    onChange={(e) => update("defaultLoanRate", Number(e.target.value))} />
                </Field>
                <Field label="Pénalité de retard (%)">
                  <input type="number" min={0} step={0.5} className={inputCls} value={settings.latePenaltyPercent}
                    onChange={(e) => update("latePenaltyPercent", Number(e.target.value))} />
                </Field>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                La limite d&apos;associations s&apos;applique immédiatement à la création et à l&apos;adhésion.
              </p>
            </Section>
          )}

          {tab === "features" && (
            <Section title="Fonctionnalités" icon={Sparkles} desc="Activez ou masquez les modules de l'espace membre.">
              <div className="space-y-3">
                {featureLabels.map((feature) => (
                  <Toggle
                    key={feature.key}
                    title={feature.title}
                    desc={feature.desc}
                    checked={settings.features[feature.key]}
                    onChange={(v) => update(`features.${feature.key}`, v)}
                  />
                ))}
              </div>
            </Section>
          )}

          {tab === "notifications" && (
            <Section title="Notifications" icon={Bell} desc="Canaux et délais de rappel des échéances.">
              <div className="space-y-3">
                <Toggle title="Notifications email" desc="Envoi par email (si un fournisseur SMTP est configuré)." checked={settings.notifications.emailEnabled} onChange={(v) => update("notifications.emailEnabled", v)} />
                <Toggle title="Notifications SMS" desc="Envoi par SMS (fournisseur à connecter)." checked={settings.notifications.smsEnabled} onChange={(v) => update("notifications.smsEnabled", v)} />
                <Toggle title="Notifications push" desc="Notifications in-app et push." checked={settings.notifications.pushEnabled} onChange={(v) => update("notifications.pushEnabled", v)} />
              </div>
              <div className="mt-5">
                <Field label="Rappels avant échéance (jours, séparés par des virgules)">
                  <input
                    className={inputCls}
                    value={settings.notifications.reminderOffsets.join(", ")}
                    onChange={(e) =>
                      update(
                        "notifications.reminderOffsets",
                        e.target.value
                          .split(",")
                          .map((v) => Number(v.trim()))
                          .filter((v) => Number.isFinite(v) && v >= 0)
                      )
                    }
                  />
                </Field>
              </div>
            </Section>
          )}

          {tab === "maintenance" && (
            <div className="space-y-6">
              <Section title="Maintenance" icon={Wrench} desc="Affiche un bandeau public et bloque les inscriptions.">
                <Toggle
                  title="Mode maintenance"
                  desc="Bandeau visible sur le site public ; les inscriptions sont suspendues."
                  checked={settings.maintenanceMode}
                  onChange={(v) => update("maintenanceMode", v)}
                />
                <div className="mt-4">
                  <Field label="Message affiché">
                    <textarea
                      className={`${inputCls} min-h-[100px]`}
                      value={settings.maintenanceMessage}
                      onChange={(e) => update("maintenanceMessage", e.target.value)}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Configuration technique" icon={Cloud} desc="Valeurs chargées par l'application.">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Fuseau horaire" value={settings.timezone} />
                  <Info label="Devise" value={settings.defaultCurrency} />
                  <Info label="Rappels" value={settings.notifications.reminderOffsets.map((o) => (o === 0 ? "Jour J" : `J-${o}`)).join(", ")} />
                  <Info label="Dernière mise à jour" value={meta?.updatedAt ? new Date(meta.updatedAt).toLocaleString("fr-FR") : "—"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={exportConfig} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Download className="h-4 w-4" /> Exporter la configuration
                  </button>
                  <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                    <RotateCcw className="h-4 w-4" /> Réinitialiser
                  </button>
                </div>
              </Section>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Settings2 className="h-4 w-4" /> Les paramètres sont enregistrés en base et audités.
            </div>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title, desc, icon: Icon, children,
}: {
  title: string; desc?: string; icon: any; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {desc && <p className="text-xs text-slate-500">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  title, desc, checked, onChange,
}: {
  title: string; desc: string; checked: boolean; onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className="flex-shrink-0"
      >
        {checked ? (
          <ToggleRight className="h-9 w-9 text-indigo-600" />
        ) : (
          <ToggleLeft className="h-9 w-9 text-slate-300" />
        )}
      </button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}
