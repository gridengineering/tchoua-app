"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getLevelInfo } from "@/lib/utils";
import {
  PiggyBank, TrendingUp, Users, Landmark, Heart, Bell,
  ArrowRight, Plus, CheckCircle, AlertCircle, Sparkles,
  Wallet, ArrowUpRight, History, Calendar, BarChart3,
  ShieldCheck, Award, MessageSquare, GraduationCap, ShoppingBag, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  user: { name: string; score: number; level: string; walletBalance: number };
  stats: {
    tontinesCount: number;
    totalContributed: number;
    pendingLoans: number;
    pendingAids: number;
  };
  recentActivity: any[];
  nextSession: any;
  recommendations: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Détection de l'association courante
  const assocMatch = pathname.match(/^\/associations\/([^/]+)(?:\/|$)/);
  const currentAssocId = assocMatch?.[1];

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const url = currentAssocId 
        ? `/api/dashboard?associationId=${currentAssocId}` 
        : "/api/dashboard";
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentAssocId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const levelInfo = data?.user?.level ? getLevelInfo(data.user.level) : null;
  const user = session?.user as any;

  return (
    <DashboardLayout title={currentAssocId ? "Tableau de Bord Association" : "Tableau de Bord Global"}>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* ── HERO BANNER ── */}
        <div className="relative overflow-hidden bg-forest rounded-2xl p-8 md:p-12 text-white shadow-2xl">
          {/* Abstract patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-forest/10 rounded-full blur-[60px] -ml-24 -mb-24"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="text-[10px] text-xs font-medium text-ash uppercase tracking-wider text-gold">
                  {currentAssocId ? "Activité de l'association" : "Vue d'ensemble de vos activités"}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Bonjour, {user?.name?.split(" ")[0] || "Membre"} <span className="inline-block animate-bounce">👋</span>
              </h1>
              <p className="text-emerald-100/70 font-medium max-w-md leading-relaxed">
                {currentAssocId 
                  ? "Voici un résumé de vos engagements et de votre position actuelle dans cette association."
                  : "Gardez un œil sur l'ensemble de vos cotisations et objectifs à travers toutes vos associations."}
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl min-w-[200px] text-center md:text-right shadow-xl">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Portefeuille Interne</div>
                <div className="text-3xl font-black tracking-tighter">
                  {data?.user?.walletBalance?.toLocaleString() || "0"} <span className="text-sm font-bold opacity-50">FCFA</span>
                </div>
                <Link href="/profil" className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-black text-gold uppercase tracking-widest hover:translate-x-1 transition-transform">
                  Gérer mes fonds <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            {levelInfo && (
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                <Award className="w-5 h-5 text-gold" />
                <div>
                  <div className="text-[9px] font-black uppercase tracking-tighter text-white/40">Niveau de réputation</div>
                  <div className="text-xs font-medium text-ash uppercase tracking-wider">{levelInfo.label}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-[9px] font-black uppercase tracking-tighter text-white/40">Statut de vérification</div>
                <div className="text-xs font-medium text-ash uppercase tracking-wider">Membre Certifié</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Mes Tontines", value: data?.stats?.tontinesCount || 0, icon: PiggyBank, color: "bg-info" },
            { label: "Total Cotisé", value: `${(data?.stats?.totalContributed || 0).toLocaleString()} CFA`, icon: BarChart3, color: "bg-forest" },
            { label: "Prêts en cours", value: data?.stats?.pendingLoans || 0, icon: Landmark, color: "bg-gold" },
            { label: "Demandes Solidarité", value: data?.stats?.pendingAids || 0, icon: Heart, color: "bg-error" },
          ].map((stat, i) => (
            <div key={i} className="bg-warm-white rounded-xl p-6 border border-stone shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white mb-4 shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-black text-ash uppercase tracking-widest">{stat.label}</div>
              <div className="text-2xl font-semibold text-charcoal mt-0.5">{loading ? "..." : stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Activity Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Next Session Card */}
            <div className="bg-warm-white rounded-2xl border border-stone shadow-sm p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-forest/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-semibold text-charcoal flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-gold" />
                  Prochaine Session
                </h2>
                <Link href="/sessions" className="text-xs font-black text-forest hover:bg-forest/10 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">
                  Calendrier complet
                </Link>
              </div>

              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <Button variant="ghost" loading className="text-forest" />
                </div>
              ) : data?.nextSession ? (
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="flex flex-col items-center justify-center w-24 h-24 bg-forest rounded-xl text-white shadow-xl">
                    <div className="text-[10px] font-black uppercase opacity-60">Juin</div>
                    <div className="text-4xl font-black">12</div>
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="text-lg font-semibold text-charcoal">{data.nextSession.tontineName || "Assemblée Générale Mensuelle"}</div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-graphite">
                        <History className="w-3.5 h-3.5 text-emerald-500" />
                        <span>18:30 - Yaoundé, Bastos</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-graphite">
                        <Plus className="w-3.5 h-3.5 text-blue-500" />
                        <span>Montant dû : 25,000 CFA</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="px-8 h-14"
                  >
                    Confirmer Présence
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm font-bold text-ash/60 uppercase tracking-widest">Aucune session planifiée</p>
                </div>
              )}
            </div>

            {/* Recent Activity List */}
            <div className="bg-warm-white rounded-2xl border border-stone shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-charcoal">Activité Récente</h2>
                <Link href="/rapports" className="text-xs font-black text-info hover:bg-info/10 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">
                  Historique Global
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                   [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-cream/50 animate-pulse m-4 rounded-2xl" />)
                ) : data?.recentActivity?.length ? (
                  data.recentActivity.map((act: any, i: number) => (
                    <div key={i} className="p-6 hover:bg-cream/50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.type === 'CONTRIBUTION' ? 'bg-forest/10 text-forest' : 'bg-info/10 text-info'}`}>
                          {act.type === 'CONTRIBUTION' ? <CheckCircle className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-charcoal">{act.label}</div>
                          <div className="text-[10px] font-black text-ash uppercase tracking-widest">{act.assocName} &bull; {formatDate(act.date)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${act.amount < 0 ? 'text-error' : 'text-forest'}`}>
                          {act.amount > 0 ? '+' : ''}{act.amount.toLocaleString()} <span className="text-[10px]">CFA</span>
                        </div>
                        <div className="text-[9px] font-bold text-ash/60 uppercase">Terminé</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center text-ash font-bold uppercase tracking-widest text-xs">Aucune activité enregistrée</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Notifications Card */}
            <div className="bg-warm-white rounded-2xl border border-stone shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold text-charcoal">Alertes</h2>
                <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center text-error font-black text-xs">2</div>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Retard de cotisation", desc: "Tontine Famille : 10,000 CFA dû pour la session 12.", type: "URGENT", icon: AlertCircle, color: "text-error", bg: "bg-error/10" },
                  { title: "Nouveau message", desc: "Président AMSED : Réunion extraordinaire demain.", type: "INFO", icon: Bell, color: "text-blue-500", bg: "bg-info/10" },
                ].map((notif, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${notif.bg === 'bg-error/10' ? 'border-red-100' : 'border-blue-100'} ${notif.bg} group cursor-pointer hover:scale-[1.02] transition-transform`}>
                    <div className="flex gap-3">
                      <notif.icon className={`w-4 h-4 ${notif.color} mt-0.5 flex-shrink-0`} />
                      <div>
                        <div className="text-xs font-semibold text-charcoal">{notif.title}</div>
                        <p className="text-[10px] font-medium text-gray-600 mt-1 leading-relaxed">{notif.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Marketplace", icon: ShoppingBag, href: "/marketplace", color: "text-warning", bg: "bg-warning/10" },
                { label: "Chat", icon: MessageSquare, href: "/chat", color: "text-indigo", bg: "bg-indigo/10" },
                { label: "Académie", icon: GraduationCap, href: "/academie", color: "text-indigo", bg: "bg-indigo/10" },
                { label: "Conseils IA", icon: Bot, href: "/conseils", color: "text-emerald-500", bg: "bg-forest/10" },
              ].map((item, i) => (
                <Link key={i} href={item.href} className="bg-warm-white rounded-xl p-6 border border-stone shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all text-center flex flex-col items-center gap-3 group">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-charcoal uppercase tracking-widest">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Referral Banner */}
            <div className="bg-gradient-to-br from-[#e68a00] to-[#b8860b] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="text-[10px] text-xs font-medium text-ash uppercase tracking-wider opacity-60 mb-2">Gagnez des points</div>
                <h3 className="text-lg font-black mb-4 leading-tight">Parrainez un membre et gagnez 500 pts !</h3>
                <div className="flex items-center gap-2 text-xs font-black bg-white/20 px-4 py-2 rounded-xl border border-white/20">
                  <span>Code : TCH-9922</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
