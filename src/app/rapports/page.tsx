"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import { Download, AlertTriangle, CheckCircle2, Loader2, Users, Wallet, CreditCard, PiggyBank } from "lucide-react";

interface TontineRow { tontineId: string; tontineName: string; tontineType: string; role: string; joinedAt: string | null; totalContributed: number; totalReceived: number; netBalance: number; loanBalance: number; totalLate: number; currency: string; }
interface MonthRow { month: string; contributed: number; received: number; }
interface SavingsRow { name: string; targetAmount: number; currentAmount: number; status: string; }
interface Report { summary: { tontineCount: number; totalContributed: number; totalLate: number; activeLoanTotal: number; totalSavings: number; }; tontineBreakdown: TontineRow[]; monthlyEvolution: MonthRow[]; savingsGoals: SavingsRow[]; scoreByCat: Record<string, number>; }

const ROLES: Record<string, string> = { PRESIDENT: "Président", TREASURER: "Trésorier", SECRETARY: "Secrétaire", MEMBER: "Membre" };
const SCORE_META: Record<string, { label: string; target: number }> = {
  FINANCIAL_RELIABILITY: { label: "Fiabilité Financière", target: 40 },
  SOLIDARITY: { label: "Solidarité", target: 30 },
  NATURE_SERVICES: { label: "Nature & Services", target: 20 },
  COMPLIANCE_ETHICS: { label: "Conformité & Éthique", target: 10 },
};

