"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, ChevronLeft, Download, TrendingUp, Users, Activity, Star, Wallet, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";

type ReportType = "ACTIVITY" | "MEMBER" | "CROSS" | "INVESTMENT";

interface InvestmentDashboard {
  capitalTotal: number; pretEnCours: number; pretCumule: number;
  remboursementsRecus: number; interetsGeneres: number; soldeDisponible: number;
}
interface InvestmentMember {
  membershipId: string; memberNumber?: string; name: string; joinedAt: string;
  versementInitial: number; gainInteret: number; capitalCumule: number; partPct: number;
}
interface InvestmentLoan {
  id: string; member: string; amount: number; rate: number; duration: number;
  disbursedAt: string|null; dueDate: string|null;
  interest: number; totalDue: number; repaid: number; encours: number; status: string;
}

interface ActivityStat {
  id: string;
  name: string;
  type: string;
  totalContributions: number;
  totalContributionsAmount: number;
  totalBeneficiaries: number;
  totalBeneficiariesAmount: number;
  caisseBalance: number;
  activeLoans: number;
  activeLoanAmount: number;
  memberCount: number;
}

interface MemberStat {
  membershipId: string;
  name: string;
  email: string;
  role: string;
  memberNumber?: string;
  reliabilityScore: number;
  activitiesCount: number;
  totalContributed: number;
  totalReceived: number;
  attendedMeetings: number;
  lateCount: number;
  absentCount: number;
}

interface CrossReport {
  associations: {
    id: string;
    name: string;
    type: string;
    memberCount: number;
    myRole: string;
    totalContributed: number;
    totalReceived: number;
    reliabilityScore: number;
  }[];
  globalScore: number;
}

interface ReportData {
  type: ReportType;
  generatedAt: string;
  activities?: ActivityStat[];
  members?: MemberStat[];
  cross?: CrossReport;
  dashboard?: InvestmentDashboard;
  loans?: InvestmentLoan[];
  investmentMembers?: InvestmentMember[];
}

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#d4a343";
  return "#ef4444";
};

