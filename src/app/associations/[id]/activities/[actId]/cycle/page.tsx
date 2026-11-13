"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ArrowLeft, Coins, PiggyBank, RefreshCw, Target, Users } from "lucide-react";

type Data = {
  activity: {
    id: string; name: string; type: string; distributionMode: string;
    partAmount: number | null; contributionAmount: number | null; beneficiaryAmountPerShare: number | null;
    maxPartsPerSession: number; minShareFraction: number; allowPartialShares: boolean;
    allowSameBeneficiaryMultipleShares: boolean; maxBeneficiarySharesPerSession: number | null;
    cycleMode: string; cycleSessions: number | null; cycleStart: string; cycleEnd: string | null;
  };
  summary: {
    totalContributions: number; totalDistributed: number; balance: number;
    totalParts: number; distributedParts: number; remainingParts: number;
    plannedSessions: number | null; heldSessions: number; progress: number;
  };
  members: { membershipId: string; name: string; contributed: number; received: number; net: number; parts: number; receivedParts: number }[];
  sessions: { id: string; number: number; date: string; status: string; contributions: number; distributions: number; balance: number; pot: number }[];
  beneficiaries: { id: string; member: string; session: number; parts: number; amount: number; date: string }[];
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const day = (d: string) => new Date(d).toLocaleDateString("fr-FR");

const MODE: Record<string, string> = {
  FIXED_SESSIONS: "Nombre de sessions fixe",
  FIXED_PERIOD: "Période fixe",
  UNTIL_ALL_BENEFITED: "Jusqu'à épuisement des parts",
};

export default function CyclePage() {
  const { id, actId } = useParams<{ id: string; actId: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/associations/${id}/activities/${actId}/cycle`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || "Chargement impossible");
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, actId]);

  if (loading) return <DashboardLayout title="Cycle"><div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl m-soft" />)}</div></DashboardLayout>;

  return (
    <DashboardLayout title="Cycle de tontine">
      <div className="space-y-5">
        <div>
          <Link href={`/associations/${id}/activities/${actId}`} className="inline-flex items-center gap-1 text-xs font-semibold m-accent-text">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'activité
          </Link>
          <h1 className="mt-2 text-2xl font-bold m-text">{data?.activity.name ?? "Cycle"}</h1>
          <p className="mt-1 text-sm m-muted">{data ? MODE[data.activity.cycleMode] ?? data.activity.cycleMode : ""}</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Cotisations du cycle", value: fmt(data.summary.totalContributions), icon: PiggyBank },
                { label: "Bénéficiaires distribués", value: fmt(data.summary.totalDistributed), icon: Coins },
                { label: "Solde du cycle", value: fmt(data.summary.balance), icon: Target },
                { label: "Sessions tenues", value: `${data.summary.heldSessions}${data.summary.plannedSessions ? `/${data.summary.plannedSessions}` : ""}`, icon: RefreshCw, raw: true },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="rounded-2xl border m-border m-surface p-4">
                    <div className="flex items-center justify-between"><span className="text-xs m-muted">{c.label}</span><Icon className="h-4 w-4 m-accent-text" /></div>
                    <div className="mt-2 text-lg font-bold m-text">{c.value}</div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border m-border m-surface p-5">
              <div className="mb-2 flex justify-between text-xs m-muted">
                <span>Progression du cycle</span><span>{data.summary.progress} %</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full m-soft">
                <div className="h-full rounded-full" style={{ width: `${data.summary.progress}%`, background: "var(--m-accent)" }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><span className="m-muted">Parts souscrites : </span><span className="font-semibold m-text">{data.summary.totalParts}</span></div>
                <div><span className="m-muted">Parts distribuées : </span><span className="font-semibold m-text">{data.summary.distributedParts}</span></div>
                <div><span className="m-muted">Parts restantes : </span><span className="font-semibold m-text">{data.summary.remainingParts}</span></div>
                <div><span className="m-muted">Part : </span><span className="font-semibold m-text">{fmt(data.activity.partAmount ?? 0)}</span></div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="overflow-x-auto rounded-2xl border m-border m-surface">
                <div className="flex items-center gap-2 border-b m-border px-4 py-3 text-sm font-semibold m-text"><Users className="h-4 w-4" /> Situation par membre</div>
                <table className="w-full min-w-[460px] text-sm">
                  <thead className="m-soft text-left text-xs uppercase m-muted"><tr><th className="px-4 py-2">Membre</th><th className="px-3 py-2 text-right">Parts</th><th className="px-3 py-2 text-right">Cotisé</th><th className="px-3 py-2 text-right">Reçu</th><th className="px-4 py-2 text-right">Net</th></tr></thead>
                  <tbody className="divide-y divide-[var(--m-border)]">
                    {data.members.map((m) => (
                      <tr key={m.membershipId}>
                        <td className="px-4 py-2.5 m-text">{m.name}</td>
                        <td className="px-3 py-2.5 text-right m-muted">{m.parts}</td>
                        <td className="px-3 py-2.5 text-right m-muted">{fmt(m.contributed)}</td>
                        <td className="px-3 py-2.5 text-right m-muted">{fmt(m.received)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${m.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(m.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto rounded-2xl border m-border m-surface">
                <div className="border-b m-border px-4 py-3 text-sm font-semibold m-text">Sessions du cycle</div>
                <table className="w-full min-w-[460px] text-sm">
                  <thead className="m-soft text-left text-xs uppercase m-muted"><tr><th className="px-4 py-2">#</th><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Cotisations</th><th className="px-3 py-2 text-right">Distributions</th><th className="px-4 py-2 text-right">Solde</th></tr></thead>
                  <tbody className="divide-y divide-[var(--m-border)]">
                    {data.sessions.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2.5 m-muted">{s.number}</td>
                        <td className="px-3 py-2.5 m-text">{day(s.date)}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600">{fmt(s.contributions)}</td>
                        <td className="px-3 py-2.5 text-right text-red-600">{fmt(s.distributions)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold m-text">{fmt(s.balance)}</td>
                      </tr>
                    ))}
                    {data.sessions.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm m-muted">Aucune session ouverte.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border m-border m-surface">
              <div className="border-b m-border px-4 py-3 text-sm font-semibold m-text">Bénéficiaires du cycle</div>
              <table className="w-full min-w-[560px] text-sm">
                <thead className="m-soft text-left text-xs uppercase m-muted"><tr><th className="px-4 py-2">Date</th><th className="px-3 py-2">Membre</th><th className="px-3 py-2">Session</th><th className="px-3 py-2 text-right">Parts</th><th className="px-4 py-2 text-right">Montant reçu</th></tr></thead>
                <tbody className="divide-y divide-[var(--m-border)]">
                  {data.beneficiaries.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-2.5 m-muted">{day(b.date)}</td>
                      <td className="px-3 py-2.5 m-text">{b.member}</td>
                      <td className="px-3 py-2.5 m-muted">{b.session}</td>
                      <td className="px-3 py-2.5 text-right m-muted">{b.parts}</td>
                      <td className="px-4 py-2.5 text-right font-semibold m-accent-text">{fmt(b.amount)}</td>
                    </tr>
                  ))}
                  {data.beneficiaries.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm m-muted">Aucun bénéficiaire enregistré.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
