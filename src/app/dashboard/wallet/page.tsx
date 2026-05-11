"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, 
  History, Loader2, CreditCard, Landmark, Smartphone, AlertCircle, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  description: string | null;
  createdAt: string;
};

type WalletData = {
  id: string;
  balance: number;
  currency: string;
  status: string;
  transactions: Transaction[];
};

export default function WalletPage() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | null>(null);
  const [amount, setAmount] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const calculateFees = (amountStr: string, actionType: string | null, method: string) => {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) return 0;
    if (actionType === "DEPOSIT") {
      if (method === "MOBILE_MONEY") { let f = amt * 0.01; if (f < 100) f = 100; if (f > 5000) f = 5000; return f; }
      else if (method === "BANK_CARD") return amt * 0.025;
      else return 500;
    } else if (actionType === "WITHDRAWAL") {
      if (method === "MOBILE_MONEY") return 500;
      else if (method === "BANK_TRANSFER") return 1000;
    }
    return 0;
  };

  const currentFee = calculateFees(amount, action, paymentMethod);
  const totalAmount = (action === "DEPOSIT" || action === "WITHDRAWAL") ? parseFloat(amount || "0") + currentFee : parseFloat(amount || "0");

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) { const data = await res.json(); setWallet(data.wallet); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (session) fetchWallet(); }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wallet/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: action, amount: parseFloat(amount), receiverId: action === "TRANSFER" ? receiverId : undefined, description: description || undefined, reference: paymentMethod, otpCode: requiresOTP ? otpCode : undefined }),
      });
      const data = await res.json();
      if (res.status === 200 && data.requiresOTP) { setRequiresOTP(true); setIsSubmitting(false); return; }
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      await fetchWallet();
      setAction(null); setAmount(""); setReceiverId(""); setDescription(""); setRequiresOTP(false); setOtpCode("");
    } catch (err: any) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Mon Portefeuille">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#165E39]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mon Portefeuille">
      <div className="flex gap-6">

        {/* ── LEFT: Wallet + History ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5 overflow-y-auto">

          {/* Page Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#165E39]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#165E39]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-charcoal">Mon Portefeuille</h1>
              <p className="text-graphite font-medium text-sm">Gérez vos fonds et transactions</p>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="bg-gradient-to-br from-[#165E39] to-[#0F3F26] rounded-3xl p-7 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-7">
                <div>
                  <p className="text-white/70 font-bold uppercase tracking-widest text-xs mb-1">Solde Disponible</p>
                  <h2 className="text-4xl font-black">
                    {wallet?.balance.toLocaleString("fr-FR")} <span className="text-xl text-[#E38513]">{wallet?.currency}</span>
                  </h2>
                </div>
                <img src="/logo-icon.svg" alt="Tchoua" className="w-10 h-10 opacity-50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAction("DEPOSIT")} className={cn("flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm", action === "DEPOSIT" ? "bg-[#E38513] ring-2 ring-white" : "bg-[#E38513]/80 hover:bg-[#E38513]")}>
                  <ArrowDownLeft className="w-4 h-4" /> Dépôt
                </button>
                <button onClick={() => setAction("WITHDRAWAL")} className={cn("flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all backdrop-blur-sm text-sm", action === "WITHDRAWAL" ? "bg-white/30 ring-2 ring-white" : "bg-white/10 hover:bg-white/20")}>
                  <ArrowUpRight className="w-4 h-4" /> Retrait
                </button>
                <button onClick={() => setAction("TRANSFER")} className={cn("flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all backdrop-blur-sm text-sm", action === "TRANSFER" ? "bg-white/30 ring-2 ring-white" : "bg-white/10 hover:bg-white/20")}>
                  <ArrowRightLeft className="w-4 h-4" /> Transfert
                </button>
              </div>
            </div>
          </div>

          {/* Status + Payment info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-white rounded-2xl p-4 shadow-sm border border-stone">
              <h3 className="font-semibold text-charcoal mb-3 text-sm">Statut du Compte</h3>
              <div className="flex items-center gap-2 p-3 bg-forest/10 rounded-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-forest animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-900">Actif & Sécurisé</p>
                  <p className="text-xs text-forest">Aucune limite imposée</p>
                </div>
              </div>
            </div>
            <div className="bg-warm-white rounded-2xl p-4 shadow-sm border border-stone">
              <h3 className="font-semibold text-charcoal mb-3 text-sm">Moyens de paiement</h3>
              <div className="flex gap-2">
                {[Smartphone, CreditCard, Landmark].map((Icon, i) => (
                  <div key={i} className="w-9 h-9 rounded-xl bg-cream border border-stone flex items-center justify-center text-ash">
                    <Icon className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions History */}
          <div className="bg-warm-white rounded-2xl p-5 shadow-sm border border-stone">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-ash" />
              <h3 className="text-base font-semibold text-charcoal">Historique des Transactions</h3>
            </div>
            {!wallet?.transactions.length ? (
              <div className="text-center py-10 text-ash font-bold text-sm">Aucune transaction pour le moment</div>
            ) : (
              <div className="space-y-2">
                {wallet.transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-cream transition-colors border border-transparent hover:border-stone">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                        ["DEPOSIT","TRANSFER_IN","RECEIPT"].includes(tx.type) ? "bg-forest/10 text-forest" : "bg-error/10 text-red-600")}>
                        {["DEPOSIT","TRANSFER_IN","RECEIPT"].includes(tx.type) ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal text-sm">
                          {tx.type === "DEPOSIT" ? "Dépôt" : tx.type === "WITHDRAWAL" ? "Retrait" : tx.type === "TRANSFER_OUT" ? "Transfert envoyé" : tx.type === "TRANSFER_IN" ? "Transfert reçu" : tx.type}
                        </p>
                        <p className="text-xs text-graphite font-medium">{tx.description || tx.reference || "Transaction"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-black text-sm", ["DEPOSIT","TRANSFER_IN","RECEIPT"].includes(tx.type) ? "text-forest" : "text-gray-900")}>
                        {["DEPOSIT","TRANSFER_IN","RECEIPT"].includes(tx.type) ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")} {wallet.currency}
                      </p>
                      <p className="text-xs text-ash font-bold uppercase tracking-wider">
                        {new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Transaction Form Panel ─────────────────────────────── */}
        <div className="w-80 flex-shrink-0">
          {action ? (
            <div className="bg-warm-white rounded-2xl shadow-sm border border-stone sticky top-0">
              <div className="p-4 border-b border-stone flex justify-between items-center bg-gradient-to-r from-[#165E39]/5 to-transparent rounded-t-2xl">
                <div>
                  <p className="text-[10px] text-xs font-medium text-ash uppercase tracking-wider text-[#E38513] mb-0.5">
                    {action === "DEPOSIT" ? "Recharger" : action === "WITHDRAWAL" ? "Retrait" : "Transfert"}
                  </p>
                  <h3 className="font-semibold text-charcoal text-sm">
                    {action === "DEPOSIT" ? "Dépôt de fonds" : action === "WITHDRAWAL" ? "Retrait de fonds" : "Transfert de fonds"}
                  </h3>
                </div>
                <button onClick={() => { setAction(null); setRequiresOTP(false); setError(""); }} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <X className="w-4 h-4 text-graphite" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-error/10 text-red-600 rounded-xl flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}

                {requiresOTP ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-3 bg-warning/10 text-orange-800 rounded-xl border border-orange-100">
                      <p className="font-bold text-sm mb-1">🔒 Vérification 2FA</p>
                      <p className="text-xs">Code OTP requis pour cette transaction. (Simulation: 123456)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Code OTP à 6 chiffres</label>
                      <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)}
                        className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-black text-center tracking-widest text-xl focus:ring-2 focus:ring-[#165E39]/20 outline-none"
                        placeholder="------" maxLength={6} required />
                    </div>
                    <button type="submit" disabled={isSubmitting || otpCode.length !== 6}
                      className="w-full bg-[#165E39] hover:bg-[#0F3F26] text-white py-3 rounded-xl font-black transition-colors flex items-center justify-center disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmer"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Montant ({wallet?.currency})</label>
                      <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                        className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none"
                        placeholder="Ex: 10000" required min="100" />
                    </div>

                    {action === "TRANSFER" && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ID du Bénéficiaire</label>
                        <input type="text" value={receiverId} onChange={e => setReceiverId(e.target.value)}
                          className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none"
                          placeholder="ID utilisateur" required />
                      </div>
                    )}

                    {(action === "DEPOSIT" || action === "WITHDRAWAL") && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Moyen de paiement</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                          className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none">
                          <option value="MOBILE_MONEY">Mobile Money (Orange/MTN)</option>
                          <option value="BANK_CARD">Carte Bancaire</option>
                          <option value="BANK_TRANSFER">Virement Bancaire</option>
                          <option value="CASH">Espèces</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Description (optionnelle)</label>
                      <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                        className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none"
                        placeholder="Motif de la transaction" />
                    </div>

                    {parseFloat(amount) > 0 && (
                      <div className="p-3 bg-cream rounded-xl space-y-2 border border-stone">
                        <div className="flex justify-between text-xs text-graphite font-medium">
                          <span>Montant</span><span>{parseFloat(amount).toLocaleString("fr-FR")} FCFA</span>
                        </div>
                        <div className="flex justify-between text-xs text-graphite font-medium">
                          <span>Frais</span><span>{currentFee === 0 ? "Gratuit" : `${currentFee.toLocaleString("fr-FR")} FCFA`}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold text-charcoal text-sm">
                          <span>Total</span><span>{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                        </div>
                      </div>
                    )}

                    <button type="submit" disabled={isSubmitting || parseFloat(amount) <= 0}
                      className="w-full bg-[#165E39] hover:bg-[#0F3F26] text-white py-3 rounded-xl font-black transition-colors flex items-center justify-center disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Valider l'opération"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-warm-white rounded-2xl shadow-sm border border-stone flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
              <Wallet className="w-12 h-12 text-gray-200 mb-4" />
              <p className="font-bold text-ash text-sm leading-relaxed">
                Cliquez sur Dépôt, Retrait ou Transfert pour afficher le formulaire ici.
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}