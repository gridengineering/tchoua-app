"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, Mail, Printer, X } from "lucide-react";

type ExportParams = {
  membershipId?: string;
  activityId?: string;
  year?: number | string;
  from?: string;
  to?: string;
};

export function ReportExportBar({
  associationId,
  section,
  params,
  compact = false,
}: {
  associationId: string;
  section: "state" | "history" | "dividends" | "interests";
  params?: ExportParams;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const query = () => {
    const qs = new URLSearchParams({ section });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") qs.set(key, String(value));
      });
    }
    return qs;
  };

  const printPdf = () => {
    setMessage(null);
    const qs = query();
    qs.set("format", "pdf");
    qs.set("inline", "1");
    window.open(`/api/associations/${associationId}/reports/export?${qs.toString()}`, "_blank", "noopener,noreferrer");
  };

  const downloadExcel = async () => {
    setBusy("excel");
    setMessage(null);
    try {
      const qs = query();
      qs.set("format", "excel");
      const res = await fetch(`/api/associations/${associationId}/reports/export?${qs.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Export Excel impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-${section}-${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "ok", text: "Export Excel téléchargé." });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Export impossible" });
    } finally {
      setBusy(null);
    }
  };

  const sendByEmail = async () => {
    setBusy("mail");
    setMessage(null);
    try {
      const res = await fetch(`/api/associations/${associationId}/reports/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          to: emailValue.trim(),
          ...(params ?? {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
      setMessage({ type: "ok", text: `Rapport envoyé à ${Array.isArray(data.recipients) ? data.recipients.join(", ") : "votre adresse"}.` });
      setEmailOpen(false);
      setEmailValue("");
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Envoi impossible" });
    } finally {
      setBusy(null);
    }
  };

  const buttonClass = compact
    ? "inline-flex items-center gap-1.5 rounded-lg border border-stone bg-white px-2.5 py-1.5 text-[11px] font-bold text-graphite hover:bg-cream disabled:opacity-50"
    : "inline-flex items-center gap-2 rounded-xl border border-stone bg-white px-3.5 py-2.5 text-xs font-bold text-graphite shadow-sm hover:bg-cream disabled:opacity-50";

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={printPdf} className={buttonClass} title="Ouvrir le PDF pour impression">
            <Printer className="h-3.5 w-3.5" /> Imprimer PDF
          </button>
          <button type="button" onClick={downloadExcel} disabled={busy === "excel"} className={buttonClass}>
            {busy === "excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} Excel
          </button>
          <button type="button" onClick={() => { setMessage(null); setEmailOpen(true); }} disabled={busy === "mail"} className={buttonClass}>
            {busy === "mail" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />} Envoyer par e-mail
          </button>
        </div>
        {message && (
          <p className={`text-[11px] font-semibold ${message.type === "ok" ? "text-emerald-700" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>

      {emailOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4" onClick={() => setEmailOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-stone bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-charcoal">Envoyer le rapport</h3>
                <p className="mt-1 text-xs leading-relaxed text-ash">
                  Le PDF et le fichier Excel seront joints. Laissez vide pour recevoir le rapport sur votre propre adresse.
                </p>
              </div>
              <button type="button" onClick={() => setEmailOpen(false)} className="rounded-lg p-1 text-ash hover:bg-cream" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.14em] text-ash">Destinataire(s)</label>
            <input
              autoFocus
              type="text"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="prenom.nom@exemple.com, autre@exemple.com"
              className="mt-1.5 w-full rounded-xl border border-stone px-3 py-2.5 text-sm text-charcoal outline-none focus:border-[#0d3d28]"
            />
            {message?.type === "error" && <p className="mt-2 text-xs font-semibold text-red-600">{message.text}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEmailOpen(false)} className="rounded-xl border border-stone px-3.5 py-2 text-xs font-bold text-graphite hover:bg-cream">Annuler</button>
              <button type="button" onClick={sendByEmail} disabled={busy === "mail"} className="inline-flex items-center gap-2 rounded-xl bg-[#0d3d28] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                {busy === "mail" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />} Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
