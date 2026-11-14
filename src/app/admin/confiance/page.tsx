"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Filter, RefreshCw, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { TRUST_LEVELS, trustLevelForScore, type TrustBreakdown } from "@/lib/trust-levels";

type Assoc = {
  id: string; name: string; type: string; status: string; region?: string | null;
  trustScore: number; trustLevel: number; trustBreakdown?: string | null; trustComputedAt?: string | null;
  quarantinedAt?: string | null; quarantineReason?: string | null;
  _count: { memberships: number; activities: number; documents: number };
};

const selectCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-900";

function TrustBadge({ score, level }: { score: number; level: number }) {
  const info = TRUST_LEVELS.find((l) => l.level === level) ?? TRUST_LEVELS[0];
  const tone = level >= 4 ? "border-violet-200 bg-violet-50 text-violet-800" : level === 3 ? "border-slate-300 bg-slate-100 text-slate-700" : level === 2 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-sky-200 bg-sky-50 text-sky-800";
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone}`}>{info.label} · {score}/100</span>;
}

export default function AdminTrustPage() {
  const [associations, setAssociations] = useState<Assoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [quarantined, setQuarantined] = useState(false);
  const [groupBy, setGroupBy] = useState<"LEVEL" | "STATUS" | "NONE">("LEVEL");
  const [selected, setSelected] = useState<Assoc | null>(null);
  const breakdown: TrustBreakdown | null = useMemo(() => {
    if (!selected?.trustBreakdown) return null;
    try { return JSON.parse(selected.trustBreakdown); } catch { return null; }
  }, [selected]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (quarantined) params.set("quarantined", "1");
      const res = await fetch(`/api/admin/trust?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setAssociations(json.associations ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, quarantined]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const map = new Map<string, Assoc[]>();
    for (const association of associations) {
      const key = groupBy === "LEVEL"
        ? `Niveau ${association.trustLevel} · ${TRUST_LEVELS.find((l) => l.level === association.trustLevel)?.label ?? ""}`
        : groupBy === "STATUS" ? association.status : "Toutes les associations";
      const rows = map.get(key) ?? [];
      rows.push(association);
      map.set(key, rows);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [associations, groupBy]);

  const recompute = async (associationId?: string) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const res = await fetch("/api/admin/trust", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(associationId ? { associationId } : {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Calcul impossible");
      setNotice(associationId ? "Score recalculé." : `${json.count ?? 0} association(s) recalculée(s).`);
      setSelected(null);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); }
    finally { setBusy(false); }
  };

  const quarantine = async (association: Assoc) => {
    const action = association.quarantinedAt ? "RELEASE" : "QUARANTINE";
    const reason = action === "QUARANTINE" ? window.prompt("Motif de la quarantaine :") ?? undefined : undefined;
    if (action === "QUARANTINE" && !reason) return;
    const res = await fetch("/api/admin/quarantine", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "association", id: association.id, action, reason }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error ?? "Action impossible"); return; }
    setNotice(action === "QUARANTINE" ? "Association placée en quarantaine." : "Quarantaine levée.");
    setSelected(null);
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Confiance & conformité des associations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Score de gamification pondéré : règlement, preuves, activité, membres, réunions, finances, KYC et signalements.
          </p>
        </div>
        <button onClick={() => recompute()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /> Recalculer tout
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Statut</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            <option value="">Tous</option><option value="ACTIVE">Active</option><option value="PENDING">En attente</option><option value="SUSPENDED">Suspendue</option><option value="DISSOLVED">Dissoute</option>
          </select>
        </label>
        <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Regrouper par</span>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} className={selectCls}>
            <option value="LEVEL">Niveau de confiance</option><option value="STATUS">Statut</option><option value="NONE">Aucun</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
          <input type="checkbox" checked={quarantined} onChange={(e) => setQuarantined(e.target.checked)} className="h-4 w-4 accent-slate-900" /> Uniquement en quarantaine
        </label>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><Filter className="h-3.5 w-3.5" /> Filtrer</button>
      </div>

      {error ? <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertTriangle className="h-4 w-4" />{error}</div> : null}
      {notice ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</div> : null}

      {loading ? <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">Chargement…</div> : (
        <div className="space-y-6">
          {groups.map(([key, rows]) => (
            <section key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">{key}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{rows.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr><th className="px-4 py-2.5">Association</th><th className="px-4 py-2.5">Confiance</th><th className="px-4 py-2.5">Membres</th><th className="px-4 py-2.5">Dernier calcul</th><th className="px-4 py-2.5 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((association) => (
                      <tr key={association.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{association.name}</div>
                          <div className="text-xs text-slate-500">{association.type} · {association.status}{association.region ? ` · ${association.region}` : ""}</div>
                          {association.quarantinedAt ? <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600"><ShieldAlert className="h-3 w-3" /> Quarantaine</span> : null}
                        </td>
                        <td className="px-4 py-3"><TrustBadge score={association.trustScore} level={association.trustLevel} /></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{association._count.memberships}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{association.trustComputedAt ? new Date(association.trustComputedAt).toLocaleDateString("fr-FR") : "Jamais"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => setSelected(association)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700">Détail</button>
                            <button onClick={() => recompute(association.id)} disabled={busy} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-40">Recalculer</button>
                            <Link href={`/admin/historique?entity=association&id=${association.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700">Historique</Link>
                            <button onClick={() => quarantine(association)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${association.quarantinedAt ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600"}`}>{association.quarantinedAt ? "Libérer" : "Quarantaine"}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          {groups.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Aucune association.</div> : null}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-2 sm:p-4">
          <div className="h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white p-5">
              <div><h2 className="text-lg font-bold text-slate-900">{selected.name}</h2><div className="mt-1.5"><TrustBadge score={selected.trustScore} level={selected.trustLevel} /></div></div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 p-5">
              {breakdown?.criteria?.map((criterion) => (
                <div key={criterion.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800">{criterion.label}</span>
                    <span className="text-[11px] font-bold text-slate-600">{criterion.score}/{criterion.max}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-800" style={{ width: `${(criterion.score / criterion.max) * 100}%` }} /></div>
                  <p className="mt-1 text-[10.5px] text-slate-500">{criterion.detail}</p>
                </div>
              ))}
              {!breakdown ? <p className="text-xs text-slate-500">Aucun détail. Lancez un recalcul.</p> : null}
              <button onClick={() => recompute(selected.id)} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Recalculer cette association</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
