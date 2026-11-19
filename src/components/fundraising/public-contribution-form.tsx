"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

type Props = {
  projectId: string;
  currency: string;
  contributionMode: string;
  fixedAmount?: number | null;
  contributorMode: string;
};

export function PublicContributionForm({ projectId, currency, contributionMode, fixedAmount, contributorMode }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(fixedAmount || ""));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(contributorMode === "ANONYME");
  const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`/api/fundraising/${projectId}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          contributorName: name,
          contributorEmail: email,
          contributorPhone: phone,
          message,
          isAnonymous: anonymous,
          paymentMethod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Contribution impossible.");
      setSuccess("Votre contribution a bien été enregistrée. Elle sera confirmée par le bureau de l’association.");
      setMessage("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Contribution impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#dfe8e1] bg-white p-5">
      <h2 className="text-sm font-black tracking-[-0.02em] text-[#102019]">Contribuer</h2>
      <p className="mt-1 text-[11px] leading-5 text-[#7a887f]">Votre promesse est transmise au bureau. Aucun débit automatique n’est effectué.</p>
      <div className="mt-4 space-y-3">
        <label className="block text-[11px] font-bold text-[#3f4e45]">Montant ({currency})
          <input value={amount} onChange={(e) => setAmount(e.target.value)} disabled={contributionMode === "FIXE"} required type="number" min="1" step="1" className="mt-1 w-full rounded-xl border border-[#dfe8e1] bg-white px-3 py-2.5 text-sm font-bold text-[#102019] disabled:bg-[#f5f8f4]" />
        </label>
        {contributionMode === "FIXE" && <p className="text-[10px] font-bold text-[#0d3d28]">Montant fixe imposé par l’association.</p>}
        {contributorMode === "AU_CHOIX" && (
          <label className="flex items-center gap-2 text-[11px] font-bold text-[#3f4e45]">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Contribuer anonymement
          </label>
        )}
        {!anonymous && (
          <>
            <label className="block text-[11px] font-bold text-[#3f4e45]">Votre nom
              <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-xl border border-[#dfe8e1] px-3 py-2.5 text-sm" />
            </label>
            <label className="block text-[11px] font-bold text-[#3f4e45]">E-mail
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className="mt-1 w-full rounded-xl border border-[#dfe8e1] px-3 py-2.5 text-sm" />
            </label>
            <label className="block text-[11px] font-bold text-[#3f4e45]">Téléphone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-[#dfe8e1] px-3 py-2.5 text-sm" />
            </label>
          </>
        )}
        <label className="block text-[11px] font-bold text-[#3f4e45]">Message (optionnel)
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#dfe8e1] px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-[11px] font-bold text-[#3f4e45]">Moyen de contribution
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-[#dfe8e1] bg-white px-3 py-2.5 text-sm">
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK">Virement bancaire</option>
            <option value="CASH">Espèces</option>
            <option value="ONLINE">Paiement en ligne</option>
          </select>
        </label>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">{error}</p>}
      {success && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">{success}</p>}
      <button disabled={loading} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d3d28] px-4 py-3 text-xs font-black text-white disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer ma contribution
      </button>
    </form>
  );
}
