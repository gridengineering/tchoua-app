"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calculator, CheckCircle2, Coins, Heart, Info, Landmark, Trash2, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type Preview = {
  year: number;
  totalIn: number;
  totalOut: number;
  balance: number;
  deficit: number;
  membersCount: number;
  perMember: number;
  activities: Array<{ id: string; name: string }>;
  contributionsCount: number;
  aidsCount: number;
};

type Run = {
  id: string;
  year: number;
  totalIn: number;
  totalOut: number;
  balance: number;
  deficit: number;
  membersCount: number;
  perMember: number;
  status: "DRAFT" | "APPLIED";
  appliedAt?: string | null;
};

export default function SolidarityReconstitutionPage() {
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
      const res = await fetch(`/api/associations/${id}/solidarity/reconstitution?year=${year}`);
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
      const res = await fetch(`/api/associations/${id}/solidarity/reconstitution`, {
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

  const data = run ?? (preview ? { ...preview, status: "DRAFT" as const, appliedAt: null } : null);
  const isApplied = run?.status === "APPLIED";
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <DashboardLayout title="Reconstitution du fonds de solidarité">
      <div className="space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/associations/${id}/aides`}
            className="inline-flex items-center gap-2 text-sm font-medium text-graphite hover:text-forest"
          >
            <ArrowLeft className="w-4 h-4" /> Solidarité & aides
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
                <Heart className="h-3.5 w-3.5" /> Module 5.1 · Reconstitution annuelle
              </div>
              <h1 className="text-3xl font-black tracking-tight">Bilan solidarité {year}</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-100/70">
                Cotisations encaissées moins aides décaissées. En cas de déficit, le montant est
                réparti à parts égales entre les membres actifs sous forme d&apos;appel de
                cotisation.
              </p>
            </div>
            <Badge variant={isApplied ? "success" : run ? "warning" : "default"}>
              {isApplied ? "Appliqué" : run ? "Brouillon" : "Non calculé"}
            </Badge>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-warm-white" />
        ) : !preview?.activities.length ? (
          <Card>
            <CardContent className="px-6 py-14 text-center">
              <Heart className="mx-auto mb-3 h-10 w-10 text-stone" />
              <h3 className="text-lg font-bold text-charcoal">Aucune activité de solidarité</h3>
              <p className="mt-2 text-sm text-ash">
                Créez d&apos;abord une activité de type « Caisse de solidarité » pour suivre le fonds.
              </p>
              <Link href={`/associations/${id}/activities/new`}>
                <Button className="mt-5">Créer une activité solidarité</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Cotisations encaissées", value: formatCurrency(data?.totalIn ?? 0), icon: Coins },
                { label: "Aides décaissées", value: formatCurrency(data?.totalOut ?? 0), icon: Heart },
                {
                  label: data && data.balance < 0 ? "Déficit" : "Solde",
                  value: formatCurrency(Math.abs(data?.balance ?? 0)),
                  icon: Landmark,
                },
                { label: "Quote-part / membre", value: formatCurrency(data?.perMember ?? 0), icon: Users },
              ].map((k) => (
                <Card key={k.label}>
                  <CardContent className="p-4">
                    <k.icon className="mb-2 h-4 w-4 text-gold" />
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ash">{k.label}</div>
                    <div className={`text-lg font-bold ${k.label === "Déficit" ? "text-error" : "text-charcoal"}`}>
                      {k.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Détail de l&apos;exercice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-stone/60 pb-2">
                    <span className="text-ash">Cotisations de solidarité encaissées</span>
                    <span className="font-semibold">{formatCurrency(preview.totalIn)}</span>
                  </div>
                  <div className="text-xs text-ash">
                    {preview.contributionsCount} versement(s) sur {preview.activities.length} activité(s) :
                    {" "}
                    {preview.activities.map((a) => a.name).join(", ")}
                  </div>
                  <div className="flex justify-between border-b border-stone/60 pb-2 pt-2">
                    <span className="text-ash">Aides payées ({preview.aidsCount})</span>
                    <span className="font-semibold text-error">−{formatCurrency(preview.totalOut)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-semibold text-charcoal">Solde de l&apos;exercice</span>
                    <span className={`text-lg font-black ${preview.balance < 0 ? "text-error" : "text-forest"}`}>
                      {formatCurrency(preview.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ash">Membres actifs</span>
                    <span className="font-semibold">{preview.membersCount}</span>
                  </div>
                  {preview.deficit > 0 && (
                    <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
                      Déficit de {formatCurrency(preview.deficit)} réparti sur {preview.membersCount} membres,
                      soit {formatCurrency(preview.perMember)} par membre.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canManage ? (
                    <>
                      <Button
                        className="w-full"
                        variant="outline"
                        loading={busy === "COMPUTE"}
                        disabled={isApplied}
                        onClick={() => act("COMPUTE")}
                      >
                        <Calculator className="h-4 w-4" /> {run ? "Recalculer le bilan" : "Calculer le bilan"}
                      </Button>
                      <Button
                        className="w-full"
                        loading={busy === "APPLY"}
                        disabled={!run || isApplied || run.perMember <= 0}
                        onClick={() =>
                          act(
                            "APPLY",
                            `Créer un appel de cotisation de ${formatCurrency(run?.perMember ?? 0)} pour ${run?.membersCount ?? 0} membres ?`
                          )
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" /> Appliquer la reconstitution
                      </Button>
                      {run && !isApplied && (
                        <Button
                          className="w-full"
                          variant="ghost"
                          loading={busy === "DELETE"}
                          onClick={() => act("DELETE", "Supprimer ce brouillon ?")}
                        >
                          <Trash2 className="h-4 w-4" /> Supprimer le brouillon
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-ash">Réservé au bureau ou au trésorier.</p>
                  )}
                  {isApplied && run?.appliedAt && (
                    <p className="text-xs text-success">
                      Appliqué le {new Date(run.appliedAt).toLocaleDateString("fr-FR")} — les cotisations
                      en attente ont été créées pour les membres actifs.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-sm text-info">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Le calcul inclut les cotisations encaissées (statut payé) et les aides effectivement
                décaissées. L&apos;application crée une cotisation en attente par membre actif sur
                l&apos;activité de solidarité principale, exigible au 31 décembre.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
