"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CheckCircle2, FileSpreadsheet, FileText, Landmark, Loader2, Upload, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type Tx = {
  id: string; type: string; direction: string; method: string; amount: number;
  balanceAfter: number; status: string; reference?: string | null; proofUrl?: string | null;
  note?: string | null; createdAt: string;
  activity?: { id: string; name: string } | null;
  bankAccount?: { id: string; label: string; bankName?: string | null; accountNumber?: string | null } | null;
  membership?: { id?: string; user?: { name?: string } | null; memberNumber?: string | null } | null;
};
type Activity = { id: string; name: string; type: string; caisseBalance: number };
type Bank = { id: string; label: string; bankName?: string | null; accountNumber?: string | null; isDefault?: boolean };
type Member = { id: string; memberNumber?: string | null; role: string; user: { name: string; email?: string | null } };

const money = (v: number, c = "XAF") => `${Number(v ?? 0).toLocaleString("fr-FR")} ${c}`;

export default function MemberAccountsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [scopeAll, setScopeAll] = useState(false);
  const [method, setMethod] = useState("WALLET");
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [activityId, setActivityId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("WALLET");
  const [filters, setFilters] = useState({ activityId: "", method: "", from: "", to: "" });

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (targetId) p.set("membershipId", targetId);
    if (scopeAll) p.set("scope", "association");
    if (filters.activityId) p.set("activityId", filters.activityId);
    if (filters.method) p.set("method", filters.method);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    return p.toString();
  }, [targetId, scopeAll, filters]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/associations/${id}/member-account?${qs}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Chargement impossible");
      setData(payload);
      if (!targetId && payload.target?.id) setTargetId(payload.target.id);
      if (!bankAccountId) {
        const preferred = payload.bankAccounts?.find((b: Bank) => b.isDefault) ?? payload.bankAccounts?.[0];
        if (preferred) setBankAccountId(preferred.id);
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [id, qs, targetId, bankAccountId]);

  useEffect(() => { if (id) void load(); }, [id, qs]); // eslint-disable-line react-hooks/exhaustive-deps

  const account = data?.account;
  const currency = data?.association?.currency ?? "XAF";
  const cash = data?.association?.cash ?? { enabled: true, max: 0 };
  const canManage = Boolean(data?.canManage);
  const targetIsSelf = !data?.target?.id || data?.target?.id === data?.me?.id;
  const pending = (data?.transactions ?? []).filter((t: Tx) => t.status === "PENDING");

  const uploadProof = async (file: File) => {
    setSaving(true); setError(""); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch(`/api/associations/${id}/member-account/proofs`, { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Envoi impossible");
      setProofUrl(payload.url);
      setMessage("Preuve jointe. Vous pouvez valider le versement.");
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const post = async (body: Record<string, unknown>, success: string) => {
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/associations/${id}/member-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ ...body, membershipId: (body.membershipId as string | undefined) ?? (targetId || undefined) }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Opération impossible");
      setMessage(payload.pending ? "Opération enregistrée en attente de rapprochement." : success);
      setAmount(""); setSettleAmount(""); setNote(""); setProofUrl("");
      await load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return setError("Montant invalide");
    if (method === "WALLET") return post({ action: "DEPOSIT_WALLET", amount: value, note }, "Versement depuis votre wallet enregistré.");
    if (method === "BANK") {
      if (!bankAccountId) return setError("Choisissez un compte bancaire.");
      if (!proofUrl) return setError("Joignez la preuve du virement bancaire.");
      return post({ action: "DEPOSIT_BANK", amount: value, bankAccountId, proofUrl, note, reference: "" }, "Versement bancaire enregistré.");
    }
    if (!cash.enabled) return setError("Les espèces sont désactivées pour cette association.");
    return post({ action: "DEPOSIT_CASH", amount: value, note }, "Encaissement espèces enregistré.");
  };

  const settle = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(settleAmount);
    if (!value || value <= 0 || !activityId) return setError("Choisissez une activité et un montant.");
    await post({ action: "SETTLE", amount: value, activityId, note }, "Engagement réglé depuis votre compte association.");
  };

  const withdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return setError("Montant invalide");
    if (withdrawMethod === "BANK" && (!bankAccountId || !proofUrl)) return setError("Compte bancaire et preuve requis.");
    await post({ action: "WITHDRAW", amount: value, method: withdrawMethod, bankAccountId: withdrawMethod === "BANK" ? bankAccountId : undefined, proofUrl: withdrawMethod === "BANK" ? proofUrl : undefined, note }, "Retrait enregistré.");
  };

  const confirm = (tx: Tx) => post({ action: "CONFIRM_BANK", amount: tx.amount, transactionId: tx.id, membershipId: tx.membership?.id }, "Versement bancaire confirmé et crédité.");

  const exportUrl = (format: string) => {
    const p = new URLSearchParams();
    if (targetId) p.set("membershipId", targetId);
    if (scopeAll) p.set("scope", "association");
    if (filters.activityId) p.set("activityId", filters.activityId);
    if (filters.method) p.set("method", filters.method);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    p.set("format", format);
    return `/api/associations/${id}/member-account/export?${p.toString()}`;
  };

  if (loading && !data) return <DashboardLayout title="Comptes & versements"><div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div></DashboardLayout>;
  if (error && !data) return <DashboardLayout title="Comptes & versements"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div></DashboardLayout>;

  return (
    <DashboardLayout title="Comptes & versements">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/associations/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0d3d28]"><ArrowLeft className="h-4 w-4" /> Retour à l&apos;association</Link>
          <div className="flex items-center gap-2">
            {canManage && (
              <select value={targetId} onChange={(e) => { setTargetId(e.target.value); setScopeAll(false); }} className="rounded-xl border border-stone bg-white px-3 py-2 text-sm">
                {(data?.members ?? []).map((m: Member) => <option key={m.id} value={m.id}>{m.user.name}{m.memberNumber ? ` · ${m.memberNumber}` : ""}</option>)}
              </select>
            )}
            <button onClick={load} className="rounded-xl border border-stone bg-white px-3 py-2 text-sm font-semibold">Actualiser</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-br from-[#0d3d28] to-[#174b35] p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 text-white/65"><Wallet className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Mon AVOIR association</span></div>
            <p className="mt-3 text-3xl font-black">{money(account?.balance, currency)}</p>
            <p className="mt-2 text-xs text-white/60">{data?.target?.name} · {data?.target?.memberNumber ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-graphite"><Wallet className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-widest">Wallet membre</span></div>
            <p className="mt-3 text-2xl font-black text-charcoal">{money(data?.wallet?.balance ?? 0, data?.wallet?.currency ?? currency)}</p>
            <p className="mt-2 text-xs text-ash">Source possible pour un versement association.</p>
          </div>
          <div className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-graphite"><Landmark className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-widest">Flux période</span></div>
            <p className="mt-3 text-sm font-bold text-emerald-700">+ {money(data?.summary?.totalIn ?? 0, currency)}</p>
            <p className="text-sm font-bold text-rose-700">− {money(data?.summary?.totalOut ?? 0, currency)}</p>
            <p className="mt-2 text-xs text-ash">{data?.summary?.count ?? 0} mouvement(s)</p>
          </div>
        </div>

        {message && <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={submitDeposit} className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-charcoal">Approvisionner mon compte association</h2>
            <p className="mb-4 text-xs text-ash">Le versement alimente votre AVOIR. Les espèces ne peuvent être encaissées que par le bureau.</p>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {["WALLET", "BANK", "CASH"].map((m) => <button key={m} type="button" onClick={() => setMethod(m)} className={`rounded-xl px-2 py-2 text-xs font-bold ${method === m ? "bg-[#0d3d28] text-white" : "bg-stone/40 text-gray-600"}`}>{m === "WALLET" ? "Mon Wallet" : m === "BANK" ? "Banque" : "Espèces"}</button>)}
            </div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Montant ({currency})</label>
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required className="mb-3 w-full rounded-xl border border-stone px-3 py-2.5 text-sm" />
            {method === "BANK" && <>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Compte bancaire de l&apos;association</label>
              <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="mb-3 w-full rounded-xl border border-stone px-3 py-2.5 text-sm">
                {(data?.bankAccounts ?? []).map((b: Bank) => <option key={b.id} value={b.id}>{b.label} · {b.bankName} · {b.accountNumber}</option>)}
              </select>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Preuve du virement (JPG, PNG ou PDF)</label>
              <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-stone p-3 text-xs text-graphite">
                <Upload className="h-4 w-4" /> {proofUrl ? "Preuve jointe" : "Joindre la preuve"}
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProof(e.target.files[0])} />
              </label>
            </>}
            {method === "CASH" && <p className={`mb-3 rounded-xl p-3 text-xs ${cash.enabled ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}>{cash.enabled ? `Espèces autorisées${cash.max ? ` · plafond ${money(cash.max, currency)}` : ""}. Encaisssement par le bureau.` : "Espèces désactivées pour cette association."}</p>}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Libellé (optionnel)" className="mb-3 w-full rounded-xl border border-stone px-3 py-2.5 text-sm" />
            <button disabled={saving || (method === "CASH" && !canManage)} className="inline-flex items-center gap-2 rounded-xl bg-[#0d3d28] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" type="submit">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownLeft className="h-4 w-4" />} Enregistrer le versement
            </button>
          </form>

          <div className="space-y-5">
            <form onSubmit={settle} className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-charcoal">Régler mes engagements</h2>
              <p className="mb-4 text-xs text-ash">Utilisez votre AVOIR pour une cotisation ou un remboursement. Aucun passage par votre wallet.</p>
              <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="mb-3 w-full rounded-xl border border-stone px-3 py-2.5 text-sm">
                <option value="">Choisir une activité…</option>
                {(data?.activities ?? []).map((a: Activity) => <option key={a.id} value={a.id}>{a.name} · solde {money(a.caisseBalance, currency)}</option>)}
              </select>
              <input type="number" min={1} value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} placeholder="Montant" className="mb-3 w-full rounded-xl border border-stone px-3 py-2.5 text-sm" />
              <button disabled={saving || !activityId} className="inline-flex items-center gap-2 rounded-xl bg-[#8a6410] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" type="submit"><ArrowUpRight className="h-4 w-4" /> Régler depuis l&apos;AVOIR</button>
            </form>

            {canManage && <form onSubmit={withdraw} className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-charcoal">Payer un membre</h2>
              <p className="mb-4 text-xs text-ash">Débit de l&apos;AVOIR du membre vers son wallet, la banque ou les espèces.</p>
              <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)} className="mb-2 w-full rounded-xl border border-stone px-3 py-2.5 text-sm">
                <option value="WALLET">Vers le Wallet du membre</option>
                <option value="BANK">Virement bancaire</option>
                <option value="CASH">Espèces</option>
              </select>
              {withdrawMethod === "BANK" && <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="mb-2 w-full rounded-xl border border-stone px-3 py-2.5 text-sm">{(data?.bankAccounts ?? []).map((b: Bank) => <option key={b.id} value={b.id}>{b.label} · {b.bankName}</option>)}</select>}
              <div className="grid grid-cols-2 gap-2"><input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant" className="rounded-xl border border-stone px-3 py-2.5 text-sm" /><button disabled={saving} className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" type="submit">Payer</button></div>
            </form>}
          </div>
        </div>

        {canManage && pending.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-900"><CheckCircle2 className="h-5 w-5" /> Rapprochement bancaire en attente ({pending.length})</h2>
          <div className="space-y-2">{pending.map((t: Tx) => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm">
            <div><p className="font-semibold">{t.membership?.user?.name} · {money(t.amount, currency)}</p><p className="text-xs text-ash">{t.bankAccount?.bankName} · {t.bankAccount?.accountNumber} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}</p>{t.proofUrl && <a href={t.proofUrl} target="_blank" className="text-xs font-semibold text-[#0d3d28] underline">Voir la preuve</a>}</div>
            <button onClick={() => confirm(t)} disabled={saving} className="rounded-xl bg-[#0d3d28] px-4 py-2 text-xs font-bold text-white">Confirmer le versement</button>
          </div>)}</div>
        </div>}

        <div className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-base font-bold text-charcoal">Relevé de compte</h2><p className="text-xs text-ash">Entrées et sorties, filtre activité / compte / période.</p></div>
            <div className="flex flex-wrap gap-2">
              {canManage && <label className="flex items-center gap-2 text-xs font-semibold text-graphite"><input type="checkbox" checked={scopeAll} onChange={(e) => { setScopeAll(e.target.checked); }} /> Toute l&apos;association</label>}
              <a href={exportUrl("PDF")} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-stone px-3 py-2 text-xs font-bold"><FileText className="h-3.5 w-3.5" /> PDF</a>
              <a href={exportUrl("EXCEL")} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-stone px-3 py-2 text-xs font-bold"><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</a>
            </div>
          </div>
          <div className="mb-4 grid gap-2 sm:grid-cols-4">
            <select value={filters.activityId} onChange={(e) => setFilters({ ...filters, activityId: e.target.value })} className="rounded-lg border border-stone px-2 py-2 text-xs"><option value="">Toutes les activités</option>{(data?.activities ?? []).map((a: Activity) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
            <select value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })} className="rounded-lg border border-stone px-2 py-2 text-xs"><option value="">Tous les comptes</option><option value="WALLET">Wallet</option><option value="BANK">Banque</option><option value="CASH">Espèces</option><option value="ACTIVITY">Activité</option></select>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="rounded-lg border border-stone px-2 py-2 text-xs" />
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="rounded-lg border border-stone px-2 py-2 text-xs" />
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="border-b border-stone text-ash"><tr><th className="p-2">Date</th><th className="p-2">Membre</th><th className="p-2">Activité</th><th className="p-2">Type</th><th className="p-2">Compte</th><th className="p-2 text-right">Montant</th><th className="p-2 text-right">Solde</th><th className="p-2">Statut</th></tr></thead><tbody>
            {(data?.transactions ?? []).map((t: Tx) => <tr key={t.id} className="border-b border-stone/50"><td className="p-2">{new Date(t.createdAt).toLocaleDateString("fr-FR")}</td><td className="p-2">{t.membership?.user?.name}</td><td className="p-2">{t.activity?.name ?? "Compte membre"}</td><td className="p-2">{t.type}</td><td className="p-2">{t.method}</td><td className={`p-2 text-right font-bold ${t.direction === "IN" ? "text-emerald-700" : "text-rose-700"}`}>{t.direction === "IN" ? "+" : "−"}{money(t.amount, currency)}</td><td className="p-2 text-right">{money(t.balanceAfter, currency)}</td><td className="p-2">{t.status}</td></tr>)}
            {!data?.transactions?.length && <tr><td colSpan={8} className="p-8 text-center text-ash">Aucun mouvement.</td></tr>}
          </tbody></table></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.activities ?? []).map((a: Activity) => <Link key={a.id} href={`/associations/${id}/comptes?activity=${a.id}`} onClick={(e) => { e.preventDefault(); setFilters({ ...filters, activityId: a.id }); }} className="rounded-2xl border border-stone bg-white p-4 shadow-sm transition hover:border-[#0d3d28]/40">
            <p className="text-xs font-bold uppercase tracking-widest text-ash">Compte activité</p><p className="mt-1 font-bold text-charcoal">{a.name}</p><p className="mt-2 text-xl font-black text-[#0d3d28]">{money(a.caisseBalance, currency)}</p><p className="mt-1 text-xs text-ash">{a.type}</p>
          </Link>)}
        </div>
      </div>
    </DashboardLayout>
  );
}
