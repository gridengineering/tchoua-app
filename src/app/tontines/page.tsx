"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import { AssociationFilter, FilterAssociation } from "@/components/associations/association-filter";
import { PiggyBank, Users, ArrowRight, Building2, Search, Filter, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

const TYPE_ICONS: Record<string, string> = {
  TONTINE_ROTATIVE: "🔄",
  TONTINE_ASCA: "🏦",
  TONTINE_ENCHERES: "🔨",
};

type Activity = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  contributionAmount?: number | null;
  caisseBalance?: number;
  association: { id: string; name: string; color?: string | null } | null;
  mySubscription: { status: string; partsCount: number } | null;
  _count: { subscriptions: number; actSessions: number };
};

export default function TontinesAggregatePage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [associations, setAssociations] = useState<FilterAssociation[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/me/aggregate?resource=activities&type=TONTINE")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setAssociations(d.associations ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (filter) result = result.filter((a) => a.association?.id === filter);
    if (search) result = result.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.association?.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [items, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of filtered) {
      const key = a.association?.id ?? "_";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <DashboardLayout title="Mes Tontines">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-gold">Économie Collaborative</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Gérez vos Cotisations</h1>
              <p className="text-emerald-100/60 font-medium leading-relaxed max-w-xl">
                Suivez l&apos;évolution de vos tontines rotatives, ASCA et enchères. 
                Consultez vos soldes et préparez vos prochaines levées en toute sérénité.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl text-center">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tontines Actives</div>
                <div className="text-3xl font-black">{items.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
            <input 
              type="text" 
              placeholder="Rechercher une tontine..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-warm-white border border-stone rounded-2xl outline-none text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#0d3d28]/5 transition-all"
            />
          </div>
          <AssociationFilter associations={associations} value={filter} onChange={setFilter} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-warm-white rounded-xl p-8 border border-stone shadow-sm animate-pulse h-64" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center bg-warm-white rounded-2xl border-4 border-dashed border-gray-50">
            <PiggyBank className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucune tontine trouvée</h3>
            <p className="text-sm font-medium text-ash mt-2 mb-8">Rejoignez une association pour commencer à cotiser.</p>
            <Link href="/templates" className="inline-flex items-center gap-2 px-8 py-4 bg-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#0d3d28]/20">
              Explorer les modèles
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(([assocId, list]) => {
              const assoc = list[0].association;
              return (
                <div key={assocId} className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ background: assoc?.color ?? "#0d3d28" }}>
                        {assoc?.name[0]}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-charcoal">{assoc?.name}</h2>
                        <div className="text-[10px] font-black text-ash uppercase tracking-widest">{list.length} Tontines actives</div>
                      </div>
                    </div>
                    <Link href={`/associations/${assoc?.id}`} className="text-[10px] font-black text-gold uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2">
                      Voir l&apos;espace <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {list.map((a) => (
                      <Link key={a.id} href={`/associations/${a.association?.id}?tab=activities`} className="group">
                        <div className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden h-full flex flex-col">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-cream rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                          
                          <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-forest/10 text-forest flex items-center justify-center text-3xl shadow-inner">
                              {TYPE_ICONS[a.type] ?? "💰"}
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[9px] text-xs font-medium text-ash uppercase tracking-wider ${
                              a.status === 'ACTIVE' ? 'bg-forest/10 text-forest' : 'bg-gray-100 text-ash'
                            }`}>
                              {a.status}
                            </div>
                          </div>

                          <h3 className="text-xl font-semibold text-charcoal mb-2 group-hover:text-[#0d3d28] transition-colors">{a.name}</h3>
                          <p className="text-xs font-medium text-ash mb-8 line-clamp-2 leading-relaxed">
                            {a.description || "Pas de description fournie pour cette tontine."}
                          </p>

                          <div className="mt-auto space-y-4 relative z-10">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-cream/50">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-ash/60" />
                                <span className="text-xs font-black text-graphite">{a._count.subscriptions} Membres</span>
                              </div>
                              <div className="text-sm font-black text-[#0d3d28]">
                                {formatCurrency(a.contributionAmount || 0)}
                              </div>
                            </div>

                            {a.mySubscription && (
                              <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-[10px] font-black text-ash uppercase tracking-widest">Inscrit</span>
                                </div>
                                <div className="text-[10px] font-black text-forest uppercase tracking-widest">{a.mySubscription.status}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
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
