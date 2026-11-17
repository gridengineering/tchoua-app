"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, BarChart3, Building2, CalendarDays,
  Coins, Landmark, RefreshCw, ShieldCheck, TrendingUp, Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssociationFinanceTabs } from "@/components/associations/association-finance-tabs";
import { ReportExportBar } from "@/components/associations/report-export-bar";
import { formatCurrency } from "@/lib/utils";

type StateReport = {
  association: {
    id: string; name: string; type: string; status: string; color: string; logo?: string | null;
    region?: string | null; email?: string | null; phone?: string | null; createdAt: string;
    trustScore: number; trustLevel: number; currency: string;
  };
  bureau: { name: string | null; role: string; email: string; memberNumber?: string | null }[];
  accounts: { id: string; label: string; type: string; bankName?: string | null; accountNumber?: string | null; accountHolder?: string | null; isDefault: boolean }[];
  recentMeetings: { id: string; title: string | null; scheduledAt: string; status: string; modality: string; location?: string | null }[];
  summary: {
    generatedAt: string;
    members: { total: number; active: number; bureau: number };
    finance: {
      activitiesTreasury: number; walletBalance: number; memberAvoir: number;
      totalContributions: number; totalBenefits: number; loanOutstanding: number;
      loanDisbursed: number; interestGenerated: number; dividendInterest: number;
      aidsPaid: number; aidEngagements: number; netPosition: number; globalCash: number;
    };
    activitiesCount: number; openActivities: number; closedActivities: number; sessionsCount: number;
  };
  activities: {
    id: string; name: string; type: string; status: string; contributionAmount: number;
    caisseBalance: number; contributionsPaid: number; contributionsCount: number;
    benefitsPaid: number; activeLoans: number; outstandingLoans: number; totalLoansDisbursed: number;
  }[];
  rows: Record<string, unknown>[];
  generatedAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  FOUNDER: "Fondateur", PRESIDENT: "Président", VICE_PRESIDENT: "Vice-président",
  SECRETARY: "Secrétaire général", SECRETARY_ADJ: "Secrétaire adjoint",
  TREASURER: "Trésorier", TREASURER_ADJ: "Trésorier adjoint", CENSOR: "Censeur",
  AUDITOR: "Commissaire aux comptes", SOLIDARITY_OFFICER: "Chargé de solidarité", MEMBER: "Membre",
};

const TYPE_LABEL: Record<string, string> = {
  TONTINE_ROTATIVE: "Tontine rotative", TONTINE_ASCA: "Tontine ASCA",
  TONTINE_ENCHERES: "Tontine aux enchères", EPARGNE: "Épargne", AIDE_SOLIDAIRE: "Aide solidaire",
  PRET: "Prêt", NATURE: "Nature", INVESTISSEMENT: "Investissement",
  ACHATS_GROUPES: "Achats groupés", COLLECTION: "Collecte",
};

const money = (value: number | null | undefined) => formatCurrency(Number(value ?? 0));
const dateFr = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />
      {active ? "Active" : status === "CLOSED" ? "Clôturée" : status}
    </span>
  );
}

