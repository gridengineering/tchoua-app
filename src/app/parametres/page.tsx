"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Settings, Globe, Plus, Trash2, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CustomLang { code: string; name: string; flag: string; translations: any; }

export default function ParametresPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [saved, setSaved] = useState(false);
  const { availableLangs, refreshLangs, lang } = useI18n();

  const [customs, setCustoms] = useState<CustomLang[]>([]);
  const [draft, setDraft] = useState({ code: "", name: "", flag: "🌍", translations: '{\n  "nav": {},\n  "common": {}\n}' });
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const loadCustoms = async () => {
    const r = await fetch("/api/languages");
    if (r.ok) {
      const d = await r.json();
      setCustoms(d.languages ?? []);
    }
  };
  useEffect(() => { loadCustoms(); }, []);

  const addLang = async () => {
    setError(null);
    let parsed;
    try { parsed = JSON.parse(draft.translations); } catch { setError("JSON invalide"); return; }
    const r = await fetch("/api/languages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: draft.code.toLowerCase().trim(), name: draft.name.trim(), flag: draft.flag, translations: parsed }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
      return;
    }
    setDraft({ code: "", name: "", flag: "🌍", translations: '{\n  "nav": {},\n  "common": {}\n}' });
    await loadCustoms();
    await refreshLangs();
  };

  const updateLang = async (code: string, patch: Partial<CustomLang>) => {
    const body: any = { code };
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.flag !== undefined) body.flag = patch.flag;
    if (patch.translations !== undefined) body.translations = patch.translations;
    const r = await fetch("/api/languages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { await loadCustoms(); await refreshLangs(); }
  };

  const deleteLang = async (code: string) => {
    if (!confirm(`Supprimer la langue "${code}" ?`)) return;
    const r = await fetch(`/api/languages?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    if (r.ok) { await loadCustoms(); await refreshLangs(); }
  };

  return (
    <DashboardLayout title="Paramètres">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Paramètres du compte</h2>
          <p className="text-sm text-graphite">Gérez vos informations personnelles et préférences</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nom complet" defaultValue={user?.name || ""} />
            <Input label="Email" type="email" defaultValue={user?.email || ""} disabled />
            <Select label="Langue d'interface" defaultValue={lang}
              options={availableLangs.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` }))} />
            <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
              {saved ? "✓ Sauvegardé !" : "Sauvegarder les modifications"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sécurité</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nouveau mot de passe" type="password" placeholder="••••••••" />
            <Input label="Confirmer le mot de passe" type="password" placeholder="••••••••" />
            <Button variant="outline">Changer le mot de passe</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "Rappels de cotisations (3 jours avant)",
                "Notifications de session (bénéficiaire désigné)",
                "Alertes de prêt (échéances)",
                "Demandes d'aide solidaire",
                "Mises à jour du scoring",
              ].map((label, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-violet-600 rounded" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-forest" />Langues personnalisées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-graphite">Ajoutez les langues de votre choix. Les clés non traduites retombent automatiquement sur le français.</p>

            {customs.length === 0 && <p className="text-sm text-ash italic">Aucune langue personnalisée pour l'instant.</p>}
            {customs.map((c) => (
              <div key={c.code} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <input value={c.flag} onChange={(e) => setCustoms(customs.map(x => x.code === c.code ? { ...x, flag: e.target.value } : x))} onBlur={() => updateLang(c.code, { flag: c.flag })} className="w-12 text-center text-xl border rounded px-1 py-1" maxLength={4} />
                  <input value={c.name} onChange={(e) => setCustoms(customs.map(x => x.code === c.code ? { ...x, name: e.target.value } : x))} onBlur={() => updateLang(c.code, { name: c.name })} className="flex-1 border rounded px-2 py-1 text-sm" />
                  <span className="text-xs text-graphite font-mono">{c.code}</span>
                  <button onClick={() => setEditing(editing === c.code ? null : c.code)} className="text-xs text-forest hover:underline">{editing === c.code ? "Fermer" : "Traductions"}</button>
                  <button onClick={() => deleteLang(c.code)} className="text-error hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
                {editing === c.code && (
                  <div className="mt-3">
                    <textarea
                      defaultValue={JSON.stringify(c.translations, null, 2)}
                      onBlur={(e) => {
                        try { updateLang(c.code, { translations: JSON.parse(e.target.value) }); }
                        catch { alert("JSON invalide"); }
                      }}
                      className="w-full font-mono text-xs border rounded p-2 h-48"
                    />
                    <p className="text-xs text-ash mt-1">Format: {`{ "nav": {...}, "common": {...}, ... }`}. Sauvegarde automatique au blur.</p>
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-dashed border-gray-200 pt-4">
              <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Plus className="w-4 h-4" />Ajouter une langue</div>
              <div className="grid grid-cols-3 gap-2">
                <Input label="Code (ex: pt)" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
                <Input label="Nom" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <Input label="Drapeau" value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: e.target.value })} />
              </div>
              <div className="mt-2">
                <label className="text-xs text-gray-600">Traductions (JSON)</label>
                <textarea value={draft.translations} onChange={(e) => setDraft({ ...draft, translations: e.target.value })} className="w-full font-mono text-xs border rounded p-2 h-32" />
              </div>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              <Button onClick={addLang} className="mt-2"><Save className="w-4 h-4 mr-1" />Ajouter la langue</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-red-700 flex items-center gap-2"><Settings className="w-5 h-5" />Zone de danger</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              La désactivation de votre compte suspend l'accès à toutes vos tontines.
              Cette action est réversible.
            </p>
            <Button variant="destructive" size="sm">Désactiver mon compte</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
