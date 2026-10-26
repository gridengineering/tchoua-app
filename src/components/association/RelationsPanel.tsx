"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Link2, ArrowUp, ArrowDown, Users } from "lucide-react";

interface AssociationRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  source?: { id: string; name: string };
  target?: { id: string; name: string };
}

interface RelationsPanelProps {
  associationId: string;
}

const RELATION_LABELS: Record<string, string> = {
  MOTHER: "Mère",
  CHILD: "Fille",
  SISTER: "Sœur",
};

const RELATION_ICONS: Record<string, React.ReactNode> = {
  MOTHER: <ArrowUp className="w-4 h-4" />,
  CHILD: <ArrowDown className="w-4 h-4" />,
  SISTER: <Users className="w-4 h-4" />,
};

export default function RelationsPanel({ associationId }: RelationsPanelProps) {
  const [relations, setRelations] = useState<AssociationRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetId: "",
    type: "SISTER",
    notes: "",
  });

  useEffect(() => {
    fetchRelations();
  }, [associationId]);

  async function fetchRelations() {
    setLoading(true);
    try {
      const res = await fetch(`/api/associations/${associationId}/relations`);
      if (res.ok) {
        const data = await res.json();
        setRelations(data.relations || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/associations/${associationId}/relations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ targetId: "", type: "SISTER", notes: "" });
        fetchRelations();
      }
    } catch {
      // silent
    }
  }

  async function handleDissolve(relationId: string) {
    try {
      const res = await fetch(
        `/api/associations/${associationId}/relations?relationId=${encodeURIComponent(relationId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchRelations();
      }
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#0d3d28]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#0d3d28]">Relations inter-associations</h3>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0d3d28] hover:bg-[#0a2e1e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une relation
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-[#faf9f6] space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID association cible</label>
            <input
              type="text"
              value={formData.targetId}
              onChange={(e) => setFormData((d) => ({ ...d, targetId: e.target.value }))}
              placeholder="cuid de l'association"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de relation</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((d) => ({ ...d, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]"
            >
              <option value="MOTHER">Mère</option>
              <option value="CHILD">Fille</option>
              <option value="SISTER">Sœur</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Optionnel"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0d3d28] hover:bg-[#0a2e1e]"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {relations.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Aucune relation définie
        </div>
      ) : (
        <div className="space-y-3">
          {relations.map((rel) => {
            const isSource = rel.sourceId === associationId;
            const other = isSource ? rel.target : rel.source;
            const label = isSource
              ? RELATION_LABELS[rel.type]
              : rel.type === "MOTHER"
              ? "Fille"
              : rel.type === "CHILD"
              ? "Mère"
              : "Sœur";

            return (
              <div
                key={rel.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#faf9f6] border border-gray-100"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0d3d28]/10 text-[#0d3d28]">
                  {RELATION_ICONS[rel.type] || <Link2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {other?.name || "Association inconnue"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {label} · {new Date(rel.startDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    rel.status === "ACTIVE"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {rel.status === "ACTIVE" ? "Active" : rel.status}
                </span>
                {rel.status === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() => handleDissolve(rel.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    title="Rompre la relation sans supprimer l'association"
                  >
                    Détacher
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
