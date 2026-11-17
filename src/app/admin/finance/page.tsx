"use client";

import { useState, useEffect } from "react";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { 
  Landmark, TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownRight, CreditCard, 
  BarChart3, PieChart, Calendar, Download,
  Filter, RefreshCw, AlertCircle, ShieldCheck
} from "lucide-react";

export default function AdminFinancePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminSectionTabs group="audit" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Audit Financier Global</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Surveillance des flux monétaires et performance économique de la plateforme.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-100 text-gray-600 text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" />
            Rapport PDF
          </button>
          <div className="h-10 w-px bg-gray-200 mx-1" />
          <select 
            value={timeRange} 
            onChange={e => setTimeRange(e.target.value)}
            className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-bold outline-none shadow-lg shadow-black/10"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">Trimestre</option>
            <option value="365d">Année</option>
          </select>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Volume Total des Transactions</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <div className="text-5xl font-black tracking-tighter">
                  {stats?.totalVolume.toLocaleString()} <span className="text-2xl text-slate-500">FCFA</span>
                </div>
                <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{stats?.monthlyGrowth}% par rapport au mois dernier</span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="px-6 py-4 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-sm">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Revenus Plateforme</div>
                  <div className="text-xl font-black text-blue-400">+{stats?.platformRevenue.toLocaleString()} <span className="text-xs">CFA</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">Santé : Excellente</div>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cotisations Collectées</div>
            <div className="text-3xl font-black text-gray-900">{stats?.totalContributions.toLocaleString()} <span className="text-sm font-medium">CFA</span></div>
          </div>
          
          <div className="pt-6 mt-6 border-t border-gray-50 flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                <span>Taux de recouvrement</span>
                <span className="text-emerald-600">85.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Loans & Credits */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-black text-gray-900">Crédits & Encours</h2>
              <p className="text-xs font-medium text-gray-400 mt-1">Analyse des fonds prêtés et risques associés.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
              <CreditCard className="w-4 h-4" />
              Monitoré
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total des Prêts Actifs</div>
                <div className="text-2xl font-black text-blue-900">{stats?.totalLoans.toLocaleString()} <span className="text-xs font-medium opacity-50">CFA</span></div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Taux de défaut</span>
                  <span className="text-red-500 font-black">1.2%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Intérêts générés</span>
                  <span className="text-emerald-600 font-black">2.4M CFA</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center p-8 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <div className="text-xs font-bold text-gray-400">Répartition Géographique</div>
                <div className="flex gap-2 mt-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-3 h-12 bg-blue-200 rounded-full" style={{ height: (20 + i * 15) + 'px' }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-black text-gray-900 mb-8">Répartition par Activité</h2>
          
          <div className="space-y-8">
            {stats?.distribution.map((item: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div>
                    <span className="text-sm font-black text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-400">{item.value}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: item.value + '%', background: item.color }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-[2rem] bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest">Conformité AML</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Toutes les transactions sont soumises à la vérification KYC et aux seuils de vigilance TRACFIN.
            </p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-red-50 border border-red-100">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <div className="text-sm font-black text-red-900 uppercase tracking-wider">Alerte Vigilance : Suspicion d&apos;Activités Atypiques</div>
          <p className="text-xs text-red-700/70 mt-1 font-medium">
            Le système a détecté <strong>3 flux entrants</strong> inhabituels dépassant les seuils de 1M CFA sur la région de l&apos;Extrême-Nord. Une revue manuelle est recommandée.
          </p>
        </div>
        <button className="ml-auto px-6 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
          Inspecter
        </button>
      </div>
    </div>
  );
}