export default function RapportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "tontines" | "monthly" | "score">("overview");

  useEffect(() => {
    fetch("/api/reports/consolidated").then((r) => r.json()).then((d) => { setReport(d); setLoading(false); });
  }, []);

  const exportCSV = () => {
    if (!report) return;
    const rows = [["Tontine","Type","Rôle","Cotisé","Reçu","Balance","Prêt"], ...report.tontineBreakdown.map((t) => [t.tontineName, t.tontineType, ROLES[t.role]||t.role, t.totalContributed, t.totalReceived, t.netBalance, t.loanBalance])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rapport_tchoua.csv"; a.click();
  };

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div></DashboardLayout>;
  if (!report) return null;

  const { summary, tontineBreakdown, monthlyEvolution, savingsGoals, scoreByCat } = report;
  const maxM = Math.max(...monthlyEvolution.map((m) => Math.max(m.contributed, m.received)), 1);
  const totalScore = Object.values(scoreByCat).reduce((s, v) => s + v, 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1><p className="text-graphite text-sm">Vue consolidée multi-tontines</p></div>
          <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-cream"><Download className="w-4 h-4" /> Exporter CSV</button>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
          {[{id:"overview",label:"Vue globale"},{id:"tontines",label:"Par tontine"},{id:"monthly",label:"Évolution"},{id:"score",label:"Score"}].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab===t.id?"bg-warm-white text-violet-600 shadow-sm":"text-gray-600 hover:text-gray-900"}`}>{t.label}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total cotisé", value: formatCurrency(summary.totalContributed), icon: Wallet, color: "bg-violet-500" },
                { label: "Prêts en cours", value: formatCurrency(summary.activeLoanTotal), icon: CreditCard, color: "bg-warning" },
                { label: "Épargne totale", value: formatCurrency(summary.totalSavings), icon: PiggyBank, color: "bg-green-500" },
                { label: "Tontines actives", value: summary.tontineCount.toString(), icon: Users, color: "bg-info" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-warm-white rounded-xl p-4 shadow-sm border border-stone">
                  <div className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center mb-3`}><kpi.icon className="w-5 h-5 text-white" /></div>
                  <div className="text-xl font-bold text-gray-900">{kpi.value}</div>
                  <div className="text-xs text-graphite">{kpi.label}</div>
                </div>
              ))}
            </div>

            {summary.totalLate > 0 ? (
              <div className="bg-error/10 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold text-red-800">Cotisations en retard</div><p className="text-sm text-red-600">{summary.totalLate} cotisation(s) en retard. Réglez-les pour protéger votre score.</p></div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold text-green-800">Situation financière saine ✅</div><p className="text-sm text-green-600">Aucun retard, continuez sur cette lancée !</p></div>
              </div>
            )}

            <div className="bg-warm-white rounded-xl shadow-sm border border-stone p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Balance nette par tontine</h3>
              <div className="space-y-3">
                {tontineBreakdown.map((t) => {
                  const maxAbs = Math.max(...tontineBreakdown.map((x) => Math.abs(x.netBalance)), 1);
                  const pct = Math.abs(t.netBalance) / maxAbs * 100;
                  return (
                    <div key={t.tontineId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium truncate max-w-xs">{t.tontineName}</span>
                        <span className={`font-semibold ${t.netBalance >= 0 ? "text-green-600" : "text-error"}`}>{t.netBalance >= 0 ? "+" : ""}{formatCurrency(t.netBalance)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${t.netBalance >= 0 ? "bg-green-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {savingsGoals.length > 0 && (
              <div className="bg-warm-white rounded-xl shadow-sm border border-stone p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Objectifs d&apos;épargne</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savingsGoals.map((g, i) => {
                    const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                    return (
                      <div key={i} className="bg-cream rounded-lg p-3">
                        <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-800">{g.name}</span><span className="text-xs text-violet-600">{Math.round(pct)}%</span></div>
                        <div className="h-1.5 bg-gray-200 rounded-full"><div className={`h-full rounded-full ${g.status === "COMPLETED" ? "bg-green-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} /></div>
                        <div className="flex justify-between text-xs text-ash mt-1"><span>{formatCurrency(g.currentAmount)}</span><span>{formatCurrency(g.targetAmount)}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "tontines" && (
          <div className="space-y-4">
            {tontineBreakdown.map((t) => (
              <div key={t.tontineId} className="bg-warm-white rounded-xl shadow-sm border border-stone p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{t.tontineName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{t.tontineType}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ROLES[t.role]||t.role}</span>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${t.netBalance >= 0 ? "text-green-600" : "text-error"}`}>{t.netBalance >= 0 ? "+" : ""}{formatCurrency(t.netBalance)}</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total cotisé", value: formatCurrency(t.totalContributed), color: "text-violet-600" },
                    { label: "Total reçu", value: formatCurrency(t.totalReceived), color: "text-green-600" },
                    { label: "Prêt en cours", value: formatCurrency(t.loanBalance), color: "text-warning" },
                    { label: "Retards", value: t.totalLate.toString(), color: t.totalLate > 0 ? "text-error" : "text-gray-600" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-cream rounded-lg p-3 text-center">
                      <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-ash">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "monthly" && (
          <div className="bg-warm-white rounded-xl shadow-sm border border-stone p-5">
            <h3 className="font-semibold text-gray-900 mb-6">Évolution mensuelle (12 derniers mois)</h3>
            <div className="flex items-end gap-1 h-48">
              {monthlyEvolution.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="flex-1 flex items-end gap-0.5 w-full">
                    <div className="flex-1 bg-violet-400 rounded-t-sm min-h-[2px]" style={{ height: `${(m.contributed / maxM) * 100}%` }} />
                    <div className="flex-1 bg-green-400 rounded-t-sm min-h-[2px]" style={{ height: `${(m.received / maxM) * 100}%` }} />
                  </div>
                  <div className="text-xs text-ash truncate w-full text-center">{m.month.slice(5)}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-600"><div className="w-3 h-3 bg-violet-400 rounded-sm" /> Cotisé</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><div className="w-3 h-3 bg-green-400 rounded-sm" /> Reçu</div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-graphite">Mois</th><th className="text-right py-2 text-graphite">Cotisé</th><th className="text-right py-2 text-graphite">Reçu</th><th className="text-right py-2 text-graphite">Net</th></tr></thead>
                <tbody>
                  {[...monthlyEvolution].reverse().map((m) => (
                    <tr key={m.month} className="border-b border-stone hover:bg-cream">
                      <td className="py-2 text-gray-700">{m.month}</td>
                      <td className="py-2 text-right text-violet-600">{formatCurrency(m.contributed)}</td>
                      <td className="py-2 text-right text-green-600">{formatCurrency(m.received)}</td>
                      <td className={`py-2 text-right font-medium ${m.received-m.contributed>=0?"text-green-600":"text-error"}`}>{m.received-m.contributed>=0?"+":""}{formatCurrency(m.received-m.contributed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "score" && (
          <div className="space-y-6">
            <div className="bg-warm-white rounded-xl shadow-sm border border-stone p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Répartition du score</h3>
              <div className="space-y-4">
                {Object.entries(SCORE_META).map(([key, info]) => {
                  const pts = scoreByCat[key] || 0;
                  const pct = totalScore > 0 ? Math.round((pts / totalScore) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-800">{info.label}</span><span className="text-xs text-ash">(objectif {info.target}%)</span></div>
                        <div className="flex items-center gap-2"><span className="text-sm font-bold text-violet-600">{pts} pts</span><span className="text-xs text-ash">{pct}%</span></div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-stone flex items-center justify-between"><span className="font-semibold text-gray-900">Score total</span><span className="text-2xl font-bold text-violet-600">{totalScore} pts</span></div>
            </div>

            <div className="bg-warm-white rounded-xl shadow-sm border border-stone p-5">
              <h3 className="font-semibold text-gray-900 mb-6">Progression des niveaux</h3>
              <div className="flex items-center justify-around">
                {[
                  { name: "Novice", min: 0, max: 100, color: "bg-gray-400" },
                  { name: "Actif", min: 100, max: 250, color: "bg-green-400" },
                  { name: "Engagé", min: 250, max: 500, color: "bg-blue-400" },
                  { name: "Leader", min: 500, max: 1000, color: "bg-violet-500" },
                  { name: "Légende", min: 1000, max: Infinity, color: "bg-yellow-400" },
                ].map((level, i) => {
                  const isPassed = level.max !== Infinity && totalScore >= level.max;
                  const isActive = totalScore >= level.min && (level.max === Infinity || totalScore < level.max);
                  return (
                    <div key={level.name} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${isPassed ? level.color : isActive ? `${level.color} ring-4 ring-offset-2 ring-violet-300` : "bg-gray-200"}`}>{isPassed ? "✓" : i + 1}</div>
                      <div className={`text-xs mt-1.5 font-medium ${isActive ? "text-violet-700" : isPassed ? "text-gray-700" : "text-ash"}`}>{level.name}</div>
                      <div className="text-xs text-ash">{level.min}+</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
