"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KycBadge } from "@/components/kyc/kyc-badge";

type Doc = { id: string; type: string; label: string; mimeType: string; size: number; status: string };
type Request = {
  id: string; requestedLevel: number; createdAt: string; fullName?: string | null;
  idType?: string | null; idNumber?: string | null; address?: string | null;
  city?: string | null; sourceOfFunds?: string | null; documents: Doc[];
};
type Member = {
  id: string; role: string; status: string;
  user: {
    id: string; name: string; email: string; phone?: string | null;
    kycLevel: number; kycStatus: string; emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null; whatsappVerifiedAt?: string | null;
    kycRequests: Request[];
  };
};

export default function AssociationKycPage() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [reviewerLevel, setReviewerLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/associations/${id}/kyc`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setMembers(json.memberships ?? []);
      setReviewerLevel(json.reviewerLevel ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const review = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    const note = decision === "REJECT" ? window.prompt("Motif du refus (optionnel)") ?? undefined : undefined;
    setBusy(requestId); setError(null); setNotice(null);
    try {
      const res = await fetch("/api/kyc/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision, note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Validation impossible");
      setNotice(decision === "APPROVE" ? "KYC approuvé. Le niveau sera visible dans toutes les associations de ce membre." : "Demande refusée.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setBusy(null); }
  };

  const pending = members.filter((m) => m.user.kycRequests.length > 0);

  return (
    <DashboardLayout title="Conformité KYC de l'association">
      <div className="space-y-5 pb-10">
        <Link href={`/associations/${id}`} className="inline-flex items-center gap-1.5 text-sm text-graphite hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Retour à l&apos;association</Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><ShieldCheck className="h-5 w-5 text-[#0d3d28]" /> Conformité KYC</h1>
            <p className="mt-1 text-sm text-gray-500">Validez les pièces des membres. Votre niveau KYC actuel est <strong>KYC {reviewerLevel}</strong> : vous ne pouvez approuver qu&apos;un niveau inférieur ou égal.</p>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{pending.length} demande(s) à traiter</span>
        </div>

        {error ? <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div> : null}
        {notice ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</div> : null}

        {loading ? <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-200 bg-white"><Loader2 className="h-6 w-6 animate-spin text-[#0d3d28]" /></div> : (
          <div className="space-y-4">
            {pending.map((member) => {
              const request = member.user.kycRequests[0];
              const tooLow = reviewerLevel < request.requestedLevel;
              return (
                <section key={member.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-900">{member.user.name}</h2>
                        <KycBadge level={member.user.kycLevel} status={member.user.kycStatus} />
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Demande KYC {request.requestedLevel}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{member.user.email} · {member.user.phone ?? "Téléphone non renseigné"}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold">
                        <span className={member.user.emailVerifiedAt ? "text-emerald-700" : "text-gray-400"}>E-mail vérifié</span>
                        <span className={member.user.phoneVerifiedAt ? "text-emerald-700" : "text-gray-400"}>Téléphone vérifié</span>
                        <span className={member.user.whatsappVerifiedAt ? "text-emerald-700" : "text-gray-400"}>WhatsApp vérifié</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => review(request.id, "APPROVE")} disabled={tooLow || busy === request.id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="h-3.5 w-3.5" /> Approuver</button>
                      <button onClick={() => review(request.id, "REJECT")} disabled={tooLow || busy === request.id} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40"><XCircle className="h-3.5 w-3.5" /> Refuser</button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3"><span className="block text-[10px] uppercase tracking-wider text-gray-400">Nom légal</span>{request.fullName ?? "—"}</div>
                    <div className="rounded-lg bg-gray-50 p-3"><span className="block text-[10px] uppercase tracking-wider text-gray-400">Pièce</span>{request.idType ?? "—"} · {request.idNumber ?? "—"}</div>
                    <div className="rounded-lg bg-gray-50 p-3 md:col-span-2"><span className="block text-[10px] uppercase tracking-wider text-gray-400">Adresse</span>{request.address ?? "—"} {request.city ?? ""}</div>
                    {request.sourceOfFunds ? <div className="rounded-lg bg-gray-50 p-3 md:col-span-2"><span className="block text-[10px] uppercase tracking-wider text-gray-400">Origine des fonds</span>{request.sourceOfFunds}</div> : null}
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pièces jointes</p>
                    {request.documents.length === 0 ? <p className="mt-1 text-xs text-gray-400">Aucune pièce jointe.</p> : (
                      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                        {request.documents.map((doc) => (
                          <a key={doc.id} href={`/api/kyc/documents/${doc.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50">
                            <span className="flex items-center gap-1.5 truncate"><FileText className="h-3.5 w-3.5 text-gray-400" />{doc.label} · {doc.type}</span><span className="text-gray-400">{doc.status}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {tooLow ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">Votre niveau KYC {reviewerLevel} est inférieur au niveau demandé {request.requestedLevel}. Un membre du bureau de niveau égal ou supérieur doit valider cette demande.</p> : null}
                </section>
              );
            })}
            {pending.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">Aucune demande KYC en attente.</div> : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
