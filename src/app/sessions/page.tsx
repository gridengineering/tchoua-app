"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AssociationFilter, FilterAssociation } from "@/components/associations/association-filter";
import { RotateCcw, Building2, Search, Filter, Sparkles, Calendar, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

type Session = {
  id: string;
  sessionNumber: number;
  scheduledAt: string;
  heldAt?: string | null;
  status: string;
  potAmount?: number | null;
  distributed: number;
  reliquat: number;
  drawMethod: string;
  activity: { id: string; name: string; type: string; associationId: string };
  association: { id: string; name: string; color?: string | null } | null;
  _count: { contributions: number; beneficiaries: number };
};

export default function SessionsAggregatePage() {
  const [items, setItems] = useState<Session[]>([]);
  const [associations, setAssociations] = useState<FilterAssociation[]>([]);
  const [filter, setFilter] = useState("");
  const [scope, setScope] = useState<"ALL" | "UPCOMING" | "HELD">("ALL");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/me/aggregate?resource=sessions")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setAssociations(d.associations ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (filter) result = result.filter((s) => s.association?.id === filter);
    if (scope === "UPCOMING") result = result.filter((s) => s.status === "UPCOMING");
    if (scope === "HELD") result = result.filter((s) => s.status === "HELD");
    if (search) result = result.filter((s) => 
      s.activity.name.toLowerCase().includes(search.toLowerCase()) || 
      s.association?.name.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [items, filter, scope, search]);

  const totalDistribue = filtered.reduce((s, x) => s + (x.distributed ?? 0), 0);

  return (
    <DashboardLayout title="Calendrier & Séances">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-emerald-300">Organisation & Discipline</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Vos Rendez-vous</h1>
              <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
                Suivez le calendrier de vos séances de tontine. Ne manquez aucune assemblée 
                et visualisez l&apos;historique des pots distribués au sein de vos groupes.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl text-center">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Distribué</div>
                <div className="text-3xl font-black">{totalDistribue.toLocaleString()} <span className="text-xs opacity-50">CFA</span></div>
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
              placeholder="Rechercher une séance ou association..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-warm-white border border-stone rounded-2xl outline-none text-sm font-bold shadow-sm focus:ring-4 focus:ring-emerald-600/5 transition-all"
            />
          </div>
          <div className="flex bg-warm-white p-1 rounded-2xl border border-stone">
            {[
              { id: "ALL", label: "Toutes" },
              { id: "UPCOMING", label: "À venir" },
              { id: "HELD", label: "Terminées" }
            ].map(s => (
              <button 
                key={s.id}
                onClick={() => setScope(s.id as any)}
                className={`px-6 py-3 rounded-xl text-[10px] text-xs font-medium text-ash uppercase tracking-wider transition-all ${scope === s.id ? 'bg-slate-900 text-white shadow-lg' : 'text-ash hover:text-gray-600'}`}
              >
                {s.label}
              </button>
            ))}
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
            <RotateCcw className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucune séance enregistrée</h3>
            <p className="text-sm font-medium text-ash mt-2 mb-8">Les séances sont planifiées au sein de vos activités de tontine.</p>
            <Link href="/associations" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20">
              Voir mes associations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <Link key={s.id} href={`/associations/${s.association?.id}?tab=activities`} className="group">
                <div className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-3xl shadow-inner group-hover:bg-forest/10 group-hover:text-forest transition-colors">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] text-xs font-medium text-ash uppercase tracking-wider ${
                      s.status === 'HELD' ? 'bg-forest/10 text-forest' : 
                      s.status === 'UPCOMING' ? 'bg-info/10 text-info' :
                      'bg-gray-100 text-ash'
                    }`}>
                      {s.status === 'HELD' ? 'Tenue' : 'À venir'}
                    </div>
                  </div>

                  <div className="mb-8 relative z-10 flex-1">
                    <div className="text-[10px] font-black text-ash uppercase tracking-widest mb-1">{s.association?.name}</div>
                    <h3 className="text-xl font-semibold text-charcoal group-hover:text-forest transition-colors">{s.activity.name}</h3>
                    <div className="flex items-center gap-2 mt-4 text-xs font-bold text-ash">
                      <Clock className="w-4 h-4 text-emerald-500" /> {formatDate(s.scheduledAt)}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-[10px] font-black text-ash uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> {s._count.contributions} Cotis.
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> {s._count.beneficiaries} Bénéf.
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                    <div>
                      <div className="text-[8px] font-black text-ash uppercase tracking-widest mb-1">Montant Pot</div>
                      <div className="text-lg font-black text-forest">{formatCurrency(s.potAmount ?? 0)}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