export default function RapportsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StateReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/associations/${id}/reports/state`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Rapport indisponible");
      setData(payload);
    } catch (e: any) {
      setError(e?.message ?? "Rapport indisponible");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardLayout title="Rapports">
      <AssociationFinanceTabs associationId={id} />
      <div className="space-y-6 pb-14 animate-in fade-in duration-500">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d3d28] via-[#0b3523] to-[#051f14] p-7 text-white shadow-xl md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#d4a343]/20 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f4d38a]">
                <SparkleIcon /> Rapport de l'association en l'état
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Situation consolidée</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-50/70">
                Une photographie fiable de {data?.association.name ?? "votre association"} : membres, caisses, activités,
                engagements et flux financiers, au {data ? dateFr(data.generatedAt) : "moment présent"}.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-50/80">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{data?.summary.members.active ?? "—"} membre(s) actif(s)</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{data?.summary.activitiesCount ?? "—"} activité(s)</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{data?.summary.sessionsCount ?? 0} session(s)</span>
              </div>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/95 p-3 text-[#16211b] shadow-lg">
              <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#66736b]">Exporter / imprimer</p>
              <ReportExportBar associationId={id} section="state" />
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-stone bg-white" />)}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div><strong>Impossible de charger le rapport.</strong><p className="mt-1 text-xs">{error}</p></div>
            </div>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100">
              <RefreshCw className="h-3.5 w-3.5" /> Réessayer
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi icon={Wallet} label="Trésorerie globale" value={money(data.summary.finance.globalCash)} hint="Caisse activités + wallet" accent="emerald" />
              <Kpi icon={Coins} label="Avoirs des membres" value={money(data.summary.finance.memberAvoir)} hint="Comptes AVOIR ouverts" accent="amber" />
              <Kpi icon={TrendingUp} label="Encours de prêts" value={money(data.summary.finance.loanOutstanding)} hint={`${data.activities.reduce((s, a) => s + a.activeLoans, 0)} prêt(s) actif(s)`} accent="blue" />
              <Kpi icon={ArrowUpRight} label="Cotisations encaissées" value={money(data.summary.finance.totalContributions)} hint={`${data.summary.members.active} membre(s)`} accent="violet" />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
              <section className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-charcoal">Situation financière</h2>
                    <p className="mt-1 text-xs text-ash">Les équilibres clés à la date du rapport.</p>
                  </div>
                  <Building2 className="h-5 w-5 text-[#0d3d28]" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Caisse des activités" value={money(data.summary.finance.activitiesTreasury)} />
                  <MiniStat label="Wallet association" value={money(data.summary.finance.walletBalance)} />
                  <MiniStat label="Prêts décaissés" value={money(data.summary.finance.loanDisbursed)} />
                  <MiniStat label="Intérêts générés" value={money(data.summary.finance.interestGenerated)} />
                  <MiniStat label="Bénéfices distribués" value={money(data.summary.finance.totalBenefits)} />
                  <MiniStat label="Dividendes calculés" value={money(data.summary.finance.dividendInterest)} />
                  <MiniStat label="Aides payées" value={money(data.summary.finance.aidsPaid)} />
                  <MiniStat label="Aides à payer" value={money(data.summary.finance.aidEngagements)} />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f6f3ec] px-4 py-3">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-ash">Position nette</p><p className="text-xs text-ash">Trésorerie + créances − avoirs − aides</p></div>
                  <p className="text-lg font-black text-[#0d3d28]">{money(data.summary.finance.netPosition)}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-charcoal">Identité & gouvernance</h2>
                    <p className="mt-1 text-xs text-ash">Le cadre associatif et les responsables.</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[#0d3d28]" />
                </div>
                <dl className="space-y-2 text-xs">
                  <Row label="Statut" value={data.association.status} />
                  <Row label="Type" value={data.association.type} />
                  <Row label="Créée le" value={dateFr(data.association.createdAt)} />
                  <Row label="Région" value={data.association.region ?? "—"} />
                  <Row label="Confiance" value={`${data.association.trustScore}/100 · niveau ${data.association.trustLevel}`} />
                  <Row label="Membres" value={`${data.summary.members.total} suivis · ${data.summary.members.active} actifs`} />
                </dl>
                <div className="mt-4 border-t border-stone pt-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-ash">Bureau</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.bureau.length ? data.bureau.map((m) => (
                      <span key={`${m.role}-${m.email}`} className="rounded-full bg-[#f6f3ec] px-2.5 py-1 text-[10px] font-semibold text-graphite">
                        {m.name ?? m.email} · {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    )) : <span className="text-xs text-ash">Aucun membre du bureau renseigné.</span>}
                  </div>
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-stone bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-stone px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-black text-charcoal">Activités & caisses</h2>
                  <p className="mt-1 text-xs text-ash">Chaque activité tient son propre solde et son historique.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{data.summary.openActivities} active(s)</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">{data.summary.closedActivities} clôturée(s)</span>
                  <Link href={`/associations/${id}/comptes`} className="rounded-full border border-stone px-2.5 py-1 text-[10px] font-bold text-graphite hover:bg-cream">Comptes</Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead><tr className="border-b border-stone bg-[#faf8f2] text-[9px] uppercase tracking-[0.15em] text-ash">
                    <th className="px-5 py-3">Activité</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3 text-right">Caisse</th>
                    <th className="px-3 py-3 text-right">Cotisations</th><th className="px-3 py-3 text-right">Bénéfices</th><th className="px-5 py-3 text-right">Encours prêts</th>
                  </tr></thead>
                  <tbody>
                    {data.activities.map((activity) => (
                      <tr key={activity.id} className="border-b border-stone/70 last:border-0 hover:bg-[#fcfbf7]">
                        <td className="px-5 py-3.5"><p className="font-bold text-charcoal">{activity.name}</p><p className="mt-0.5 text-[10px] text-ash">{TYPE_LABEL[activity.type] ?? activity.type} · {activity.contributionsCount} versement(s)</p></td>
                        <td className="px-3 py-3.5"><StatusBadge status={activity.status} /></td>
                        <td className="px-3 py-3.5 text-right font-bold text-[#0d3d28]">{money(activity.caisseBalance)}</td>
                        <td className="px-3 py-3.5 text-right text-graphite">{money(activity.contributionsPaid)}</td>
                        <td className="px-3 py-3.5 text-right text-graphite">{money(activity.benefitsPaid)}</td>
                        <td className="px-5 py-3.5 text-right text-graphite">{money(activity.outstandingLoans)}</td>
                      </tr>
                    ))}
                    {!data.activities.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-ash">Aucune activité configurée.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-black text-charcoal">Comptes & coordonnées</h2><Landmark className="h-5 w-5 text-[#0d3d28]" /></div>
                <div className="space-y-3">
                  {data.accounts.map((account) => (
                    <div key={account.id} className="rounded-xl border border-stone p-3.5">
                      <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-charcoal">{account.label}</p><span className="text-[9px] font-black uppercase tracking-wider text-ash">{account.type}</span></div>
                      <p className="mt-0.5 text-[11px] text-ash">{account.bankName ?? "—"} {account.accountNumber ? `· ${account.accountNumber}` : ""}</p>
                      {account.accountHolder && <p className="mt-0.5 text-[10px] text-ash">Titulaire : {account.accountHolder}</p>}
                    </div>
                  ))}
                  {!data.accounts.length && <p className="text-xs text-ash">Aucun compte bancaire déclaré.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-black text-charcoal">Dernières sessions</h2><CalendarDays className="h-5 w-5 text-[#0d3d28]" /></div>
                <div className="space-y-2">
                  {data.recentMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#faf8f2] px-3 py-2.5">
                      <div><p className="text-xs font-bold text-charcoal">{meeting.title ?? "Session ordinaire"}</p><p className="text-[10px] text-ash">{dateFr(meeting.scheduledAt)} · {meeting.modality}</p></div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-ash">{meeting.status}</span>
                    </div>
                  ))}
                  {!data.recentMeetings.length && <p className="text-xs text-ash">Aucune session de réunion enregistrée.</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SparkleIcon() {
  return <BarChart3 className="h-3.5 w-3.5" />;
}

function Kpi({ icon: Icon, label, value, hint, accent }: { icon: any; label: string; value: string; hint: string; accent: "emerald" | "amber" | "blue" | "violet" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  }[accent];
  return (
    <div className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-ash">{label}</p><span className={`rounded-xl p-2 ${styles}`}><Icon className="h-4 w-4" /></span></div>
      <p className="mt-3 text-xl font-black tracking-tight text-charcoal">{value}</p>
      <p className="mt-1 text-[10px] text-ash">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#faf8f2] px-3.5 py-3"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-ash">{label}</p><p className="mt-1 text-sm font-black text-charcoal">{value}</p></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 border-b border-stone/60 pb-2 last:border-0 last:pb-0"><dt className="text-ash">{label}</dt><dd className="text-right font-semibold text-graphite">{value}</dd></div>;
}
