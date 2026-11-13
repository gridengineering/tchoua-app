"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, CheckCircle2, Copy, FileText, Layout, Loader2, Pencil, Plus,
  Power, Search, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  origin: string;
  visibility: string;
  isActive: boolean;
  usageCount: number;
  iconEmoji: string;
  color: string;
  createdAt: string;
};

const CATEGORIES = ["TONTINE", "FAMILLE", "COMMERCE", "VILLAGE", "PROJET", "RELIGIEUX", "EPARGNE", "AMICALE", "SECTION", "FEDERATION", "CULTUREL", "PROFESSIONNEL"];

const emptyForm = {
  name: "",
  description: "",
  category: "TONTINE",
  visibility: "PUBLIC",
  iconEmoji: "🏦",
  color: "#0d3d28",
  isActive: true,
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/templates");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      setTemplates(data.templates ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          (category === "ALL" || t.category === category) &&
          (t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase()))
      ),
    [templates, category, search]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (template: Template) => {
    setEditing(template);
    setForm({
      name: template.name,
      description: template.description ?? "",
      category: template.category,
      visibility: template.visibility ?? "PUBLIC",
      iconEmoji: template.iconEmoji ?? "🏦",
      color: template.color ?? "#0d3d28",
      isActive: template.isActive,
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/templates", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      setModalOpen(false);
      setToast(editing ? "Modèle mis à jour" : "Modèle créé");
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (template: Template) => {
    const res = await fetch("/api/admin/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: template.id, isActive: !template.isActive }),
    });
    if (res.ok) {
      setToast(template.isActive ? "Modèle désactivé" : "Modèle activé");
      load();
    }
  };

  const setVisibility = async (template: Template, visibility: string) => {
    const res = await fetch("/api/admin/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: template.id, visibility }),
    });
    if (res.ok) {
      setToast(`Visibilité : ${visibility}`);
      load();
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Modèles d&apos;associations</h1>
          <p className="mt-1 text-sm text-slate-500">Structures types réutilisables pour créer une association en quelques minutes.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouveau modèle
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un modèle…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip label="Tous" active={category === "ALL"} onClick={() => setCategory("ALL")} />
          {CATEGORIES.map((c) => (
            <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center text-sm text-red-700">
          <AlertCircle className="mx-auto mb-2 h-6 w-6" /> {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Aucun modèle pour ce filtre.</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Créer le premier modèle
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <div key={template.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${template.color ?? "#0d3d28"}14` }}
                >
                  {template.iconEmoji || "🏦"}
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusChip active={template.isActive} />
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {template.visibility}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">{template.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{template.description}</p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> {template.usageCount} utilisation(s)
                </span>
                <span className="font-semibold uppercase tracking-wide">{template.category}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleActive(template)}>
                  <Power className="h-3.5 w-3.5" /> {template.isActive ? "Désactiver" : "Activer"}
                </Button>
              </div>
              <div className="mt-2">
                <select
                  value={template.visibility}
                  onChange={(e) => setVisibility(template, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privé</option>
                  <option value="PENDING_REVIEW">En revue</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <form onSubmit={submit} className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? "Modifier le modèle" : "Nouveau modèle"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nom</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Catégorie</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Visibilité</label>
                  <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Privé</option>
                    <option value="PENDING_REVIEW">En revue</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Emoji</label>
                  <input value={form.iconEmoji} onChange={(e) => setForm({ ...form, iconEmoji: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Couleur</label>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-xl border border-slate-200" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
                Modèle actif
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit" loading={saving}>{editing ? "Enregistrer" : "Créer"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function StatusChip({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />
      {active ? "Actif" : "Inactif"}
    </span>
  );
}