export default function RapportsPage() {
  const params = useParams<{ id: string }>();
  const assocId = params.id;
  const router = useRouter();

  const [reportType, setReportType] = useState<ReportType>("ACTIVITY");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (type: ReportType) => {
    setLoading(true);
    const res = await fetch(`/api/associations/${assocId}/reports?type=${type}`);
    if (res.ok) {
      const data = await res.json();
      if (data.type === "INVESTMENT" && Array.isArray(data.members)) {
        data.investmentMembers = data.members;
        delete data.members;
      }
      setReport(data);
    }
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(reportType); }, [load, reportType]);

  const switchType = (t: ReportType) => {
    setReportType(t);
    load(t);
  };

  const exportCSV = () => {
    if (!report) return;
    let rows: string[] = [];
    if (report.type === "ACTIVITY" && report.activities) {
      rows = [
        "Activité,Type,Cotisations,Montant cotisé,Bénéficiaires,Montant distribué,Solde caisse,Prêts actifs",
        ...report.activities.map(a =>
          `"${a.name}",${a.type},${a.totalContributions},${a.totalContributionsAmount},${a.totalBeneficiaries},${a.totalBeneficiariesAmount},${a.caisseBalance},${a.activeLoans}`
        ),
      ];
    } else if (report.type === "MEMBER" && report.members) {
      rows = [
        "Membre,Rôle,Score fiabilité,Cotisé,Reçu,Réunions,Retards,Absences",
        ...report.members.map(m =>
          `"${m.name || m.email}",${m.role},${m.reliabilityScore},${m.totalContributed},${m.totalReceived},${m.attendedMeetings},${m.lateCount},${m.absentCount}`
        ),
      ];
    }
    if (rows.length === 0) return;
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${report.type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Analyses & Rapports">
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-gold">Intelligence Financière</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Analyses & Rapports</h1>
              <p className="text-emerald-100/60 font-medium leading-relaxed max-w-xl">
                Visualisez la santé financière de votre association, suivez la performance 
                des activités et évaluez la fiabilité des membres en temps réel.
              </p>
            </div>
            <button onClick={exportCSV} disabled={!report || report.type === "CROSS"}
              className="bg-warm-white text-[#0d3d28] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50">
              <Download className="w-4 h-4" /> Exporter le rapport
            </button>
          </div>
        </div>

        {/* Tabs Selection */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-warm-white rounded-2xl border border-stone shadow-sm w-fit">
          {([
            { type: "ACTIVITY" as const, label: "Activités", icon: Activity },
            { type: "MEMBER" as const, label: "Membres", icon: Users },
            { type: "INVESTMENT" as const, label: "Fonds d'investissement", icon: Wallet },
            { type: "CROSS" as const, label: "Multi-associations", icon: Star },
          ]).map(({ type, label, icon: Icon }) => (
            <button key={type} onClick={() => switchType(type)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] text-xs font-medium text-ash uppercase tracking-wider transition-all ${
                reportType === type ? 'bg-forest text-white shadow-lg' : 'text-ash hover:text-gray-600 hover:bg-cream'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-warm-white rounded-2xl border border-stone animate-pulse" />
            ))}
          </div>
        ) : !report ? (
          <div className="py-20 text-center">
            <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-graphite font-bold">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {/* ACTIVITY REPORT */}
            {report.type === "ACTIVITY" && report.activities && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {report.activities.map(a => (
                  <div key={a.id} className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-semibold text-charcoal mb-1">{a.name}</h3>
                        <div className="text-[10px] font-black text-gold uppercase tracking-widest">{a.type} · {a.memberCount} Membres</div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-black">
                        {a.memberCount}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-[#f7f3eb]">
                        <div className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Cotisations</div>
                        <div className="text-lg font-black text-[#0d3d28]">{formatCurrency(a.totalContributionsAmount)}</div>
                        <div className="text-[9px] font-black text-ash">{a.totalContributions} versements</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#f7f3eb]">
                        <div className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Distributions</div>
                        <div className="text-lg font-black text-[#d4a343]">{formatCurrency(a.totalBeneficiariesAmount)}</div>
                        <div className="text-[9px] font-black text-ash">{a.totalBeneficiaries} bénéficiaires</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#f7f3eb]">
                        <div className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Solde Caisse</div>
                        <div className="text-lg font-black text-info">{formatCurrency(a.caisseBalance)}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#f7f3eb]">
                        <div className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Prêts Actifs</div>
                        <div className="text-lg font-black text-red-600">{formatCurrency(a.activeLoanAmount)}</div>
                        <div className="text-[9px] font-black text-ash">{a.activeLoans} emprunts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MEMBER REPORT */}
            {report.type === "MEMBER" && report.members && (
              <div className="bg-warm-white rounded-2xl border border-stone shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-cream/50">
                        <th className="px-8 py-6 text-[10px] font-black text-ash uppercase tracking-widest">Membre</th>
                        <th className="px-8 py-6 text-[10px] font-black text-ash uppercase tracking-widest">Score</th>
                        <th className="px-8 py-6 text-[10px] font-black text-ash uppercase tracking-widest text-right">Cotisé</th>
                        <th className="px-8 py-6 text-[10px] font-black text-ash uppercase tracking-widest text-right">Reçu</th>
                        <th className="px-8 py-6 text-[10px] font-black text-ash uppercase tracking-widest text-center">Présence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {report.members.map(m => (
                        <tr key={m.membershipId} className="hover:bg-cream/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-semibold text-charcoal">{m.name || m.email}</div>
                            <div className="text-[10px] font-black text-gold uppercase tracking-widest">{m.role}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${m.reliabilityScore}%`, background: SCORE_COLOR(m.reliabilityScore) }}></div>
                              </div>
                              <span className="font-black text-sm" style={{ color: SCORE_COLOR(m.reliabilityScore) }}>{m.reliabilityScore}%</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right font-semibold text-charcoal">{formatCurrency(m.totalContributed)}</td>
                          <td className="px-8 py-6 text-right font-black text-forest">{formatCurrency(m.totalReceived)}</td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center gap-4 text-[10px] font-black">
                              <div className="text-center">
                                <div className="text-ash uppercase tracking-widest">Réunions</div>
                                <div className="text-gray-900">{m.attendedMeetings}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-ash uppercase tracking-widest">Retards</div>
                                <div className="text-error">{m.lateCount}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INVESTMENT REPORT */}
            {report.type === "INVESTMENT" && report.dashboard && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                   {[
                    { label: "Capital total",        value: report.dashboard.capitalTotal,       color: "#0d3d28", icon: Wallet },
                    { label: "Prêts en cours",       value: report.dashboard.pretEnCours,        color: "#ef4444", icon: TrendingUp },
                    { label: "Intérêts générés",     value: report.dashboard.interetsGeneres,    color: "#d4a343", icon: Sparkles },
                    { label: "Solde disponible",     value: report.dashboard.soldeDisponible,    color: "#22c55e", icon: BarChart3 },
                    { label: "Remboursements reçus", value: report.dashboard.remboursementsRecus, color: "#3b82f6", icon: Users },
                    { label: "Prêt cumulé",          value: report.dashboard.pretCumule,         color: "#7c2d12", icon: Activity },
                  ].map(card => (
                    <div key={card.label} className="bg-warm-white rounded-xl p-8 border border-stone shadow-sm flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: card.color }}>
                         <card.icon className="w-6 h-6" />
                       </div>
                       <div>
                         <div className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">{card.label}</div>
                         <div className="text-xl font-semibold text-charcoal">{formatCurrency(card.value)}</div>
                       </div>
                    </div>
                  ))}
                </div>

                {report.investmentMembers && (
                  <div className="bg-warm-white rounded-2xl border border-stone shadow-sm overflow-hidden">
                    <div className="px-8 py-6 bg-cream/50 border-b border-stone text-[10px] text-xs font-medium text-ash uppercase tracking-wider text-[#0d3d28]">Quote-part des investisseurs</div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                        <thead>
                          <tr className="bg-cream/30">
                            <th className="px-8 py-4 text-[9px] font-black text-ash uppercase tracking-widest">Investisseur</th>
                            <th className="px-8 py-4 text-[9px] font-black text-ash uppercase tracking-widest text-right">Part %</th>
                            <th className="px-8 py-4 text-[9px] font-black text-ash uppercase tracking-widest text-right">Capital</th>
                            <th className="px-8 py-4 text-[9px] font-black text-ash uppercase tracking-widest text-right">Gains</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {report.investmentMembers.map(m => (
                             <tr key={m.membershipId}>
                               <td className="px-8 py-5">
                                 <div className="font-semibold text-charcoal">{m.name}</div>
                                 <div className="text-[9px] font-black text-ash">Depuis {new Date(m.joinedAt).toLocaleDateString()}</div>
                               </td>
                               <td className="px-8 py-5 text-right font-black text-gray-600">{m.partPct.toFixed(2)} %</td>
                               <td className="px-8 py-5 text-right font-black text-[#0d3d28]">{formatCurrency(m.capitalCumule)}</td>
                               <td className="px-8 py-5 text-right font-black text-[#d4a343]">+{formatCurrency(m.gainInteret)}</td>
                             </tr>
                           ))}
                        </tbody>
                       </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* CROSS-ASSOCIATION REPORT */}
            {report.type === "CROSS" && report.cross && (
              <div className="space-y-6 max-w-4xl mx-auto">
                 <div className="bg-gradient-to-r from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white flex items-center gap-10">
                    <div className="w-32 h-32 rounded-full border-8 border-white/10 flex items-center justify-center relative">
                       <div className="absolute inset-2 rounded-full border-4 border-[#e68a00] border-t-transparent animate-spin duration-[3s]"></div>
                       <div className="text-center">
                         <div className="text-4xl font-black">{report.cross.globalScore}</div>
                         <div className="text-[9px] font-black opacity-60 uppercase tracking-widest">Global</div>
                       </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black mb-2 tracking-tight">Indice de Fiabilité Transversal</h2>
                      <p className="text-emerald-100/60 text-sm font-medium leading-relaxed">
                        Ce score est calculé sur l'ensemble de vos participations dans toutes les associations 
                        du réseau TCHOUA. Il reflète votre engagement global et votre ponctualité.
                      </p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                   {report.cross.associations.map(a => (
                     <div key={a.id} className="bg-warm-white rounded-3xl p-6 border border-stone shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                       <div className="flex items-center gap-6">
                         <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-2xl font-black text-[#0d3d28]">
                           {a.name[0]}
                         </div>
                         <div>
                            <h4 className="font-semibold text-charcoal group-hover:text-[#0d3d28] transition-colors">{a.name}</h4>
                            <div className="text-[10px] font-black text-ash uppercase tracking-widest">{a.myRole} · {a.type}</div>
                         </div>
                       </div>
                       <div className="flex gap-10 items-center">
                          <div className="text-right">
                            <div className="text-[9px] font-black text-ash uppercase tracking-widest">Score local</div>
                            <div className="font-black text-sm" style={{ color: SCORE_COLOR(a.reliabilityScore) }}>{a.reliabilityScore}%</div>
                          </div>
                          <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full" style={{ width: `${a.reliabilityScore}%`, background: SCORE_COLOR(a.reliabilityScore) }}></div>
                          </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
