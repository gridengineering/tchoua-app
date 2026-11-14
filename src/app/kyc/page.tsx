"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KycBadge } from "@/components/kyc/kyc-badge";
import { KYC_LEVELS, kycLevelInfo, normalizeKycLevel } from "@/lib/kyc";

type KycResponse = {
  level: number;
  status: string;
  verifiedAt?: string | null;
  profile?: Record<string, unknown> | null;
  user?: { name?: string; phone?: string | null; profession?: string | null; location?: string | null };
  latestRequest?: {
    id: string;
    requestedLevel: number;
    status: string;
    reviewNote?: string | null;
    createdAt: string;
    documents?: KycDocument[];
  } | null;
  verification?: { email: boolean; phone: boolean; whatsapp: boolean };
  platformConsentsComplete?: boolean;
};

type KycDocument = {
  id: string;
  type: string;
  label: string;
  mimeType: string;
  size: number;
  status: string;
  createdAt: string;
};

const inputCls =
  "w-full rounded-xl border border-[var(--m-border,#e2ddd4)] bg-white px-3 py-2.5 text-sm text-[#1f2937] outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10";
const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]";

export default function KycPage() {
  const [data, setData] = useState<KycResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [verifyChannel, setVerifyChannel] = useState<"EMAIL" | "PHONE" | "WHATSAPP">("EMAIL");
  const [verifyTarget, setVerifyTarget] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifySent, setVerifySent] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "", phone: "", dateOfBirth: "", nationality: "Camerounaise",
    idType: "CNI", idNumber: "", address: "", city: "", country: "Cameroun",
    occupation: "", sourceOfFunds: "", documentRef: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kyc", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setData(json);
      const docsRes = await fetch("/api/kyc/documents", { cache: "no-store" });
      const docsJson = docsRes.ok ? await docsRes.json() : { documents: [] };
      const merged = new Map<string, KycDocument>();
      for (const doc of [...(json.latestRequest?.documents ?? []), ...(docsJson.documents ?? [])]) merged.set(doc.id, doc);
      setDocuments(Array.from(merged.values()));
      setForm((current) => ({
        ...current,
        fullName: String(json.profile?.fullName ?? json.user?.name ?? ""),
        phone: String(json.profile?.phone ?? json.user?.phone ?? current.phone),
        city: String(json.profile?.city ?? json.user?.location ?? current.city),
        occupation: String(json.profile?.occupation ?? json.user?.profession ?? current.occupation),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sendCode = async () => {
    setVerifyBusy(true); setVerifyMessage(null); setError(null);
    try {
      const res = await fetch("/api/kyc/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: verifyChannel, target: verifyTarget || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      setVerifySent(true);
      setVerifyMessage(
        json.devCode
          ? `Mode test : votre code est ${json.devCode}`
          : `Code envoyé à ${json.target}. Il expire dans 10 minutes.`
      );
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally { setVerifyBusy(false); }
  };

  const confirmCode = async () => {
    setVerifyBusy(true); setVerifyMessage(null); setError(null);
    try {
      const res = await fetch("/api/kyc/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: verifyChannel, code: verifyCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Code invalide");
      setVerifyMessage("Canal vérifié avec succès.");
      setVerifyCode("");
      await load();
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : "Erreur");
    } finally { setVerifyBusy(false); }
  };

  const uploadDocument = async (type: string, label: string, file: File | null) => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("label", label);
      const res = await fetch("/api/kyc/documents", { method: "POST", body: formData });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Téléversement impossible");
      setDocuments((current) => [json.document, ...current]);
      setMessage("Document ajouté. Il sera contrôlé par le bureau.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setUploading(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedLevel: target,
          ...form,
          documentIds: documents.filter((doc) => doc.status === "PENDING").map((doc) => doc.id),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Demande impossible");
      setMessage(
        json.autoApproved
          ? "Votre niveau KYC 1 est activé. Vous pouvez déjà participer aux activités de base."
          : "Votre demande a été transmise au bureau. Vous serez notifié après vérification."
      );
      setTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Vérification d'identité (KYC)">
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#0d3d28]" /></div>
      </DashboardLayout>
    );
  }

  const current = normalizeKycLevel(data?.level ?? 0);
  const currentInfo = kycLevelInfo(current);
  const pending = data?.status === "PENDING";
  const rejected = data?.status === "REJECTED";

  return (
    <DashboardLayout title="Vérification d'identité (KYC)">
      <div className="space-y-6 pb-10">
        <div className="m-card overflow-hidden rounded-2xl border p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0d3d28] text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold m-text sm:text-2xl">Vérification d&apos;identité</h1>
                  <KycBadge level={current} status={data?.status} size="md" />
                </div>
                <p className="mt-1 max-w-2xl text-sm m-muted">
                  {currentInfo.description} Le niveau KYC conditionne votre accès aux activités et aux opérations
                  financières de vos associations.
                </p>
              </div>
            </div>
            <Link href="/consentements" className="inline-flex items-center gap-1.5 rounded-lg border m-border px-3 py-2 text-xs font-semibold m-text m-hover">
              <LockKeyhole className="h-3.5 w-3.5" /> Mes consentements
            </Link>
          </div>

          {!data?.platformConsentsComplete ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Vous devez d&apos;abord accepter les conditions d&apos;utilisation, la politique de confidentialité,
                la protection des données et l&apos;engagement de non-divulgation.{" "}
                <Link href="/consentements" className="font-bold underline">Ouvrir les consentements</Link>
              </span>
            </div>
          ) : null}

          {pending ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Demande KYC {data?.latestRequest?.requestedLevel ?? ""} en cours de vérification par le bureau ou
                l&apos;administration. Vous pouvez continuer à utiliser les activités autorisées par votre niveau actuel.
              </span>
            </div>
          ) : null}

          {rejected ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Votre dernière demande a été refusée. {data?.latestRequest?.reviewNote ? `Motif : ${data.latestRequest.reviewNote}.` : "Vous pouvez soumettre une nouvelle demande corrigée."}
              </span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {KYC_LEVELS.map((level) => {
            const acquired = current >= level.level;
            const isCurrent = current === level.level;
            const canRequest = level.level > current && !pending;
            return (
              <button
                key={level.level}
                type="button"
                disabled={!canRequest}
                onClick={() => { setTarget(level.level); setError(null); setMessage(null); }}
                className={`relative rounded-2xl border p-4 text-left transition ${
                  isCurrent ? "border-[#0d3d28] bg-[#0d3d28]/[0.04] shadow-sm" : "m-card m-border"
                } ${canRequest ? "hover:-translate-y-0.5 hover:shadow-md" : "cursor-default"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${acquired ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {acquired ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </span>
                  {isCurrent ? <span className="rounded-full bg-[#0d3d28] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Actuel</span> : null}
                </div>
                <p className="mt-3 text-sm font-bold m-text">{level.shortLabel} · {level.label}</p>
                <p className="mt-1 text-[11.5px] leading-4 m-muted">{level.description}</p>
                {canRequest ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#0d3d28]">
                    Améliorer <ChevronRight className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {target ? (
          <form onSubmit={submit} className="m-card rounded-2xl border p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold m-text">Passer au niveau {target} · {kycLevelInfo(target).label}</h2>
                <p className="mt-1 text-xs m-muted">{kycLevelInfo(target).description}</p>
              </div>
              <button type="button" onClick={() => setTarget(null)} className="text-xs font-semibold m-muted">Fermer</button>
            </div>

            {target === 1 ? (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
                <p className="text-xs font-bold text-sky-950">Vérification automatique du contact</p>
                <p className="mt-1 text-[11.5px] leading-4 text-sky-800">
                  Vérifiez votre e-mail, votre téléphone ou votre WhatsApp avec un code à 6 chiffres.
                  Au moins un canal vérifié est requis pour activer le KYC 1.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["EMAIL", "PHONE", "WHATSAPP"] as const).map((channel) => {
                    const verified = channel === "EMAIL" ? data?.verification?.email : channel === "PHONE" ? data?.verification?.phone : data?.verification?.whatsapp;
                    return (
                      <button key={channel} type="button" onClick={() => { setVerifyChannel(channel); setVerifySent(false); setVerifyMessage(null); }}
                        className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold ${verifyChannel === channel ? "border-[#0d3d28] bg-white text-[#0d3d28]" : "border-sky-200 bg-white/60 text-sky-800"}`}>
                        {verified ? "✓ " : ""}{channel === "EMAIL" ? "E-mail" : channel === "PHONE" ? "SMS" : "WhatsApp"}
                      </button>
                    );
                  })}
                </div>
                {verifyChannel !== "EMAIL" ? (
                  <label className="mt-3 block">
                    <span className={labelCls}>Numéro au format international</span>
                    <input className={inputCls} value={verifyTarget} onChange={(e) => setVerifyTarget(e.target.value)} placeholder="+237 6XX XX XX XX" />
                  </label>
                ) : null}
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <button type="button" onClick={sendCode} disabled={verifyBusy} className="rounded-lg bg-sky-900 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
                    {verifyBusy ? "Envoi…" : verifySent ? "Renvoyer le code" : "Envoyer le code"}
                  </button>
                  {verifySent ? (
                    <>
                      <input className={`${inputCls} !w-36`} value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="Code à 6 chiffres" inputMode="numeric" maxLength={6} />
                      <button type="button" onClick={confirmCode} disabled={verifyBusy || verifyCode.length !== 6} className="rounded-lg bg-[#0d3d28] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40">
                        Vérifier
                      </button>
                    </>
                  ) : null}
                </div>
                {verifyMessage ? <p className="mt-2 text-[11px] font-medium text-sky-900">{verifyMessage}</p> : null}
              </div>
            ) : null}

            {target >= 2 ? (
              <div className="mt-4 rounded-xl border border-[#e2ddd4] bg-[#fbf9f3] p-4">
                <p className="text-xs font-bold text-[#1f2937]">Pièces justificatives</p>
                <p className="mt-1 text-[11.5px] leading-4 text-[#7a7368]">
                  Ajoutez une pièce d&apos;identité et une photo récente de type passeport. Pour le niveau 3,
                  ajoutez aussi une preuve de localisation. Chaque pièce sera contrôlée par un membre du bureau
                  ayant un niveau KYC égal ou supérieur.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="block rounded-lg border border-dashed border-[#cfc6b6] bg-white p-3 text-[11.5px]">
                    <span className="font-bold text-[#1f2937]">Pièce d&apos;identité *</span>
                    <span className="mt-0.5 block text-[10.5px] text-[#8a8175]">CNI, passeport ou titre de séjour (JPEG, PNG, PDF)</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 block w-full text-[10.5px]" disabled={uploading} onChange={(e) => uploadDocument("ID_DOCUMENT", "Pièce d'identité", e.target.files?.[0] ?? null)} />
                  </label>
                  <label className="block rounded-lg border border-dashed border-[#cfc6b6] bg-white p-3 text-[11.5px]">
                    <span className="font-bold text-[#1f2937]">Photo type passeport *</span>
                    <span className="mt-0.5 block text-[10.5px] text-[#8a8175]">Photo récente, visage dégagé (JPEG, PNG)</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-[10.5px]" disabled={uploading} onChange={(e) => uploadDocument("PASSPORT_PHOTO", "Photo type passeport", e.target.files?.[0] ?? null)} />
                  </label>
                  {target === 3 ? (
                    <>
                      <label className="block rounded-lg border border-dashed border-[#cfc6b6] bg-white p-3 text-[11.5px]">
                        <span className="font-bold text-[#1f2937]">Preuve de localisation *</span>
                        <span className="mt-0.5 block text-[10.5px] text-[#8a8175]">Plan de localisation ou lien Google Maps (PDF, image)</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 block w-full text-[10.5px]" disabled={uploading} onChange={(e) => uploadDocument("LOCATION_PROOF", "Plan de localisation", e.target.files?.[0] ?? null)} />
                      </label>
                      <label className="block rounded-lg border border-dashed border-[#cfc6b6] bg-white p-3 text-[11.5px]">
                        <span className="font-bold text-[#1f2937]">Facture (électricité, eau…)</span>
                        <span className="mt-0.5 block text-[10.5px] text-[#8a8175]">Justificatif de domicile récent</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 block w-full text-[10.5px]" disabled={uploading} onChange={(e) => uploadDocument("UTILITY_BILL", "Facture de domicile", e.target.files?.[0] ?? null)} />
                      </label>
                    </>
                  ) : null}
                </div>
                {uploading ? <p className="mt-2 text-[11px] text-[#0d3d28]">Téléversement en cours…</p> : null}
                {documents.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {documents.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#e8e2d8] bg-white px-3 py-2 text-[11px]">
                        <span className="truncate text-[#3f3a33]">{doc.label} <span className="text-[#8a8175]">· {doc.type}</span></span>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${doc.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : doc.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{doc.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className={labelCls}>Nom légal complet *</span>
                <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </label>
              <label className="block">
                <span className={labelCls}>Téléphone *</span>
                <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+237 6XX XX XX XX" required={target === 1} />
              </label>
              <label className="block">
                <span className={labelCls}>Date de naissance</span>
                <input type="date" className={inputCls} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </label>
              <label className="block">
                <span className={labelCls}>Ville</span>
                <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              <label className="block">
                <span className={labelCls}>Pays</span>
                <input className={inputCls} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </label>

              {target >= 2 ? (
                <>
                  <label className="block">
                    <span className={labelCls}>Type de pièce *</span>
                    <select className={inputCls} value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
                      <option value="CNI">Carte nationale d&apos;identité</option>
                      <option value="PASSPORT">Passeport</option>
                      <option value="RESIDENCE_PERMIT">Titre de séjour</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Numéro de pièce *</span>
                    <input className={inputCls} value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} required />
                  </label>
                  <label className="block md:col-span-2">
                    <span className={labelCls}>Adresse complète *</span>
                    <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  </label>
                  <label className="block md:col-span-2">
                    <span className={labelCls}>Référence du document présenté au bureau</span>
                    <input className={inputCls} value={form.documentRef} onChange={(e) => setForm({ ...form, documentRef: e.target.value })} placeholder="Ex : pièce présentée au secrétariat le 14/11/2026" />
                  </label>
                </>
              ) : null}

              {target === 3 ? (
                <>
                  <label className="block">
                    <span className={labelCls}>Profession / activité</span>
                    <input className={inputCls} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Origine des fonds *</span>
                    <input className={inputCls} value={form.sourceOfFunds} onChange={(e) => setForm({ ...form, sourceOfFunds: e.target.value })} placeholder="Salaire, commerce, épargne…" required />
                  </label>
                </>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11.5px] leading-4 text-sky-900">
              <FileCheck2 className="mr-1 inline h-3.5 w-3.5" />
              Pour les niveaux 2 et 3, le bureau de l&apos;association ou l&apos;administration vérifie votre pièce
              d&apos;identité. Vous pouvez présenter l&apos;original au secrétariat : aucune image de pièce n&apos;est
              stockée dans l&apos;application.
            </div>

            {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
            {message ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setTarget(null)} className="rounded-lg border m-border px-3 py-2 text-xs font-semibold m-text">Annuler</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3d28] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {target === 1 ? "Activer mon KYC 1" : "Envoyer pour vérification"}
              </button>
            </div>
          </form>
        ) : null}

        {message && !target ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>
        ) : null}

        <div className="m-card rounded-2xl border p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold m-text"><ShieldCheck className="h-4 w-4 text-[#0d3d28]" /> Comment fonctionne le KYC Tchoua</h2>
          <div className="mt-3 grid gap-3 text-xs leading-5 m-muted md:grid-cols-3">
            <p><strong className="m-text">Approche par risque.</strong> Les niveaux sont proportionnés aux montants et à la sensibilité des opérations, conformément aux principes du GAFI, sans exiger les mêmes pièces pour tout le monde.</p>
            <p><strong className="m-text">Validation par le bureau.</strong> Le secrétaire, le président ou le trésorier peut vérifier une demande KYC 2 ou 3 depuis la liste des membres. L&apos;administration peut aussi intervenir.</p>
            <p><strong className="m-text">Données limitées.</strong> Seules les informations nécessaires sont conservées. Les pièces originales sont présentées au bureau ; l&apos;application garde la trace de la vérification, pas une copie de la pièce.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
