"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  ArrowDownLeft, ArrowUpRight, BarChart3, Calendar, ChevronLeft, ChevronRight,
  Columns3, Download, Filter, Grid3x3, List, Search, Wallet,
} from "lucide-react";

type HistEvent = {
  id: string; date: string; type: string; label: string; amount: number;
  direction: "IN" | "OUT"; membershipId?: string | null; memberName?: string | null;
  activityId?: string | null; activityName?: string | null; meta?: Record<string, unknown>;
};

type Group = { key: string; label: string; in: number; out: number; count: number; byType: Record<string, number> };

type HistResponse = {
  total: number; pages: number; page: number; pageSize: number;
  summary: { in: number; out: number; net: number };
  groups: Group[]; pivot: Group[]; events: HistEvent[];
  members: { id: string; name: string; role: string }[];
  activities: { id: string; name: string; type: string }[];
  canViewAll: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  CONTRIBUTION: "Cotisation", LOAN: "Prêt", REPAYMENT: "Remboursement",
  INTEREST: "Intérêts", BENEFICIARY: "Bénéficiaire", AID: "Aide sociale",
};
const TYPE_COLOR: Record<string, string> = {
  CONTRIBUTION: "#0d9488", LOAN: "#dc2626", REPAYMENT: "#2563eb",
  INTEREST: "#7c3aed", BENEFICIARY: "#d97706", AID: "#db2777",
};
const TYPES = ["ALL", "CONTRIBUTION", "LOAN", "REPAYMENT", "INTEREST", "BENEFICIARY", "AID"];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const day = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<"association" | "member" | "activity">(
    (searchParams.get("scope") as any) || "association"
  );
  const [view, setView] = useState<"list" | "kanban" | "graph" | "grid">("list");
  const [type, setType] = useState("ALL");
  const [membershipId, setMembershipId] = useState(searchParams.get("membershipId") || "");
  const [activityId, setActivityId] = useState(searchParams.get("activityId") || "");
  const [groupBy, setGroupBy] = useState("member");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [data, setData] = useState<HistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scope === "member" && !membershipId && data?.members?.[0]) setMembershipId(data.members[0].id);
  }, [scope, membershipId, data]);

  useEffect(() => {
    if (scope === "activity" && !activityId && data?.activities?.[0]) setActivityId(data.activities[0].id);
  }, [scope, activityId, data]);

  useEffect(() => {
    const qs = new URLSearchParams({ scope, type, groupBy, page: String(page), pageSize: String(pageSize) });
    if (scope === "member" && membershipId) qs.set("membershipId", membershipId);
    if (scope === "activity" && activityId) qs.set("activityId", activityId);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    setLoading(true);
    setError(null);
    fetch(`/api/associations/${id}/history?${qs.toString()}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || "Chargement impossible");
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, scope, type, groupBy, page, pageSize, membershipId, activityId, from, to]);

  useEffect(() => { setPage(1); }, [scope, type, groupBy, membershipId, activityId, from, to]);

  const filteredEvents = useMemo(() => {
    const list = data?.events ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((e) =>
      e.label.toLowerCase().includes(q) ||
      (e.memberName ?? "").toLowerCase().includes(q) ||
      (e.activityName ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const groups = data?.groups ?? [];
  const maxGroup = Math.max(1, ...groups.map((g) => Math.max(g.in, g.out)));

  const groupKey = (e: HistEvent) => {
    if (groupBy === "activity") return e.activityId ?? "none";
    if (groupBy === "type") return e.type;
    if (groupBy === "month") return e.date.slice(0, 7);
    return e.membershipId ?? "pool";
  };

  const scopeLabel = scope === "association" ? "Toutes les activités" : scope === "member" ? "Par membre" : "Par activité";

  return (
    <DashboardLayout title="Historique">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] m-accent-text">Historique</p>
            <h1 className="mt-1 text-2xl font-bold m-text">Mouvements & opérations</h1>
            <p className="mt-1 text-sm m-muted">Cotisations, prêts, remboursements, intérêts et bénéficiaires — filtres, regroupements et vues.</p>
          </div>
          <Link href={`/associations/${id}/interets`} className="inline-flex items-center gap-2 rounded-xl m-accent-bg px-4 py-2.5 text-sm font-semibold">
            <BarChart3 className="h-4 w-4" /> Détail des intérêts
          </Link>
        </div>

        {/* Scopes + vues */}
        <div className="flex flex-col gap-3 rounded-2xl border m-border m-surface p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex overflow-x-auto rounded-xl m-soft p-1">
            {[
              { k: "association", label: "Global association" },
              { k: "member", label: "Par membre" },
              { k: "activity", label: "Par activité" },
            ].map((t) => (
              <button key={t.k} onClick={() => { setScope(t.k as any); setPage(1); }}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${scope === t.k ? "m-surface m-text shadow-sm" : "m-muted"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl m-soft p-1">
              {[
                { k: "list", icon: List, label: "Liste" },
                { k: "kanban", icon: Columns3, label: "Kanban" },
                { k: "graph", icon: BarChart3, label: "Graphique" },
                { k: "grid", icon: Grid3x3, label: "Grille" },
              ].map((v) => {
                const Icon = v.icon;
                return (
                  <button key={v.k} onClick={() => setView(v.k as any)} title={v.label}
                    className={`rounded-lg p-2 transition ${view === v.k ? "m-surface m-accent-text shadow-sm" : "m-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
              className="rounded-lg border m-border m-surface px-2 py-1.5 text-xs m-text">
              <option value="member">Grouper : membre</option>
              <option value="activity">Grouper : activité</option>
              <option value="type">Grouper : type</option>
              <option value="month">Grouper : mois</option>
            </select>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 m-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un libellé, un membre…"
              className="w-full rounded-xl border m-border m-surface py-2 pl-9 pr-3 text-sm m-text" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text">
            {TYPES.map((t) => <option key={t} value={t}>{t === "ALL" ? "Tous les types" : TYPE_LABEL[t]}</option>)}
          </select>
          {scope === "member" && (
            <select value={membershipId} onChange={(e) => setMembershipId(e.target.value)}
              className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text">
              {(data?.members ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          {scope === "activity" && (
            <select value={activityId} onChange={(e) => setActivityId(e.target.value)}
              className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text">
              {(data?.activities ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text" />
          {(from || to || type !== "ALL") && (
            <button onClick={() => { setFrom(""); setTo(""); setType("ALL"); }} className="inline-flex items-center gap-1 rounded-xl border m-border px-3 py-2 text-xs font-semibold m-muted">
              <Filter className="h-3.5 w-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Entrées", value: data?.summary.in ?? 0, icon: ArrowDownLeft, tone: "#0d9488" },
            { label: "Sorties", value: data?.summary.out ?? 0, icon: ArrowUpRight, tone: "#dc2626" },
            { label: "Solde net", value: data?.summary.net ?? 0, icon: Wallet, tone: "var(--m-accent)" },
            { label: "Mouvements", value: data?.total ?? 0, icon: Calendar, tone: "#7c3aed", raw: true },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl border m-border m-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium m-muted">{s.label}</span>
                  <Icon className="h-4 w-4" style={{ color: s.tone }} />
                </div>
                <div className="mt-2 text-lg font-bold m-text">{s.raw ? s.value : fmt(s.value)}</div>
              </div>
            );
          })}
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl m-soft" />)}</div>
        ) : view === "list" ? (
          <div className="overflow-x-auto rounded-2xl border m-border m-surface">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="m-soft text-left text-xs uppercase tracking-wide m-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Libellé</th>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Activité</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--m-border)]">
                {filteredEvents.map((e) => (
                  <tr key={e.id} className="hover:m-soft">
                    <td className="whitespace-nowrap px-4 py-3 m-muted">{day(e.date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: `color-mix(in srgb, ${TYPE_COLOR[e.type]} 14%, transparent)`, color: TYPE_COLOR[e.type] }}>
                        {TYPE_LABEL[e.type] ?? e.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 m-text">{e.label}</td>
                    <td className="px-4 py-3 m-muted">{e.memberName ?? "—"}</td>
                    <td className="px-4 py-3 m-muted">{e.activityName ?? "—"}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${e.direction === "IN" ? "text-emerald-600" : "text-red-600"}`}>
                      {e.direction === "IN" ? "+" : "−"} {fmt(e.amount)}
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm m-muted">Aucun mouvement pour ces filtres.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : view === "kanban" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.slice(0, 6).map((g) => (
              <div key={g.key} className="rounded-2xl border m-border m-surface p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold m-text">{g.label}</div>
                  <span className="rounded-full m-soft px-2 py-0.5 text-[10px] font-semibold m-muted">{g.count}</span>
                </div>
                <div className="mb-2 flex gap-3 text-[11px]">
                  <span className="text-emerald-600">+{fmt(g.in)}</span>
                  <span className="text-red-600">−{fmt(g.out)}</span>
                </div>
                <div className="space-y-1.5">
                  {filteredEvents.filter((e) => groupKey(e) === g.key).slice(0, 6).map((e) => (
                    <div key={e.id} className="rounded-lg border m-border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-medium m-text">{e.label}</span>
                        <span className={`whitespace-nowrap text-[11px] font-semibold ${e.direction === "IN" ? "text-emerald-600" : "text-red-600"}`}>
                          {e.direction === "IN" ? "+" : "−"}{fmt(e.amount)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10px] m-muted">{day(e.date)} · {e.memberName ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : view === "graph" ? (
          <div className="rounded-2xl border m-border m-surface p-5">
            <h3 className="mb-4 text-sm font-semibold m-text">Flux par {groupBy === "member" ? "membre" : groupBy === "activity" ? "activité" : groupBy === "type" ? "type" : "mois"}</h3>
            <div className="space-y-3">
              {groups.slice(0, 12).map((g) => (
                <div key={g.key}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="m-text">{g.label}</span>
                    <span className="m-muted">+{fmt(g.in)} / −{fmt(g.out)}</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full m-soft">
                    <div className="h-full bg-emerald-500" style={{ width: `${(g.in / maxGroup) * 50}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${(g.out / maxGroup) * 50}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border m-border m-surface">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="m-soft text-left text-xs uppercase tracking-wide m-muted">
                <tr>
                  <th className="px-4 py-3">Groupe</th>
                  {["CONTRIBUTION", "LOAN", "REPAYMENT", "INTEREST", "BENEFICIARY", "AID"].map((t) => (
                    <th key={t} className="px-3 py-3 text-right">{TYPE_LABEL[t]}</th>
                  ))}
                  <th className="px-4 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--m-border)]">
                {groups.map((g) => (
                  <tr key={g.key} className="hover:m-soft">
                    <td className="px-4 py-3 font-medium m-text">{g.label}</td>
                    {["CONTRIBUTION", "LOAN", "REPAYMENT", "INTEREST", "BENEFICIARY", "AID"].map((t) => (
                      <td key={t} className="px-3 py-3 text-right m-muted">{g.byType?.[t] ? fmt(g.byType[t]) : "—"}</td>
                    ))}
                    <td className={`px-4 py-3 text-right font-semibold ${g.in - g.out >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmt(g.in - g.out)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs m-muted">
            {data ? `${data.total} mouvement(s) · page ${data.page}/${data.pages}` : "—"}
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border m-border px-3 py-1.5 text-xs font-semibold m-text disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Précédent
            </button>
            <button disabled={!data || page >= data.pages} onClick={() => setPage(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border m-border px-3 py-1.5 text-xs font-semibold m-text disabled:opacity-40">
              Suivant <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
