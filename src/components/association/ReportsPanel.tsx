"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, FileText, Download } from "lucide-react";

interface AssociationReport {
  id: string;
  type: string;
  title: string;
  format: string;
  status: string;
  fileUrl?: string | null;
  generatedAt?: string | null;
  createdAt: string;
}

interface ReportsPanelProps {
  associationId: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  GENERATING: "Génération…",
  READY: "Prêt",
  ERROR: "Erreur",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  GENERATING: "bg-blue-50 text-blue-700",
  READY: "bg-green-50 text-green-700",
  ERROR: "bg-red-50 text-red-700",
};

const REPORT_TYPES = [
  { value: "ACTIVITY", label: "Activité" },
  { value: "MEMBER", label: "Membres" },
  { value: "FINANCIAL", label: "Financier" },
  { value: "BILAN", label: "Bilan" },
  { value: "COMPTE_RESULTAT", label: "Compte de résultat" },
  { value: "TRESORERIE", label: "Trésorerie" },
  { value: "OHADA_SYSCOHADA", label: "OHADA SYSCOHADA" },
  { value: "SOLIDARITY", label: "Solidarité" },
  { value: "LOANS", label: "Prêts" },
  { value: "ATTENDANCE", label: "Présence" },
  { value: "INVESTMENT", label: "Investissement & Dividendes" },
  { value: "CROSS", label: "Croisé Multi-Activités" },
  { value: "CONSOLIDATED", label: "Consolidé (Mère + Filles)" },
  { value: "ATTESTATION", label: "Attestation de Cotisation (QR)" },
  { value: "AUDIT", label: "Journal d'Audit" },
];

export default function ReportsPanel({ associationId }: ReportsPanelProps) {
  const [reports, setReports] = useState<AssociationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: "ACTIVITY", format: "PDF" });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [associationId]);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/associations/${associationId}/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch(`/api/associations/${associationId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          format: formData.format,
          title: `Rapport ${formData.type}`,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        fetchReports();
      }
    } catch {
      // silent
    } finally {
      setGenerating(false);
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
        <h3 className="text-lg font-semibold text-[#0d3d28]">Rapports</h3>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0d3d28] hover:bg-[#0a2e1e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Générer un rapport
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleGenerate} className="mb-6 p-4 rounded-xl bg-[#faf9f6] space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((d) => ({ ...d, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData((d) => ({ ...d, format: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]"
            >
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
              <option value="CSV">CSV</option>
            </select>
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
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0d3d28] hover:bg-[#0a2e1e] disabled:opacity-60"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              Générer
            </button>
          </div>
        </form>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Aucun rapport généré
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#faf9f6] border border-gray-100"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                <p className="text-xs text-gray-500">
                  {report.format} ·{" "}
                  {report.generatedAt
                    ? new Date(report.generatedAt).toLocaleDateString("fr-FR")
                    : new Date(report.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    STATUS_COLORS[report.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[report.status] || report.status}
                </span>
                {report.status === "READY" && report.fileUrl && (
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[#0d3d28] hover:bg-[#0d3d28]/10"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
