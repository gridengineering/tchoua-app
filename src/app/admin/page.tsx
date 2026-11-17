"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  MoreHorizontal,
  Circle,
  History,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard/stats")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = data?.stats || [
    { label: "Utilisateurs Système", value: "...", change: "0", isUp: true, icon: ShieldCheck, color: "bg-blue-600" },
    { label: "Associations Actives", value: "...", change: "0", isUp: true, icon: Building2, color: "bg-emerald-600" },
    { label: "Membres Totaux", value: "...", change: "0", isUp: true, icon: Users, color: "bg-slate-900" },
    { label: "Transactions (24h)", value: "...", change: "0%", isUp: true, icon: TrendingUp, color: "bg-amber-500" },
  ];

  const recentLogs = data?.recentLogs || [];
  const pendingValidations: Array<{ id: string; type: string; amount: string; association: string; maker: string; date: string }> = data?.pendingValidations || [];

  const statIcons: any = {
    "Utilisateurs Système": ShieldCheck,
    "Associations Actives": Building2,
    "Membres Totaux": Users,
    "Transactions (24h)": TrendingUp,
  };

  const statColors: any = {
    "Utilisateurs Système": "bg-blue-600",
    "Associations Actives": "bg-emerald-600",
    "Membres Totaux": "bg-slate-900",
    "Transactions (24h)": "bg-amber-500",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Console d&apos;Administration</h1>
          <p className="text-gray-500 mt-1 font-medium">Supervision globale et indicateurs de performance plateforme</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">Tous les services opérationnels</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any) => {
          const Icon = statIcons[stat.label] || Activity;
          const color = statColors[stat.label] || "bg-blue-600";
          return (
            <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                {loading ? (
                  <Loader2 className="w-4 h-4 text-gray-200 animate-spin" />
                ) : (
                  <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${stat.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="text-2xl font-black text-gray-900">{loading ? "..." : stat.value}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Logs */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <History className="w-6 h-6 text-blue-600" />
              Journal d&apos;Audit Récent
            </h2>
            <Link href="/admin/audit" className="text-xs font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-1 uppercase tracking-widest">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
            ) : recentLogs.length === 0 ? (
              <div className="p-20 text-center text-gray-400 font-bold">Aucune activité récente</div>
            ) : recentLogs.map((log: any) => (
              <div key={log.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    log.type === "success" ? "bg-green-500" : log.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                  }`} />
                  <div>
                    <div className="text-sm font-black text-gray-900">{log.action}</div>
                    <div className="text-xs font-bold text-gray-400">{log.user} &bull; <span className="uppercase">{log.target}</span></div>
                  </div>
                </div>
                <div className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                  {log.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maker-Checker Status */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-amber-50/30">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              Validations (Checker)
            </h2>
          </div>
          <div className="flex-1 p-8 space-y-4 overflow-y-auto max-h-[500px]">
            {pendingValidations.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="text-sm font-bold text-gray-500">Aucune validation en attente.</div>
                <div className="flex justify-center gap-2">
                  <Link href="/admin/kyc" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    Vérifier KYC
                  </Link>
                  <Link href="/admin/finance" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    Audit financier
                  </Link>
                </div>
              </div>
            ) : (
              pendingValidations.map((item) => (
                <div key={item.id} className="p-6 rounded-[2rem] bg-gray-50 border border-transparent hover:border-amber-200 hover:bg-amber-50/20 transition-all group relative">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{item.association}</div>
                  <div className="text-sm font-black text-gray-900">{item.type}</div>
                  <div className="mt-4 flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400">Par: {item.maker.split(" ")[0]}</span>
                    <span className="text-xs font-black text-emerald-600">{item.amount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Platform Health Section */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full -mr-64 -mt-64 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 rounded-full -ml-32 -mb-32 blur-[80px]" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-400 font-black text-xs uppercase tracking-widest">
              <Activity className="w-5 h-5" />
              État des Services Plateforme
            </div>
            <div className="space-y-5">
              {[
                { name: "Base de données NoSQL/SQL", status: "Operational", color: "bg-emerald-400" },
                { name: "Passerelle de Paiement CEMAC", status: "Operational", color: "bg-emerald-400" },
                { name: "Service de Notifications Push", status: "Degraded", color: "bg-amber-400" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white/80">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter">{s.status}</span>
                    <div className={`w-2 h-2 rounded-full ${s.color} shadow-lg ${s.color === 'bg-emerald-400' ? 'shadow-emerald-500/20' : 'shadow-amber-500/20'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2 flex flex-col justify-center">
            <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              Alerte Sécurité Système
            </h3>
            <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <div className="font-black text-lg mb-2">Tentatives de Brute-Force Détectées</div>
                  <p className="text-sm text-white/60 font-medium leading-relaxed">
                    Le système a automatiquement bloqué 127 tentatives de connexion suspectes provenant de l&apos;IP <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">192.168.1.1</span>. 
                    Le compte <span className="text-white font-bold underline">support@tchoua.cm</span> a été placé sous protection 2FA renforcée.
                  </p>
                  <div className="mt-6 flex gap-4">
                    <Button variant="secondary" size="sm" className="px-6">Intervenir</Button>
                    <Button variant="outline" size="sm" className="px-6 border-white/20 text-white hover:bg-white/10">Ignorer</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
