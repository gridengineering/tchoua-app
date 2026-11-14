"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileText, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import type { ConsentKey } from "@/lib/consents";

type ConsentDocument = {
  key: ConsentKey;
  label: string;
  shortLabel: string;
  title: string;
  summary: string;
  points: string[];
  accepted: boolean;
  acceptedAt: string | null;
};

export default function ConsentementsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<ConsentDocument[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState("");

  useEffect(() => {
    fetch("/api/consents", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
        setDocuments(json.documents ?? []);
        setVersion(json.version ?? "");
        setChecked(Object.fromEntries((json.documents ?? []).map((doc: ConsentDocument) => [doc.key, Boolean(doc.accepted)])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const allChecked = documents.length > 0 && documents.every((doc) => checked[doc.key]);

  const accept = async () => {
    if (!allChecked) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: Object.keys(checked).filter((key) => checked[key]) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Conditions et consentements">
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#0d3d28]" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Conditions et consentements">
      <div className="mx-auto max-w-4xl space-y-5 pb-10">
        <div className="m-card rounded-2xl border p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0d3d28] text-white"><LockKeyhole className="h-5 w-5" /></span>
            <div>
              <h1 className="text-xl font-bold m-text">Avant de continuer</h1>
              <p className="mt-1 text-sm m-muted">
                Pour protéger votre compte et les membres de vos associations, vous devez lire et accepter les
                conditions ci-dessous. Cette étape est obligatoire pour tout nouveau membre, invité ou inscrit.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11.5px] text-sky-900">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            Version des documents : <strong>{version}</strong> · Votre acceptation est horodatée et conservée.
          </div>
        </div>

        <div className="space-y-3">
          {documents.map((doc) => (
            <section key={doc.key} className={`m-card rounded-2xl border p-5 transition ${checked[doc.key] ? "border-emerald-300" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#0d3d28]/8 text-[#0d3d28]"><FileText className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold m-text">{doc.title}</h2>
                    {doc.accepted ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Déjà accepté</span> : null}
                  </div>
                  <p className="mt-1.5 text-xs leading-5 m-muted">{doc.summary}</p>
                  <ul className="mt-2 space-y-1.5">
                    {doc.points.map((point) => (
                      <li key={point} className="flex gap-2 text-[11.5px] leading-4 m-muted">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#0d3d28]" />{point}
                      </li>
                    ))}
                  </ul>
                  <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border m-border px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[doc.key])}
                      onChange={(e) => setChecked({ ...checked, [doc.key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 accent-[#0d3d28]"
                    />
                    <span className="text-[11.5px] font-medium leading-4 m-text">
                      J&apos;ai lu et j&apos;accepte : {doc.label}
                    </span>
                  </label>
                </div>
              </div>
            </section>
          ))}
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{error}</div>
        ) : null}

        <div className="m-card sticky bottom-4 rounded-2xl border p-4 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11.5px] m-muted">
              En validant, vous confirmez avoir lu les quatre documents. Vous pourrez les consulter à tout moment
              depuis vos paramètres.
            </p>
            <button
              type="button"
              onClick={accept}
              disabled={!allChecked || saving}
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0d3d28] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              J&apos;accepte et je continue
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
