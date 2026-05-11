"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Activity, Plus, ChevronLeft, Search, Filter, ArrowRight, Users, PiggyBank, Landmark, Heart, Coins } from "lucide-react";
import { formatCurrency, getFrequencyLabel } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type AssocActivity = {
  id: string;
  name: string;
  type: string;
  participation: string;
  contributionAmount?: number;
  contributionFrequency: string;
  distributionMode: string;
  mySubscription?: { id: string; parts?: number } | null;
  _count?: { subscriptions: number };
  caisseBalance: number;
};

const TYPE_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  TONTINE: { icon: PiggyBank, color: "#0d3d28", label: "Tontine" },
  TONTINE_ROTATIVE: { icon: PiggyBank, color: "#0d3d28", label: "Tontine Rotative" },
  TONTINE_ENCHERES: { icon: Coins, color: "#d4a343", label: "Tontine aux Enchères" },
  SAVINGS: { icon: Landmark, color: "#15803d", label: "Épargne" },
  EPARGNE: { icon: Landmark, color: "#15803d", label: "Épargne" },
  AIDE_SOLIDAIRE: { icon: Heart, color: "#be123c", label: "Solidarité" },
  SOLIDARITY: { icon: Heart, color: "#be123c", label: "Solidarité" },
};

export default function ActivitiesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const router = useRouter();
  
  const typeFilter = searchParams.get("type");
  const [activities, setActivities] = useState<AssocActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/associations/${id}/activities`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setActivities(data?.activities ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      const matchesType = !typeFilter || a.type.includes(typeFilter);
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [activities, typeFilter, search]);

  const title = typeFilter === "TONTINE" ? "Tontines de l'association" : 
                typeFilter === "SAVINGS" ? "Fonds d'épargne" : "Activités de l'association";

  return (
    <DashboardLayout title={title}>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Banner with Action */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <PiggyBank className="w-3 h-3 text-gold" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-gold">Gestion des Activités</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">{title}</h1>
              <p className="text-emerald-100/60 font-medium leading-relaxed max-w-xl">
                Gérez vos participations, suivez vos cotisations et consultez l'état des caisses 
                pour toutes les activités de cette association.
              </p>
            </div>
            <button className="bg-warm-white text-[#0d3d28] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap self-start md:self-center">
              <Plus className="w-4 h-4" /> Nouvelle activité
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
            <input 
              type="text" 
              placeholder="Rechercher une activité..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-warm-white border border-stone rounded-2xl outline-none text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#0d3d28]/5 transition-all"
            />
          </div>
          <div className="flex gap-2">
             {["TONTINE", "SAVINGS", "AIDE_SOLIDAIRE"].map(t => (
               <button 
                 key={t}
                 onClick={() => router.push(`/associations/${id}/activities?type=${t}`)}
                 className={`px-6 py-3 rounded-xl text-[10px] text-xs font-medium text-ash uppercase tracking-wider border transition-all ${typeFilter === t ? 'bg-forest text-white border-[#0d3d28]' : 'bg-warm-white text-ash border-stone hover:border-[#0d3d28]/20'}`}
               >
                 {t.replace('_', ' ')}
               </button>
             ))}
             {typeFilter && (
               <button onClick={() => router.push(`/associations/${id}/activities`)} className="px-4 py-2 text-[10px] font-black uppercase text-error hover:bg-error/10 rounded-xl">Effacer</button>
             )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-warm-white rounded-2xl p-8 border border-stone animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center bg-warm-white rounded-2xl border-4 border-dashed border-gray-50">
            <Activity className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucune activité trouvée</h3>
            <p className="text-sm font-medium text-ash mt-2 mb-8">Essayez de modifier vos filtres ou lancez une nouvelle recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(act => {
              const config = TYPE_CONFIG[act.type] || { icon: Activity, color: "#6b7280", label: act.type };
              const Icon = config.icon;
              
              return (
                <div key={act.id} className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: config.color }}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] text-xs font-medium text-ash uppercase tracking-wider ${act.mySubscription ? 'bg-forest/10 text-forest' : 'bg-cream text-ash'}`}>
                      {act.mySubscription ? 'Inscrit ✓' : 'Non inscrit'}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-charcoal mb-1 group-hover:text-[#0d3d28] transition-colors">{act.name}</h3>
                  <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-8">{config.label}</div>

                  <div className="mt-auto space-y-4 relative z-10">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-cream/50">
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-black text-ash uppercase tracking-widest">Cotisation</div>
                        <div className="text-sm font-semibold text-charcoal">{formatCurrency(act.contributionAmount || 0)}</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-[9px] font-black text-ash uppercase tracking-widest">Fréquence</div>
                        <div className="text-xs font-semibold text-charcoal">{getFrequencyLabel(act.contributionFrequency)}</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => router.push(`/associations/${id}/activities/${act.id}`)}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-[#f7f3eb] group-hover:bg-forest group-hover:text-white text-[#0d3d28] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm group-hover:shadow-xl"
                    >
                      Consulter l&apos;espace <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
