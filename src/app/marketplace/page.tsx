"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ShoppingBag, Sparkles, Wallet, Search, Filter, ShoppingCart, ArrowRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  seller: { name: string; avatar?: string };
  isGroupBuy: boolean;
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Tous");
  const [search, setSearch] = useState("");

  const categories = ["Tous", "Agriculture", "Artisanat", "Services", "Électronique", "Vêtements", "Achats Groupés"];

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (category !== "Tous") query.append("category", category);
        if (search) query.append("search", search);
        
        const res = await fetch(`/api/marketplace?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(fetchListings, 300);
    return () => clearTimeout(timer);
  }, [category, search]);

  return (
    <DashboardLayout title="Marketplace Interne">
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl font-black mb-4">Le commerce au cœur de la communauté</h1>
            <p className="text-orange-50 font-medium leading-relaxed">
              Vendez vos produits, proposez vos services et profitez des meilleurs prix négociés par l'association. 
              Les transactions utilisent votre portefeuille interne pour plus de sécurité.
            </p>
            <div className="mt-8 flex gap-4">
              <button className="bg-warm-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> Publier une annonce
              </button>
              <button className="bg-orange-700/30 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700/50 transition-all">
                Mes commandes
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
            <input 
              type="text" 
              placeholder="Que recherchez-vous aujourd'hui ?" 
              className="w-full pl-12 pr-4 py-4 bg-warm-white border border-stone rounded-2xl outline-none text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500/10 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="px-6 py-4 bg-warm-white border border-stone rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-graphite hover:border-orange-500/20 hover:text-orange-600 transition-all">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${category === cat ? 'bg-forest text-white border-[#0d3d28]' : 'bg-warm-white text-ash border-stone hover:border-emerald-200 hover:text-forest'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-cream rounded-3xl border border-dashed">
            <ShoppingBag className="w-12 h-12 text-ash/60 mx-auto mb-4" />
            <p className="text-graphite font-bold">Aucun produit trouvé dans cette catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((item) => (
              <div key={item.id} className="bg-warm-white rounded-3xl border border-stone p-2 shadow-sm hover:shadow-xl transition-all group">
                <div className="aspect-square rounded-2xl bg-cream flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                  {item.category === 'Agriculture' ? '🌽' : item.category === 'Artisanat' ? '🧼' : '📦'}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black text-warning uppercase tracking-widest">{item.category}</span>
                    {item.isGroupBuy && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-forest bg-forest/10 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" /> Groupé
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-charcoal mb-1">{item.title}</h3>
                  <div className="text-[10px] font-bold text-ash mb-4">Vendu par : {item.seller.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-charcoal">{formatCurrency(item.price)}</div>
                    <button className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Group Buy Section */}
        <div className="bg-[#f7f3eb] rounded-2xl p-12 text-center border border-[#e2ddd4]">
          <div className="w-16 h-16 rounded-3xl bg-warm-white flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingCart className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Achats Groupés communautaires</h2>
          <p className="text-sm font-bold text-graphite max-w-md mx-auto leading-relaxed mb-8">
            Unissez vos forces avec les autres membres pour acheter en gros et bénéficier de réductions massives sur les produits de première nécessité.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-forest text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg cursor-pointer hover:scale-105 transition-all">
            Voir les commandes en cours
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
