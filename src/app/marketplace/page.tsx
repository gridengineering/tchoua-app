"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, Eye, Heart, ImagePlus,
  Loader2, MapPin, MessageCircle, Package, Plus, Search, Send, ShieldCheck,
  SlidersHorizontal, Tag, Upload, X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  DEFAULT_CATEGORIES, DEFAULT_RUBRIQUES, MARKETPLACE_SORTS, MARKETPLACE_TYPES,
  MARKETPLACE_TYPE_DESCRIPTIONS, MARKETPLACE_TYPE_LABELS, type MarketplaceType,
} from "@/lib/marketplace";

type Listing = {
  id: string;
  sellerId: string;
  associationId?: string | null;
  title: string;
  description?: string | null;
  type: MarketplaceType;
  category: string;
  rubrique?: string | null;
  price?: number | null;
  unit?: string | null;
  quantity?: number | null;
  images: string[];
  location?: string | null;
  deadline?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactWhatsapp?: string | null;
  views?: number;
  interestCount?: number;
  createdAt: string;
  seller?: { id: string; name: string; avatar?: string | null; location?: string | null };
  association?: { id: string; name: string; logo?: string | null } | null;
};

type Interest = {
  id: string;
  userId: string;
  message?: string | null;
  contact?: string | null;
  status: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null; email?: string | null };
};

type Conversation = {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer?: { id: string; name: string; avatar?: string | null };
  messages?: Array<{ content: string; createdAt: string }>;
};

type Detail = {
  listing: Listing;
  isOwner: boolean;
  myInterest?: Interest | null;
  interests?: Interest[] | null;
  conversations?: Conversation[] | null;
};

type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; name: string; avatar?: string | null };
};

const TYPE_STYLES: Record<MarketplaceType, string> = {
  VENTE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PUBLICATION: "bg-sky-50 text-sky-700 border-sky-200",
  RECRUTEMENT: "bg-violet-50 text-violet-700 border-violet-200",
  EVENEMENT: "bg-amber-50 text-amber-700 border-amber-200",
  PARTENARIAT: "bg-rose-50 text-rose-700 border-rose-200",
};

const dateLabel = (value?: string | null) => value
  ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  : "";

