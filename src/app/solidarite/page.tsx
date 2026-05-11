"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AssociationFilter, FilterAssociation } from "@/components/associations/association-filter";
import { Heart, Building2, Search, Filter, Sparkles, HandHeart, ShieldCheck, ArrowRight, Activity } from "lucide-react";

type Aid = {
  id: string;
  category: string;
  requestedAmount: number;
  approvedAmount?: number | null;
  status: string;
  urgencyLevel: string;
  justification?: string | null;
  createdAt: string;
  paidAt?: string | null;
  isMine: boolean;
  association: { id: string; name: string; color?: string | null } | null;
  membership: { user: { name?: string | null; avatar?: string | null } };
};

const CATEGORY_LABEL: Record<string, string> = {
  ILLNESS_MEMBER: "Maladie membre",
  ILLNESS_SPOUSE: "Maladie conjoint",
  DEATH_MEMBER: "Décès membre",
  DEATH_SPOUSE: "Décès conjoint",
  DEATH_CHILD_UNDER5: "Décès enfant <5 ans",
  DEATH_CHILD_OVER5: "Décès enfant >5 ans",
  DEATH_PARENT: "Décès parent",
  MARRIAGE: "Mariage",
  BIRTH: "Naissance",
  BIRTH_TWINS: "Naissance jumeaux",
  OTHER: "Autre",
};

export default function SolidariteAggregatePage() {
  const [items, setItems] = useState<Aid[]>([]);
  const [associations, setAssociations] = useState<FilterAssociation[]>([]);
  const [filter, setFilter] = useState("");
  const [scope, setScope] = useState<"ALL" | "MINE">("MINE");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/me/aggregate?resource=aids")
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
    if (scope === "MINE") result = result.filter((a) => a.isMine);
    if (search) result = result.filter((a) => 
      (CATEGORY_LABEL[a.category] || a.category).toLowerCase().includes(search.toLowerCase()) || 
      a.association?.name.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [items, filter, scope, search]);

  const totalApprouve = filtered
    .filter((a) => a.status === "APPROVED" || a.status === "PAID")
    .reduce((s, a) => s + (a.approvedAmount ?? a.requestedAmount), 0);

  return (
    <DashboardLayout title="Solidarité & Entraide">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Banner */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-900 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Sparkles className="w-3 h-3 text-rose-200" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-rose-100">Soutien Communautaire</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">L&apos;Union fait la Force</h1>
              <p className="text-rose-100/70 font-medium leading-relaxed max-w-xl">
                Suivez vos demandes d&apos;assistance et les actions de solidarité en cours. 
                TCHOUA vous accompagne dans les moments clés de la vie.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl text-center">
                <div className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1">Aides Approuvées</div>
                <div className="text-3xl font-black">{totalApprouve.toLocaleString()} <span className="text-xs opacity-50">CFA</span></div>
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
              placeholder="Rechercher une demande (maladie, décès, naissance...)" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-warm-white border border-stone rounded-2xl outline-none text-sm font-bold shadow-sm focus:ring-4 focus:ring-rose-600/5 transition-all"
            />
          </div>
          <div className="flex bg-warm-white p-1 rounded-2xl border border-stone">
            <button 
              onClick={() => setScope("MINE")}
              className={`px-6 py-3 rounded-xl text-[10px] text-xs font-medium text-ash uppercase tracking-wider transition-all ${scope === 'MINE' ? 'bg-slate-900 text-white shadow-lg' : 'text-ash hover:text-gray-600'}`}
            >
              Mes Demandes
            </button>
            <button 
              onClick={() => setScope("ALL")}
              className={`px-6 py-3 rounded-xl text-[10px] text-xs font-medium text-ash uppercase tracking-wider transition-all ${scope === 'ALL' ? 'bg-slate-900 text-white shadow-lg' : 'text-ash hover:text-gray-600'}`}
            >
              Vue Globale
            </button>
          </div>
          <AssociationFilter associations={associations} value={filter} onChange={setFilter} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-warm-white rounded-xl p-8 border border-stone shadow-sm animate-pulse h-56" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center bg-warm-white rounded-2xl border-4 border-dashed border-gray-50">
            <Heart className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucune demande trouvée</h3>
            <p className="text-sm font-medium text-ash mt-2 mb-8">Les demandes de solidarité se font directement dans l&apos;espace de votre association.</p>
            <Link href="/associations" className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20">
              Voir mes associations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((a) => (
              <Link key={a.id} href={`/associations/${a.association?.id}/aides`} className="group">
                <div className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-error/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-error/10 text-rose-600 flex items-center justify-center text-3xl shadow-inner">
                      <HandHeart className="w-7 h-7" />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] text-xs font-medium text-ash uppercase tracking-wider ${
                      a.status === 'PAID' ? 'bg-forest/10 text-forest' : 
                      a.status === 'APPROVED' ? 'bg-info/10 text-info' :
                      a.status === 'PENDING' ? 'bg-gold/10 text-gold' :
                      'bg-gray-100 text-ash'
                    }`}>
                      {a.status}
                    </div>
                  </div>

                  <div className="mb-8 relative z-10 flex-1">
                    <div className="text-[10px] font-black text-ash uppercase tracking-widest mb-1">{a.association?.name}</div>
                    <h3 className="text-xl font-semibold text-charcoal group-hover:text-rose-700 transition-colors">{CATEGORY_LABEL[a.category] || a.category}</h3>
                    {!a.isMine && (
                      <div className="text-[10px] font-bold text-ash mt-1 uppercase tracking-wider">
                        Membre : {a.membership.user.name}
                      </div>
                    )}
                    {a.justification && (
                      <p className="mt-4 text-xs font-medium text-ash line-clamp-2 leading-relaxed italic">&ldquo;{a.justification}&rdquo;</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10 pt-6 border-t border-gray-50 mt-6">
                    <div>
                      <div className="text-[10px] font-black text-ash uppercase tracking-widest mb-1">Montant</div>
                      <div className="text-lg font-semibold text-charcoal">{formatCurrency(a.approvedAmount ?? a.requestedAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-ash uppercase tracking-widest mb-1">Date Demande</div>
                      <div className="text-lg font-semibold text-charcoal">{formatDate(a.createdAt)}</div>
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
