"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, FileText, HandCoins, Landmark,
  Printer, Save, Scale, UserMinus, Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type Line = { id: string; label: string; amount: number; date?: string | null };

type Preview = {
  membershipId: string;
  memberName: string;
  memberNumber: string | null;
  assets: number;
  debtFines: number;
  debtSanctions: number;
  debtLoans: number;
  debtCollation: number;
  totalDebts: number;
  net: number;
  savings: Line[];
  fines: Line[];
  sanctions: Line[];
  loans: Line[];
  collations: Line[];
};

type History = {
  id: string;
  type: string;
  year?: number | null;
  assets: number;
  totalDebts: number;
  net: number;
  status: string;
  createdAt: string;
  appliedAt?: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  DEPARTURE: "Départ / démission",
  YEAR_END: "Clôture annuelle",
  DEATH: "Décès",
};

export default function MemberSettlementPage() {
  const { id, membershipId } = useParams<{ id: string; membershipId: string }>();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [type, setType] = useState<"DEPARTURE" | "YEAR_END">("DEPARTURE");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/associations/${id}/members/${membershipId}/settlement`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      setPreview(data.preview);
      setHistory(data.history ?? []);
      setCanManage(Boolean(data.canManage));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, membershipId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: "SAVE" | "APPLY") => {
    if (
      action === "APPLY" &&
      !confirm(
        type === "DEPARTURE"
          ? "Appliquer la sortie du membre ? Son statut passera à RESIGNED et le solde sera figé."
          : "Clôturer l'exercice pour ce membre ? Un solde figé sera enregistré."
      )
    ) {
      return;
    }
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/associations/${id}/members/${membershipId}/settlement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type, year }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action impossible");
      setMessage(
        action === "SAVE"
          ? "Calcul enregistré en brouillon."
          : type === "DEPARTURE"
          ? "Sortie appliquée : statut du membre mis à jour."
          : "Exercice clôturé et enregistré."
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const sections = useMemo(() => {
    if (!preview) return [];
    return [
      { key: "savings", title: "Avoirs — capital épargne / investissement", lines: preview.savings, total: preview.assets, positive: true },
      { key: "fines", title: "Amendes impayées", lines: preview.fines, total: preview.debtFines, positive: false },
      { key: "sanctions", title: "Sanctions en attente", lines: preview.sanctions, total: preview.debtSanctions, positive: false },
      { key: "loans", title: "Encours de prêts", lines: preview.loans, total: preview.debtLoans, positive: false },
      { key: "collations", title: "Collations impayées", lines: preview.collations, total: preview.debtCollation, positive: false },
    ];
  }, [preview]);

  return (
    <DashboardLayout title="Solde de sortie">
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        <Link
          href={`/associations/${id}?tab=members`}
          className="inline-flex items-center gap-2 text-sm font-medium text-graphite hover:text-forest"
        >
          <ArrowLeft className="w-4 h-4" /> Membres de l&apos;association
        </Link>

        <div className="relative overflow-hidden rounded-2xl bg-forest p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                <Scale className="h-3.5 w-3.5" /> Modules 7.2 & 7.3 · Compensation
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {preview ? preview.memberName : "Solde de sortie"}
                {preview?.memberNumber ? (
                  <span className="ml-3 text-lg font-medium text-emerald-100/70">#{preview.memberNumber}</span>
                ) : null}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-100/70">
                Compensation automatique des amendes, sanctions, encours de prêts et collations
                impayées sur le capital épargne/investissement du membre.
              </p>
            </div>
            {preview && (
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100/60">
                  Solde net
                </div>
                <div className={`text-3xl font-black ${preview.net < 0 ? "text-red-300" : "text-gold"}`}>
                  {formatCurrency(preview.net)}
                </div>
                <div className="text-xs text-emerald-100/60">
                  {preview.net < 0 ? "Recouvrement requis" : "À verser au membre"}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">{error}</div>
        )}
        {message && (
          <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success">
            {message}
          </div>
        )}

        {loading || !preview ? (
          <div className="h-64 animate-pulse rounded-2xl bg-warm-white" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Avoirs", value: preview.assets, icon: Landmark },
                { label: "Dettes", value: preview.totalDebts, icon: Wallet },
                { label: "Net", value: preview.net, icon: HandCoins },
                { label: "Postes de dette", value: [preview.debtFines, preview.debtSanctions, preview.debtLoans, preview.debtCollation].filter((v) => v > 0).length, icon: FileText, raw: true },
              ].map((k) => (
                <Card key={k.label}>
                  <CardContent className="p-4">
                    <k.icon className="mb-2 h-4 w-4 text-gold" />
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ash">{k.label}</div>
                    <div className={`text-lg font-bold ${k.label === "Net" && preview.net < 0 ? "text-error" : "text-charcoal"}`}>
                      {k.raw ? k.value : formatCurrency(k.value)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {sections.map((s) => (
                  <Card key={s.key}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{s.title}</CardTitle>
                      <Badge variant={s.positive ? "success" : s.total > 0 ? "danger" : "default"}>
                        {s.positive ? "+" : "−"}
                        {formatCurrency(s.total)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      {s.lines.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-ash">Aucun élément.</p>
                      ) : (
                        <div className="divide-y divide-stone/50">
                          {s.lines.map((l) => (
                            <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                              <div>
                                <div className="text-sm font-medium text-charcoal">{l.label}</div>
                                {l.date && (
                                  <div className="text-xs text-ash">
                                    {new Date(l.date).toLocaleDateString("fr-FR")}
                                  </div>
                                )}
                              </div>
                              <span className={`text-sm font-semibold ${s.positive ? "text-forest" : "text-error"}`}>
                                {formatCurrency(l.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Traiter le solde</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash">
                        Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as "DEPARTURE" | "YEAR_END")}
                        className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                        disabled={!canManage}
                      >
                        <option value="DEPARTURE">Départ / démission</option>
                        <option value="YEAR_END">Clôture annuelle</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash">
                        Exercice
                      </label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                        disabled={!canManage}
                      />
                    </div>
                    {canManage ? (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          loading={busy === "SAVE"}
                          onClick={() => act("SAVE")}
                        >
                          <Save className="h-4 w-4" /> Enregistrer le calcul
                        </Button>
                        <Button
                          className="w-full"
                          loading={busy === "APPLY"}
                          onClick={() => act("APPLY")}
                        >
                          {type === "DEPARTURE" ? (
                            <>
                              <UserMinus className="h-4 w-4" /> Appliquer la sortie
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" /> Clôturer l&apos;exercice
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-ash">Réservé au bureau.</p>
                    )}
                    <Button variant="ghost" className="w-full" onClick={() => window.print()}>
                      <Printer className="h-4 w-4" /> Imprimer le relevé
                    </Button>
                  </CardContent>
                </Card>

                {preview.net < 0 && (
                  <div className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error">
                    <div className="mb-1 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" /> Recouvrement requis
                    </div>
                    <p className="text-xs leading-relaxed">
                      Les dettes dépassent les avoirs de {formatCurrency(Math.abs(preview.net))}. Un
                      document de recouvrement doit être émis avant la sortie.
                    </p>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Historique</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {history.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-ash">Aucun solde enregistré.</p>
                    ) : (
                      <div className="divide-y divide-stone/50">
                        {history.map((h) => (
                          <div key={h.id} className="px-5 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-charcoal">
                                {TYPE_LABELS[h.type] ?? h.type} {h.year ? `· ${h.year}` : ""}
                              </span>
                              <Badge variant={h.status === "APPLIED" ? "success" : "warning"}>
                                {h.status === "APPLIED" ? "Appliqué" : "Brouillon"}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-ash">
                              {formatCurrency(h.assets)} d&apos;avoirs · {formatCurrency(h.totalDebts)} de dettes ·{" "}
                              <span className={h.net < 0 ? "text-error" : "text-forest"}>net {formatCurrency(h.net)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