const timeLabel = (value?: string | null) => {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} j`;
  return dateLabel(value);
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-slate-400">{hint}</span> : null}
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10";

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [facets, setFacets] = useState<{ categories: string[]; rubriques: string[]; types: string[] }>({ categories: DEFAULT_CATEGORIES, rubriques: DEFAULT_RUBRIQUES, types: [...MARKETPLACE_TYPES] });
  const [associations, setAssociations] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    q: "", type: "TOUS", category: "", rubrique: "", associationId: "",
    location: "", priceMin: "", priceMax: "", sort: "recent",
  });
  const [selected, setSelected] = useState<Listing | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", type: "VENTE" as MarketplaceType, category: "Autres",
    rubrique: "Offre", associationId: "", price: "", unit: "unité", quantity: "",
    location: "", deadline: "", contactPhone: "", contactEmail: "", contactWhatsapp: "",
    images: [] as string[], accepted: false,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [interestOpen, setInterestOpen] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [interestContact, setInterestContact] = useState("");
  const [interestSaving, setInterestSaving] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatListing, setChatListing] = useState<Listing | null>(null);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    fetch("/api/associations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = data?.associations ?? [];
        setAssociations(rows.filter((row: any) => row.myStatus !== "LEFT").map((row: any) => ({ id: row.id, name: row.name })));
        setForm((current) => ({ ...current, associationId: current.associationId || rows[0]?.id || "" }));
      })
      .catch(() => null);
  }, []);

  const load = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "TOUS") params.set(key === "q" ? "q" : key, value);
      });
      params.set("page", String(targetPage));
      params.set("limit", "12");
      const res = await fetch(`/api/marketplace?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible.");
      setListings(data.listings ?? []);
      setFacets(data.facets ?? facets);
      setPages(data.pages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err?.message || "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(1), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const listingId = new URLSearchParams(window.location.search).get("listing");
    if (listingId) openDetail(listingId).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setSelected(listings.find((item) => item.id === id) ?? null);
    try {
      const res = await fetch(`/api/marketplace/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Annonce introuvable.");
      setDetail(data);
      setSelected(data.listing);
    } catch (err: any) {
      setError(err?.message || "Annonce introuvable.");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openChat = async (listing: Listing, conversationId?: string | null) => {
    setChatOpen(true);
    setChatListing(listing);
    setChatConversationId(conversationId ?? null);
    setChatMessages([]);
    setChatLoading(true);
    try {
      const suffix = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : "";
      const res = await fetch(`/api/marketplace/${listing.id}/messages${suffix}`);
      const data = await res.json();
      if (res.ok) {
        setChatConversationId(data.conversation?.id ?? conversationId ?? null);
        setChatMessages(data.messages ?? []);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatListing || !chatText.trim() || chatSending) return;
    setChatSending(true);
    try {
      const res = await fetch(`/api/marketplace/${chatListing.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatText.trim(), conversationId: chatConversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Message impossible.");
      setChatConversationId(data.conversation?.id ?? chatConversationId);
      setChatMessages((current) => [...current, data.message]);
      setChatText("");
    } catch (err: any) {
      setError(err?.message || "Message impossible.");
    } finally {
      setChatSending(false);
    }
  };

  const submitInterest = async () => {
    if (!selected || interestSaving) return;
    setInterestSaving(true);
    try {
      const res = await fetch(`/api/marketplace/${selected.id}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: interestMessage, contact: interestContact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Envoi impossible.");
      setNotice("Votre intérêt a été envoyé à l'annonceur. Vous pouvez poursuivre la discussion dans le chat.");
      setInterestOpen(false);
      await openDetail(selected.id);
      await openChat(selected, data.conversationId);
    } catch (err: any) {
      setFormError(err?.message || "Envoi impossible.");
    } finally {
      setInterestSaving(false);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setFormError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 6 - form.images.length)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/marketplace/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Upload impossible.");
        uploaded.push(data.url);
      }
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded] }));
    } catch (err: any) {
      setFormError(err?.message || "Upload impossible.");
    } finally {
      setUploading(false);
    }
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!form.accepted) {
      setFormError("Merci de confirmer que vous respectez les bonnes pratiques de la marketplace.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          associationId: form.associationId || undefined,
          price: form.price === "" ? null : Number(form.price),
          quantity: form.quantity === "" ? null : Number(form.quantity),
          deadline: form.deadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Publication impossible.");
      setCreateOpen(false);
      setNotice("Votre annonce est publiée. Elle est visible par les membres de votre réseau.");
      setForm({ title: "", description: "", type: "VENTE", category: "Autres", rubrique: "Offre", associationId: associations[0]?.id || "", price: "", unit: "unité", quantity: "", location: "", deadline: "", contactPhone: "", contactEmail: "", contactWhatsapp: "", images: [], accepted: false });
      await load(1);
      if (data.listing?.id) await openDetail(data.listing.id);
    } catch (err: any) {
      setFormError(err?.message || "Publication impossible.");
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = useMemo(() => Array.from(new Set([...facets.categories, ...DEFAULT_CATEGORIES])), [facets.categories]);
  const rubriqueOptions = useMemo(() => Array.from(new Set([...facets.rubriques, ...DEFAULT_RUBRIQUES])), [facets.rubriques]);

  return (
    <DashboardLayout title="Marketplace">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a47718]">Le réseau des membres</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Marketplace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ventes, publications, recrutements, événements et partenariats. Publiez une petite annonce et échangez directement avec les membres de vos associations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace/bonnes-pratiques" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ShieldCheck className="h-4 w-4 text-[#0d3d28]" /> Bonnes pratiques
            </Link>
            <Button onClick={() => { setFormError(null); setCreateOpen(true); }}>
              <Plus className="h-4 w-4" /> Publier une annonce
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
          <button onClick={() => { setFilters({ ...filters, type: "TOUS" }); setPage(1); }} className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition ${filters.type === "TOUS" ? "bg-[#0d3d28] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            Toutes
          </button>
          {MARKETPLACE_TYPES.map((type) => (
            <button key={type} onClick={() => { setFilters({ ...filters, type }); setPage(1); }} className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition ${filters.type === type ? "bg-[#0d3d28] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              {MARKETPLACE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={filters.q} onChange={(event) => { setFilters({ ...filters, q: event.target.value }); setPage(1); }} placeholder="Rechercher un produit, un service, une mission, un événement…" className={`${inputClass} pl-9`} />
            </div>
            <select value={filters.category} onChange={(event) => { setFilters({ ...filters, category: event.target.value }); setPage(1); }} className={`${inputClass} lg:w-48`}>
              <option value="">Toutes les catégories</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={filters.rubrique} onChange={(event) => { setFilters({ ...filters, rubrique: event.target.value }); setPage(1); }} className={`${inputClass} lg:w-44`}>
              <option value="">Toutes les rubriques</option>
              {rubriqueOptions.map((rubrique) => <option key={rubrique} value={rubrique}>{rubrique}</option>)}
            </select>
            <select value={filters.sort} onChange={(event) => { setFilters({ ...filters, sort: event.target.value }); setPage(1); }} className={`${inputClass} lg:w-48`}>
              {MARKETPLACE_SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={filters.associationId} onChange={(event) => { setFilters({ ...filters, associationId: event.target.value }); setPage(1); }} className={`${inputClass} w-auto min-w-48`}>
              <option value="">Toutes mes associations</option>
              {associations.map((association) => <option key={association.id} value={association.id}>{association.name}</option>)}
            </select>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={filters.location} onChange={(event) => { setFilters({ ...filters, location: event.target.value }); setPage(1); }} placeholder="Ville / lieu" className={`${inputClass} w-40 pl-9`} />
            </div>
            <input type="number" min={0} value={filters.priceMin} onChange={(event) => { setFilters({ ...filters, priceMin: event.target.value }); setPage(1); }} placeholder="Prix min" className={`${inputClass} w-32`} />
            <input type="number" min={0} value={filters.priceMax} onChange={(event) => { setFilters({ ...filters, priceMax: event.target.value }); setPage(1); }} placeholder="Prix max" className={`${inputClass} w-32`} />
            <button type="button" onClick={() => setFilters({ q: "", type: "TOUS", category: "", rubrique: "", associationId: "", location: "", priceMin: "", priceMax: "", sort: "recent" })} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Réinitialiser
            </button>
            <span className="ml-auto text-xs font-medium text-slate-400">{total} annonce{total > 1 ? "s" : ""}</span>
          </div>
        </div>

        {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
        {error && !createOpen ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Aucune annonce ne correspond à votre recherche.</p>
            <p className="mt-1 text-xs text-slate-400">Modifiez les filtres ou publiez la première annonce de votre réseau.</p>
            <Button className="mt-5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Publier une annonce</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <button key={listing.id} onClick={() => openDetail(listing.id)} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0d3d28]/25 hover:shadow-lg">
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#e9f1eb] via-[#f5f0e6] to-[#e6ece8]">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Tag className="h-10 w-10 text-[#0d3d28]/25" /></div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full border bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TYPE_STYLES[listing.type] ?? TYPE_STYLES.VENTE}`}>{MARKETPLACE_TYPE_LABELS[listing.type] ?? listing.type}</span>
                  {listing.images?.length > 1 ? <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-white">+{listing.images.length - 1}</span> : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#a47718]">
                    <span>{listing.category}</span>
                    {listing.rubrique ? <><span className="text-slate-300">·</span><span>{listing.rubrique}</span></> : null}
                  </div>
                  <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-900">{listing.title}</h2>
                  {listing.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{listing.description}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    {listing.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</span> : null}
                    {listing.deadline ? <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{dateLabel(listing.deadline)}</span> : null}
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{(listing.views ?? 0) + (listing.interestCount ?? 0)}</span>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div>
                      <p className="text-base font-black text-[#0d3d28]">{listing.price != null ? formatCurrency(listing.price) : "Sur demande"}</p>
                      {listing.unit ? <p className="text-[10px] text-slate-400">/ {listing.unit}</p> : null}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500"><BadgeCheck className="h-3.5 w-3.5 text-[#a47718]" />{listing.seller?.name?.split(" ")[0] ?? "Membre"}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {pages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1); }} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-xs font-semibold text-slate-500">Page {page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => { setPage(page + 1); load(page + 1); }} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[#dbe7dd] bg-[#f6fbf7] p-5 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d3d28]/10 text-[#0d3d28]"><ShieldCheck className="h-5 w-5" /></span>
            <div><p className="text-sm font-bold text-slate-900">Une marketplace de confiance</p><p className="mt-1 text-xs leading-5 text-slate-500">Décrivez précisément votre annonce, vérifiez les coordonnées de votre interlocuteur et privilégiez les échanges via le chat Tchoua.</p></div>
          </div>
          <Link href="/marketplace/bonnes-pratiques" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0d3d28] hover:underline sm:mt-0">Lire les bonnes pratiques <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>

      {selected && (detailLoading || detail) ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-8">
          <div className="relative my-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button onClick={() => { setSelected(null); setDetail(null); }} className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow hover:bg-white"><X className="h-4 w-4" /></button>
            {detailLoading && !detail ? <div className="flex h-96 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#0d3d28]" /></div> : detail ? (
              <div className="grid md:grid-cols-[1.1fr_1fr]">
                <div className="bg-[#f3f1ea] p-4 sm:p-6">
                  {detail.listing.images?.length ? (
                    <div className="space-y-3">
                      <img src={detail.listing.images[0]} alt={detail.listing.title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                      {detail.listing.images.length > 1 ? <div className="grid grid-cols-4 gap-2">{detail.listing.images.slice(1).map((image) => <img key={image} src={image} alt="" className="aspect-square rounded-xl object-cover" />)}</div> : null}
                    </div>
                  ) : <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-white/70"><Tag className="h-14 w-14 text-[#0d3d28]/20" /></div>}
                </div>
                <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TYPE_STYLES[detail.listing.type]}`}>{MARKETPLACE_TYPE_LABELS[detail.listing.type]}</span>
                    <span className="text-[11px] font-semibold text-[#a47718]">{detail.listing.category}{detail.listing.rubrique ? ` · ${detail.listing.rubrique}` : ""}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-slate-900">{detail.listing.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{detail.listing.description || "Aucune description fournie."}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f8f7f3] p-4">
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Prix</p><p className="mt-0.5 text-lg font-black text-[#0d3d28]">{detail.listing.price != null ? formatCurrency(detail.listing.price) : "Sur demande"}</p>{detail.listing.unit ? <p className="text-[10px] text-slate-400">/ {detail.listing.unit}</p> : null}</div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Échéance</p><p className="mt-0.5 text-sm font-bold text-slate-800">{detail.listing.deadline ? dateLabel(detail.listing.deadline) : "Non précisée"}</p></div>
                    {detail.listing.location ? <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Lieu</p><p className="mt-0.5 text-sm font-semibold text-slate-700">{detail.listing.location}</p></div> : null}
                    {detail.listing.association?.name ? <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Association</p><p className="mt-0.5 text-sm font-semibold text-slate-700">{detail.listing.association.name}</p></div> : null}
                  </div>
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f0e9] text-sm font-bold text-[#0d3d28]">{(detail.listing.seller?.name || "M").charAt(0)}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{detail.listing.seller?.name}</p><p className="text-[11px] text-slate-400">{detail.listing.seller?.location || "Membre Tchoua"}</p></div>
                    {detail.isOwner ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Votre annonce</span> : null}
                  </div>

                  {!detail.isOwner ? (
                    <div className="mt-5 space-y-2">
                      <button onClick={() => { setInterestOpen(!interestOpen); setFormError(null); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d3d28] px-4 py-3 text-sm font-bold text-white hover:bg-[#0a3020]"><Heart className="h-4 w-4" /> Je suis intéressé</button>
                      <button onClick={() => openChat(detail.listing)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0d3d28]/20 bg-[#f6fbf7] px-4 py-3 text-sm font-bold text-[#0d3d28] hover:bg-[#eef7f0]"><MessageCircle className="h-4 w-4" /> Discuter avec l'annonceur</button>
                      {interestOpen ? (
                        <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 p-3">
                          <textarea value={interestMessage} onChange={(event) => setInterestMessage(event.target.value)} rows={3} placeholder="Votre message (facultatif)…" className={inputClass} />
                          <input value={interestContact} onChange={(event) => setInterestContact(event.target.value)} placeholder="Votre email ou téléphone (facultatif)" className={inputClass} />
                          {formError ? <p className="text-xs font-medium text-red-600">{formError}</p> : null}
                          <button onClick={submitInterest} disabled={interestSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#a47718] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{interestSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer mon intérêt</button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <div><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Personnes intéressées</p><span className="text-xs font-bold text-[#0d3d28]">{detail.interests?.length ?? detail.listing.interestCount ?? 0}</span></div>
                        {detail.interests?.length ? <div className="mt-2 space-y-2">{detail.interests.map((interest) => <div key={interest.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-800">{interest.user?.name || "Membre"}</p><span className="text-[10px] text-slate-400">{timeLabel(interest.createdAt)}</span></div>{interest.message ? <p className="mt-1 text-xs leading-5 text-slate-600">{interest.message}</p> : null}{interest.contact ? <p className="mt-1 text-[11px] font-medium text-[#0d3d28]">{interest.contact}</p> : null}</div>)}</div> : <p className="mt-2 text-xs text-slate-400">Aucun intérêt pour le moment.</p>}
                      </div>
                      {detail.conversations?.length ? <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Discussions</p><div className="mt-2 space-y-2">{detail.conversations.map((conversation) => <button key={conversation.id} onClick={() => openChat(detail.listing, conversation.id)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-left hover:border-[#0d3d28]/30"><span className="text-sm font-semibold text-slate-800">{conversation.buyer?.name || "Membre"}</span><span className="text-[11px] text-[#0d3d28]">Ouvrir <ChevronRight className="inline h-3 w-3" /></span></button>)}</div></div> : null}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-8">
          <form onSubmit={submitCreate} className="relative my-auto w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47718]">Petite annonce</p><h2 className="mt-1 text-xl font-black text-slate-900">Publier dans le réseau</h2><p className="mt-1 text-xs text-slate-500">Choisissez le type, décrivez votre annonce et précisez les modalités.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Type d'annonce"><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as MarketplaceType })} className={inputClass}>{MARKETPLACE_TYPES.map((type) => <option key={type} value={type}>{MARKETPLACE_TYPE_LABELS[type]} — {MARKETPLACE_TYPE_DESCRIPTIONS[type]}</option>)}</select></Field>
              <Field label="Association de publication"><select required value={form.associationId} onChange={(event) => setForm({ ...form, associationId: event.target.value })} className={inputClass}><option value="">Choisir…</option>{associations.map((association) => <option key={association.id} value={association.id}>{association.name}</option>)}</select></Field>
              <Field label="Titre" ><input required minLength={3} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex. Lot de 50 sacs de riz local" className={inputClass} /></Field>
              <Field label="Catégorie"><input required list="marketplace-categories" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass} /><datalist id="marketplace-categories">{categoryOptions.map((category) => <option key={category} value={category} />)}</datalist></Field>
              <Field label="Rubrique"><input list="marketplace-rubriques" value={form.rubrique} onChange={(event) => setForm({ ...form, rubrique: event.target.value })} className={inputClass} /><datalist id="marketplace-rubriques">{rubriqueOptions.map((rubrique) => <option key={rubrique} value={rubrique} />)}</datalist></Field>
              <Field label="Prix (FCFA)"><input type="number" min={0} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Facultatif" className={inputClass} /></Field>
              <Field label="Unité"><input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="kg, sac, jour, forfait…" className={inputClass} /></Field>
              <Field label="Quantité"><input type="number" min={0} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Facultatif" className={inputClass} /></Field>
              <Field label="Lieu"><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Ville, quartier…" className={inputClass} /></Field>
              <Field label="Date limite / échéance"><input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} className={inputClass} /></Field>
            </div>
            <div className="mt-4"><Field label="Description"><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Détails, conditions, délais de livraison…" className={inputClass} /></Field></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label="Téléphone"><input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} placeholder="+237…" className={inputClass} /></Field>
              <Field label="Email"><input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} placeholder="…" className={inputClass} /></Field>
              <Field label="WhatsApp"><input value={form.contactWhatsapp} onChange={(event) => setForm({ ...form, contactWhatsapp: event.target.value })} placeholder="+237…" className={inputClass} /></Field>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-700">Photos de l'annonce</p><p className="text-[11px] text-slate-400">JPG, PNG ou WEBP · 5 Mo max · 6 images max.</p></div><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Upload className="h-3.5 w-3.5" /> Ajouter<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => uploadFiles(event.target.files)} /></label></div>
              {uploading ? <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi des images…</p> : null}
              {form.images.length ? <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">{form.images.map((image) => <div key={image} className="relative"><img src={image} alt="" className="aspect-square rounded-lg object-cover" /><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((item) => item !== image) })} className="absolute -right-1 -top-1 rounded-full bg-slate-900 p-0.5 text-white"><X className="h-3 w-3" /></button></div>)}</div> : <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><ImagePlus className="h-4 w-4" /> Ajoutez une image pour rendre votre annonce plus visible.</div>}
            </div>
            <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600"><input type="checkbox" checked={form.accepted} onChange={(event) => setForm({ ...form, accepted: event.target.checked })} className="mt-0.5 h-4 w-4 accent-[#0d3d28]" /><span>Je confirme respecter les <Link href="/marketplace/bonnes-pratiques" target="_blank" className="font-bold text-[#0d3d28] underline">bonnes pratiques</Link> : informations exactes, pas de contenu illicite, coordonnées réelles et respect des autres membres.</span></label>
            {formError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button><Button type="submit" disabled={saving || uploading || !form.associationId}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Publier l'annonce</Button></div>
          </form>
        </div>
      ) : null}

      {chatOpen && chatListing ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-end bg-slate-950/40 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex h-[min(680px,88vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#a47718]">Discussion directe</p><p className="line-clamp-1 text-sm font-bold text-slate-900">{chatListing.title}</p></div><button onClick={() => setChatOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#faf9f5] p-4">{chatLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#0d3d28]" /></div> : chatMessages.length === 0 ? <p className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-500">Démarrez la discussion avec l'annonceur. Votre message crée une conversation privée liée à cette annonce.</p> : chatMessages.map((message) => <div key={message.id} className="rounded-2xl bg-white p-3 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-bold text-[#0d3d28]">{message.sender?.name || "Membre"}</p><span className="text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span></div><p className="mt-1 text-sm leading-5 text-slate-700">{message.content}</p></div>)}</div>
            <div className="border-t border-slate-100 p-3"><div className="flex gap-2"><input value={chatText} onChange={(event) => setChatText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }} placeholder="Écrire un message…" className={inputClass} /><button onClick={sendChat} disabled={!chatText.trim() || chatSending} className="rounded-xl bg-[#0d3d28] px-3 text-white disabled:opacity-40">{chatSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
