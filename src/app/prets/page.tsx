"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AssociationFilter, FilterAssociation } from "@/components/associations/association-filter";
import { Landmark, Building2, Search, Filter, Sparkles, TrendingDown, ShieldCheck, ArrowRight, CreditCard, Clock } from "lucide-react";

type Loan = {
  id: string;
  amount: number;
  totalDue: number;
  interestRate?: number | null;
  duration: number;
  status: string;
  purpose?: string | null;
  createdAt: string;
  association: { id: string; name: string; color?: string | null };
};

export default function PretsAggregatePage() {
  const [items, setItems] = useState<Loan[]>([]);
  const [associations, setAssociations] = useState<FilterAssociation[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/me/aggregate?resource=loans")
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
    if (search) result = result.filter((a) => a.purpose?.toLowerCase().includes(search.toLowerCase()) || a.association?.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [items, filter, search]);

  const totalDue = filtered.reduce((s, a) => s + (a.status !== 'REPAID' ? a.totalDue : 0), 0);

  return (
    <DashboardLayout title="Mes Emprunts">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Banner */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-800 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-amber-100">Levier de Croissance</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Gérez vos Crédits</h1>
              <p className="text-amber-50/70 font-medium leading-relaxed max-w-xl">
                Suivez l&apos;état de vos remboursements et la durée restante de vos emprunts. 
                Une gestion saine de vos prêts renforce votre score de confiance.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl text-center">
                <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1">Encours Total</div>
                <div className="text-3xl font-black">{totalDue.toLocaleString()} <span className="text-xs opacity-50">CFA</span></div>
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
              placeholder="Rechercher par but du prêt ou association..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-warm-white border border-stone rounded-2xl outline-none text-sm font-bold shadow-sm focus:ring-4 focus:ring-amber-600/5 transition-all"
            />
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
            <Landmark className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucun prêt trouvé</h3>
            <p className="text-sm font-medium text-ash mt-2 mb-8">Les demandes de prêt se font au sein de vos tontines ASCA.</p>
            <Link href="/associations" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20">
              Voir mes associations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((a) => (
              <Link key={a.id} href={`/associations/${a.association?.id}?tab=activities`} className="group">
                <div className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center text-3xl shadow-inner">
                      <CreditCard className="w-7 h-7" />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] text-xs font-medium text-ash uppercase tracking-wider ${
                      a.status === 'APPROVED' ? 'bg-forest/10 text-forest' : 
                      a.status === 'PENDING' ? 'bg-gold/10 text-gold' :
                      'bg-gray-100 text-ash'
                    }`}>
                      {a.status}
                    </div>
                  </div>

                  <div className="mb-8 relative z-10">
                    <div className="text-[10px] font-black text-ash uppercase tracking-widest mb-1">{a.association?.name}</div>
                    <h3 className="text-xl font-semibold text-charcoal group-hover:text-amber-700 transition-colors">{a.purpose || "Prêt Tontine"}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-ash">
                      <Clock className="w-3.5 h-3.5" /> Octroyé le {formatDate(a.createdAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10 pt-6 border-t border-gray-50">
                    <div>
                      <div className="text-[10px] font-black text-ash uppercase tracking-widest mb-1">Montant Reçu</div>
                      <div className="text-lg font-semibold text-charcoal">{formatCurrency(a.amount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-ash uppercase tracking-widest mb-1">Reste à payer</div>
                      <div className="text-lg font-black text-orange-600">{formatCurrency(a.totalDue)}</div>
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
