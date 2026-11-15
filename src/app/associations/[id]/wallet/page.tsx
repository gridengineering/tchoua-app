"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type Transaction = {
  id: string; amount: number; feeAmount: number; type: string; status: string;
  provider?: string | null; description?: string | null; createdAt: string;
};

type WalletData = {
  id: string; balance: number; currency: string; status: string; transactions: Transaction[];
};

export default function AssociationWalletPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [providers, setProviders] = useState<Array<{ id: string; label: string; min: number; max: number; instructions: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<"FUND" | "DEPOSIT" | "WITHDRAWAL">("FUND");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("MTN_MOMO");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/associations/${id}/wallet`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chargement impossible");
      setWallet(data.wallet);
      setCanManage(Boolean(data.canManage));
      setProviders(data.providers ?? []);
      if (data.providers?.[0]) setProvider(data.providers[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/associations/${id}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount: Number(amount), provider: action === "FUND" ? undefined : provider, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Opération impossible");
      setMessage(data.pending ? "Opération enregistrée en attente de confirmation." : "Opération effectuée.");
      setAmount(""); setDescription("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Wallet de l'association">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link href={`/associations/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0d3d28]">
          <ArrowLeft className="h-4 w-4" /> Retour à l&apos;association
        </Link>

        {loading ? <div className="flex h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div> : error && !wallet ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-[#0d3d28] to-[#173f2f] p-7 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3"><Wallet className="h-6 w-6" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/60">Wallet association</p>
                  <p className="text-3xl font-black">{wallet?.balance.toLocaleString("fr-FR")} <span className="text-base text-[#e0a33b]">{wallet?.currency}</span></p>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/60">
                Alimentez depuis votre wallet membre ou via Mobile Money, carte, virement ou PayPal. Les dépôts externes sont confirmés par le prestataire.
              </p>
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setAction("FUND")} className={`rounded-xl px-4 py-2 text-sm font-bold ${action === "FUND" ? "bg-[#0d3d28] text-white" : "bg-stone/40 text-gray-600"}`}>Alimenter depuis mon wallet</button>
                <button type="button" onClick={() => setAction("DEPOSIT")} className={`rounded-xl px-4 py-2 text-sm font-bold ${action === "DEPOSIT" ? "bg-[#0d3d28] text-white" : "bg-stone/40 text-gray-600"}`}>Dépôt externe</button>
                {canManage && <button type="button" onClick={() => setAction("WITHDRAWAL")} className={`rounded-xl px-4 py-2 text-sm font-bold ${action === "WITHDRAWAL" ? "bg-[#0d3d28] text-white" : "bg-stone/40 text-gray-600"}`}>Retrait</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Montant ({wallet?.currency})</label>
                  <input type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full rounded-xl border border-stone px-3 py-2.5 text-sm" />
                </div>
                {action !== "FUND" && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Moyen de paiement</label>
                    <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-xl border border-stone px-3 py-2.5 text-sm">
                      {providers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Libellé</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-stone px-3 py-2.5 text-sm" placeholder="Cotisation, projet, frais…" />
              </div>
              {message && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
              {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0d3d28] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : action === "WITHDRAWAL" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                Valider
              </button>
            </form>

            <div className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-charcoal">Historique du wallet</h2>
              {!wallet?.transactions.length ? <p className="py-8 text-center text-sm text-ash">Aucune opération.</p> : (
                <div className="divide-y divide-stone">
                  {wallet.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{tx.description || tx.type}</p>
                        <p className="text-xs text-ash">{new Date(tx.createdAt).toLocaleString("fr-FR")} {tx.provider ? `· ${tx.provider}` : ""} · {tx.status}</p>
                      </div>
                      <span className={`text-sm font-bold ${["DEPOSIT", "TRANSFER_IN"].includes(tx.type) ? "text-emerald-700" : "text-gray-900"}`}>
                        {["DEPOSIT", "TRANSFER_IN"].includes(tx.type) ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")} {wallet.currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
