"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ArrowLeft, ChevronDown, ChevronUp, Info, Percent, TrendingUp, Users } from "lucide-react";

type Row = {
  id: string; date: string; loanId: string; borrower: string; activity: string;
  repayment: number; interestTotal: number; capital: number; totalCapital: number;
  ratio: number; memberShare: number;
  allocations?: { membershipId: string; memberName: string; capital: number; totalCapital: number; ratio: number; amount: number }[];
};
type Group = { key: string; label: string; interest: number; share: number; count: number };
type Data = {
  memberName: string; canViewAll: boolean;
  totals: { interest: number; share: number; dividendInterest: number; dividendShare: number; dividendYear: number | null };
  groups: Group[]; rows: Row[];
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const day = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function InterestsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [membershipId, setMembershipId] = useState("");
  const [groupBy, setGroupBy] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/associations/${id}/history?scope=association&pageSize=5`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const qs = new URLSearchParams({ groupBy });
    if (membershipId) qs.set("membershipId", membershipId);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    setLoading(true); setError(null);
    fetch(`/api/associations/${id}/interests?${qs.toString()}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || "Chargement impossible");
        setData(d);
        if (!membershipId) setMembershipId(d.membershipId);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, membershipId, groupBy, from, to]);

  const maxGroup = Math.max(1, ...(data?.groups ?? []).map((g) => g.interest));

  return (
    <DashboardLayout title="Intérêts">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href={`/associations/${id}/historique`} className="inline-flex items-center gap-1 text-xs font-semibold m-accent-text">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'historique
            </Link>
            <h1 className="mt-2 text-2xl font-bold m-text">Intérêts & dividendes</h1>
            <p className="mt-1 text-sm m-muted">
              Chaque remboursement génère des intérêts répartis au prorata du capital détenu à la date du prêt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data?.canViewAll && (
              <select value={membershipId} onChange={(e) => setMembershipId(e.target.value)}
                className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text">
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
              className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text">
              <option value="month">Par mois</option>
              <option value="member">Par emprunteur</option>
            </select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border m-border m-surface px-3 py-2 text-sm m-text" />
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border m-border m-surface p-4">
            <div className="flex items-center justify-between"><span className="text-xs m-muted">Intérêts générés</span><TrendingUp className="h-4 w-4 m-accent-text" /></div>
            <div className="mt-2 text-lg font-bold m-text">{fmt(data?.totals.interest ?? 0)}</div>
          </div>
          <div className="rounded-2xl border m-border m-surface p-4">
            <div className="flex items-center justify-between"><span className="text-xs m-muted">Part de {data?.memberName ?? "membre"}</span><Percent className="h-4 w-4 m-accent-text" /></div>
            <div className="mt-2 text-lg font-bold m-text">{fmt(data?.totals.share ?? 0)}</div>
          </div>
          <div className="rounded-2xl border m-border m-surface p-4">
            <div className="flex items-center justify-between"><span className="text-xs m-muted">Dividendes {data?.totals.dividendYear ?? ""}</span><Users className="h-4 w-4 m-accent-text" /></div>
            <div className="mt-2 text-lg font-bold m-text">{fmt(data?.totals.dividendShare ?? 0)}</div>
            <div className="text-[11px] m-muted">Base : {fmt(data?.totals.dividendInterest ?? 0)}</div>
          </div>
          <div className="rounded-2xl border m-border m-surface p-4">
            <div className="flex items-center justify-between"><span className="text-xs m-muted">Remboursements analysés</span><Info className="h-4 w-4 m-accent-text" /></div>
            <div className="mt-2 text-lg font-bold m-text">{data?.rows.length ?? 0}</div>
          </div>
        </div>

        <div className="rounded-2xl border m-border m-surface p-5">
          <h3 className="mb-4 text-sm font-semibold m-text">Intérêts par période</h3>
          <div className="space-y-3">
            {(data?.groups ?? []).slice(0, 12).map((g) => (
              <div key={g.key}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="m-text">{g.label}</span>
                  <span className="m-muted">{fmt(g.interest)} · part {fmt(g.share)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full m-soft">
                  <div className="h-full rounded-full" style={{ width: `${(g.interest / maxGroup) * 100}%`, background: "var(--m-accent)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl m-soft" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border m-border m-surface">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="m-soft text-left text-xs uppercase tracking-wide m-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Emprunteur</th>
                  <th className="px-4 py-3">Activité</th>
                  <th className="px-4 py-3 text-right">Intérêt du prêt</th>
                  <th className="px-4 py-3 text-right">Capital à la date</th>
                  <th className="px-4 py-3 text-right">Quote-part</th>
                  <th className="px-4 py-3 text-right">Part membre</th>
                  {data?.canViewAll && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--m-border)]">
                {(data?.rows ?? []).map((r) => (
                  <Fragment key={r.id}>
                    <tr className="hover:m-soft">
                      <td className="whitespace-nowrap px-4 py-3 m-muted">{day(r.date)}</td>
                      <td className="px-4 py-3 m-text">{r.borrower}</td>
                      <td className="px-4 py-3 m-muted">{r.activity}</td>
                      <td className="px-4 py-3 text-right m-text">{fmt(r.interestTotal)}</td>
                      <td className="px-4 py-3 text-right m-muted">{fmt(r.capital)} / {fmt(r.totalCapital)}</td>
                      <td className="px-4 py-3 text-right m-muted">{(r.ratio * 100).toFixed(2)} %</td>
                      <td className="px-4 py-3 text-right font-semibold m-accent-text">{fmt(r.memberShare)}</td>
                      {data?.canViewAll && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setOpen(open === r.id ? null : r.id)} className="rounded-lg border m-border p-1.5 m-muted">
                            {open === r.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      )}
                    </tr>
                    {open === r.id && r.allocations && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={data?.canViewAll ? 8 : 7} className="m-soft px-4 py-3">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {r.allocations.map((a) => (
                              <div key={a.membershipId} className="rounded-lg border m-border m-surface p-2.5 text-xs">
                                <div className="flex justify-between font-semibold m-text">
                                  <span>{a.memberName}</span><span>{fmt(a.amount)}</span>
                                </div>
                                <div className="mt-1 flex justify-between m-muted">
                                  <span>Capital {fmt(a.capital)}</span><span>{(a.ratio * 100).toFixed(2)} %</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {(data?.rows ?? []).length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm m-muted">Aucun intérêt sur cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
