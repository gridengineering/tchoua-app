"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calculator, Coins, Info, Landmark, PieChart, Send, Trash2, Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type Share = {
  id?: string;
  membershipId: string;
  memberName: string;
  memberNumber?: string | null;
  capital: number;
  interestShare: number;
  eligible: boolean;
  reason?: string;
  credited?: boolean;
};

type Preview = {
  year: number;
  totalInterest: number;
  totalCapital: number;
  eligibleCount: number;
  excludedCount: number;
  shares: Share[];
};

type Run = {
  id: string;
  year: number;
  totalInterest: number;
  totalCapital: number;
  status: "DRAFT" | "POSTED";
  postedAt?: string | null;
  createdAt: string;
  shares: Share[];
};

export default function DividendsPage() {
  const { id } = useParams<{ id: string }>();
  const [year, setYear] = useState(new Date().getFullYear());
  const [preview, setPreview] = useState<Preview | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/associations/${id}/dividends?year=${year}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      setPreview(data.preview);
      setRun(data.run);
      setCanManage(Boolean(data.canManage));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, year]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/associations/${id}/dividends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, year }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action impossible");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const rows: Share[] = useMemo(() => {
    if (run?.shares?.length) {
      return run.shares.map((s) => ({
        ...s,
        memberName: s.memberName,
        eligible: s.eligible,
      }));
    }
    return preview?.shares ?? [];
  }, [run, preview]);

  const totalShares = rows.reduce((s, r) => s + r.interestShare, 0);
  const totalInterest = run?.totalInterest ?? preview?.totalInterest ?? 0;
  const totalCapital = run?.totalCapital ?? preview?.totalCapital ?? 0;
  const isPosted = run?.status === "POSTED";

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <DashboardLayout title="Dividendes & quote-parts">
      <div className="space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/associations/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-graphite hover:text-forest"
          >
            <ArrowLeft className="w-4 h-4" /> Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ash">Exercice</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-stone bg-white px-3 py-2 text-sm font-semibold"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-forest p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                <PieChart className="h-3.5 w-3.5" /> Module 6.5 · Répartition des bénéfices
              </div>
              <h1 className="text-3xl font-black tracking-tight">Dividendes {year}</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-100/70">
                Les intérêts encaissés sont répartis au prorata du capital épargne/investissement de
                chaque membre. Les membres en situation d&apos;emprunt sur la période sont exclus du
                capital disponible.
              </p>
            </div>
            <Badge variant={isPosted ? "success" : run ? "warning" : "default"}>
              {isPosted ? "Crédité" : run ? "Brouillon" : "Non calculé"}
            </Badge>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Intérêts encaissés", value: formatCurrency(totalInterest), icon: Coins },
            { label: "Capital éligible", value: formatCurrency(totalCapital), icon: Landmark },
            { label: "Membres éligibles", value: String(preview?.eligibleCount ?? "—"), icon: Users },
            { label: "Quote-parts calculées", value: formatCurrency(totalShares), icon: PieChart },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <k.icon className="mb-2 h-4 w-4 text-gold" />
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ash">{k.label}</div>
                <div className="text-lg font-bold text-charcoal">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Répartition par membre</CardTitle>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  loading={busy === "COMPUTE"}
                  onClick={() => act("COMPUTE")}
                  disabled={isPosted}
                >
                  <Calculator className="h-4 w-4" /> {run ? "Recalculer" : "Calculer la répartition"}
                </Button>
                <Button
                  size="sm"
                  loading={busy === "POST"}
                  disabled={!run || isPosted || totalShares <= 0}
                  onClick={() =>
                    act(
                      "POST",
                      `Créditer ${formatCurrency(totalShares)} sur les portefeuilles des membres ? Cette action est définitive.`
                    )
                  }
                >
                  <Send className="h-4 w-4" /> Créditer les portefeuilles
                </Button>
                {run && !isPosted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={busy === "DELETE"}
                    onClick={() => act("DELETE", "Supprimer ce brouillon de répartition ?")}
                  >
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-40 animate-pulse bg-cream/40" />
            ) : rows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <PieChart className="mx-auto mb-3 h-10 w-10 text-stone" />
                <p className="text-sm font-medium text-ash">
                  Aucune donnée pour {year}. Lancez le calcul pour générer la répartition.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone/60 text-left text-[11px] uppercase tracking-wide text-ash">
                      <th className="px-5 py-3">Membre</th>
                      <th className="px-5 py-3 text-right">Capital versé</th>
                      <th className="px-5 py-3 text-right">Quote-part</th>
                      <th className="px-5 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/50">
                    {rows.map((r) => (
                      <tr key={r.membershipId} className="hover:bg-cream/40">
                        <td className="px-5 py-3">
                          <div className="font-medium text-charcoal">
                            {r.memberName}
                            {r.memberNumber ? (
                              <span className="ml-2 text-xs font-normal text-ash">#{r.memberNumber}</span>
                            ) : null}
                          </div>
                          {r.reason && <div className="text-xs text-warning">{r.reason}</div>}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">{formatCurrency(r.capital)}</td>
                        <td className="px-5 py-3 text-right font-bold text-forest">
                          {formatCurrency(r.interestShare)}
                        </td>
                        <td className="px-5 py-3">
                          {!r.eligible ? (
                            <Badge variant="warning">Exclu</Badge>
                          ) : r.credited ? (
                            <Badge variant="success">Crédité</Badge>
                          ) : (
                            <Badge variant="default">À créditer</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-stone bg-cream/40 font-semibold">
                      <td className="px-5 py-3">Total</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(rows.reduce((s, r) => s + r.capital, 0))}</td>
                      <td className="px-5 py-3 text-right text-forest">{formatCurrency(totalShares)}</td>
                      <td className="px-5 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-sm text-info">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Méthode : intérêts encaissés sur l&apos;exercice × (capital du membre ÷ capital total
            éligible). Les contributions prises en compte sont les cotisations payées aux activités
            Épargne et Investissement. Le crédit des portefeuilles est transactionnel et audité.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
