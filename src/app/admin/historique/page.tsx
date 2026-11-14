"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Download, History, Loader2, Search, ShieldAlert, User } from "lucide-react";

type TimelineItem = { at: string; type: string; title: string; detail?: string | null; actor?: string | null; href?: string | null };
type AssocOption = { id: string; name: string; trustScore?: number; trustLevel?: number; quarantinedAt?: string | null };
type UserOption = { id: string; name: string; email: string; kycLevel: number; quarantinedAt?: string | null };

const TYPE_TONES: Record<string, string> = {
  KYC: "bg-violet-100 text-violet-700",
  CONSENTEMENT: "bg-sky-100 text-sky-700",
  ADHESION: "bg-emerald-100 text-emerald-700",
  COTISATION: "bg-amber-100 text-amber-700",
  PRET: "bg-orange-100 text-orange-700",
  AIDE_SOCIALE: "bg-rose-100 text-rose-700",
  REUNION: "bg-indigo-100 text-indigo-700",
  AUDIT: "bg-slate-100 text-slate-600",
  MEMBRE: "bg-emerald-100 text-emerald-700",
  CYCLE_DE_VIE: "bg-slate-100 text-slate-600",
};

export default function AdminHistoryPage() {
  const [entity, setEntity] = useState<"association" | "user">("association");
  const [associations, setAssociations] = useState<AssocOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [data, setData] = useState<{ header: any; items: TimelineItem[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/associations", { cache: "no-store" }).then((r) => r.ok ? r.json() : { associations: [] }),
      fetch("/api/admin/kyc", { cache: "no-store" }).then((r) => r.ok ? r.json() : { users: [] }),
    ]).then(([a, u]) => {
      setAssociations(a.associations ?? []);
      setUsers(u.users ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true); setError(null);
    fetch(`/api/admin/history?entity=${entity}&id=${selectedId}`, { cache: "no-store" })
      .then(async (res) => { const json = await res.json(); if (!res.ok) throw new Error(json.error ?? "Chargement impossible"); setData(json); })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [entity, selectedId]);

  const options = entity === "association"
    ? associations.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()))
    : users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const items = useMemo(() => (data?.items ?? []).filter((item) => !typeFilter || item.type === typeFilter), [data, typeFilter]);
  const types = useMemo(() => Array.from(new Set((data?.items ?? []).map((i) => i.type))).sort(), [data]);

  const exportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `historique-${entity}-${selectedId}.json`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historique complet des activités</h1>
        <p className="mt-1 text-sm text-slate-500">Chronologie d&apos;une association ou d&apos;un membre : KYC, consentements, adhésions, cotisations, prêts, aides, réunions et audit.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            <button onClick={() => { setEntity("association"); setSelectedId(""); setData(null); }} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${entity === "association" ? "bg-slate-900 text-white" : "text-slate-600"}`}><Building2 className="h-3.5 w-3.5" /> Association</button>
            <button onClick={() => { setEntity("user"); setSelectedId(""); setData(null); }} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${entity === "user" ? "bg-slate-900 text-white" : "text-slate-600"}`}><User className="h-3.5 w-3.5" /> Membre</button>
          </div>
          <label className="min-w-[220px] flex-1"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Rechercher</span>
            <span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" placeholder={entity === "association" ? "Nom de l'association…" : "Nom ou e-mail…"} /></span>
          </label>
          <label className="min-w-[240px] flex-1"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{entity === "association" ? "Association" : "Membre"}</span>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">Sélectionner…</option>
              {options.map((option) => <option key={option.id} value={option.id}>{option.name}{entity === "user" ? ` · ${(option as UserOption).email}` : ""}</option>)}
            </select>
          </label>
          {data ? <button onClick={exportJson} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><Download className="h-3.5 w-3.5" /> Exporter</button> : null}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div> : null}

      {!selectedId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <History className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Sélectionnez une association ou un membre pour afficher sa chronologie complète.</p>
        </div>
      ) : loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
      ) : data ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{data.header.name}</h2>
                <p className="text-xs text-slate-500">{entity === "association" ? `${data.header.status} · confiance ${data.header.trustScore ?? 0}/100` : `${data.header.email} · KYC ${data.header.kycLevel}`}</p>
              </div>
              <div className="flex items-center gap-2">
                {data.header.quarantinedAt ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700"><ShieldAlert className="h-3 w-3" /> En quarantaine</span> : null}
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{items.length} événement(s)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTypeFilter("")} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${!typeFilter ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>Tout</button>
            {types.map((type) => <button key={type} onClick={() => setTypeFilter(type)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${typeFilter === type ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{type}</button>)}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {items.length === 0 ? <p className="text-sm text-slate-500">Aucun événement pour ce filtre.</p> : (
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {items.map((item, index) => (
                  <li key={`${item.at}-${index}`} className="relative">
                    <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-300" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${TYPE_TONES[item.type] ?? "bg-slate-100 text-slate-600"}`}>{item.type}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(item.at).toLocaleString("fr-FR")}</span>
                    </div>
                    {item.detail ? <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p> : null}
                    {item.actor ? <p className="mt-0.5 text-[10px] text-slate-400">Par {item.actor}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
