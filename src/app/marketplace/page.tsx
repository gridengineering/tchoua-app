"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageCircle, Package, Plus, Search, ShoppingBag, ShoppingCart, Sparkles, X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Listing = {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  unit?: string | null;
  category: string;
  quantity?: number | null;
  location?: string | null;
  isGroupBuy: boolean;
  seller: { id: string; name: string; avatar?: string | null; location?: string | null };
};

const CATEGORIES = ["Tous", "Agriculture", "Artisanat", "Services", "Électronique", "Vêtements", "Achats Groupés"];

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Agriculture",
    price: "",
    unit: "unité",
    quantity: "",
    location: "",
    isGroupBuy: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (category !== "Tous") query.append("category", category);
      if (search) query.append("search", search);
      const res = await fetch(`/api/marketplace?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      setListings(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [category, search]);

  const groupListings = useMemo(() => listings.filter((l) => l.isGroupBuy), [listings]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          quantity: form.quantity ? Number(form.quantity) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Publication impossible");
      setCreateOpen(false);
      setForm({ title: "", description: "", category: "Agriculture", price: "", unit: "unité", quantity: "", location: "", isGroupBuy: false });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Marketplace">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marketplace communautaire</h1>
            <p className="mt-1 text-sm text-slate-500">
              Vendez vos produits, proposez vos services et profitez des achats groupés de votre association.
            </p>
          </div>
          <div className="flex gap-2">
            <a href="#achats-groupes" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ShoppingCart className="h-4 w-4" /> Achats groupés
            </a>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Publier une annonce
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit ou un service…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  category === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && !createOpen && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">Aucune annonce pour le moment.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Publier la première annonce
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-slate-50 text-4xl">
                  {item.category === "Agriculture" ? "🌽" : item.category === "Artisanat" ? "🧼" : "📦"}
                </div>
                <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide">
                  <span className="text-amber-600">{item.category}</span>
                  {item.isGroupBuy && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-forest">
                      <Sparkles className="h-3 w-3" /> Groupé
                    </span>
                  )}
                </div>
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mb-3 text-xs text-slate-500">Vendu par {item.seller.name}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{formatCurrency(item.price)}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest text-white group-hover:bg-forest-dark">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div id="achats-groupes" className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Achats groupés</h2>
              <p className="text-sm text-slate-500">Les annonces collectives disponibles dans votre réseau.</p>
            </div>
            <ShoppingCart className="h-6 w-6 text-amber-500" />
          </div>
          {groupListings.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Aucun achat groupé en cours. Publiez une annonce en cochant « Achat groupé ».
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {groupListings.map((l) => (
                <button key={l.id} onClick={() => setSelected(l)} className="flex w-full items-center justify-between py-3 text-left hover:bg-slate-50">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Package className="h-4 w-4 text-slate-400" /> {l.title}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(l.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">{selected.category}</p>
                <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            {selected.description && <p className="mb-3 text-sm text-slate-600">{selected.description}</p>}
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between"><span>Prix</span><span className="font-semibold text-slate-900">{formatCurrency(selected.price)}{selected.unit ? ` / ${selected.unit}` : ""}</span></div>
              {selected.quantity != null && <div className="flex justify-between"><span>Quantité</span><span className="font-medium">{selected.quantity}</span></div>}
              {selected.location && <div className="flex justify-between"><span>Localisation</span><span className="font-medium">{selected.location}</span></div>}
              <div className="flex justify-between"><span>Vendeur</span><span className="font-medium">{selected.seller.name}</span></div>
            </div>
            <Link
              href={`/chat?to=${selected.seller.id}`}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark"
            >
              <MessageCircle className="h-4 w-4" /> Contacter le vendeur
            </Link>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <form onSubmit={submit} className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Publier une annonce</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titre de l'annonce" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description" className="min-h-[70px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  {CATEGORIES.filter((c) => c !== "Tous").map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input required type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Prix (FCFA)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="Unité (kg, sac…)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                <input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="Quantité" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Localisation" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isGroupBuy} onChange={(e) => setForm({ ...form, isGroupBuy: e.target.checked })}
                  className="h-4 w-4 accent-forest" />
                Proposer en achat groupé
              </label>
            </div>
            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" loading={saving}>Publier</Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
