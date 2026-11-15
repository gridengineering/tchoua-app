"use client";

import { useEffect, useState } from "react";
import { 
  Wallet, Search, ShieldAlert, CheckCircle, 
  Loader2, AlertTriangle, ArrowRightLeft, ShieldBan
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";

type AdminWallet = {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  _count: {
    transactions: number;
  };
};

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [pending, setPending] = useState<any>({ member: [], association: [] });

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/admin/wallets");
      if (res.ok) {
        const data = await res.json();
        setWallets(data.wallets);
        setTotalBalance(data.totalBalance);
        const pendingRes = await fetch("/api/admin/wallets/transactions");
        if (pendingRes.ok) setPending(await pendingRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleStatusChange = async (walletId: string, currentStatus: string) => {
    setIsUpdating(walletId);
    try {
      const action = currentStatus === "ACTIVE" ? "SUSPEND" : "ACTIVATE";
      const res = await fetch("/api/admin/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, action }),
      });

      if (res.ok) {
        await fetchWallets();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la modification du statut");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredWallets = wallets.filter(w => 
    w.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.user.phone && w.user.phone.includes(searchTerm))
  );

  const decideTransaction = async (id: string, walletType: "MEMBER" | "ASSOCIATION", decision: "APPROVE" | "REJECT") => {
    const res = await fetch("/api/admin/wallets/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: id, walletType, decision }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Action impossible"); return; }
    await fetchWallets();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#165E39]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Wallet className="w-7 h-7 text-[#165E39]" />
            Supervision des Wallets
          </h1>
          <p className="text-gray-500 font-medium">Contrôle et audit des portefeuilles électroniques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Masse Monétaire Totale</p>
            <p className="text-2xl font-black text-gray-900">{totalBalance.toLocaleString("fr-FR")} FCFA</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowRightLeft className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Portefeuilles Actifs</p>
            <p className="text-2xl font-black text-gray-900">{wallets.filter(w => w.status === "ACTIVE").length}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Comptes Suspendus</p>
            <p className="text-2xl font-black text-gray-900">{wallets.filter(w => w.status === "SUSPENDED").length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-black text-lg text-gray-900">Liste des Comptes</h2>
          <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2 w-full sm:w-64 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Rechercher un membre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Membre</th>
                <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Solde</th>
                <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#165E39]/10 text-[#165E39] font-black flex items-center justify-center">
                        {getInitials(wallet.user.name)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{wallet.user.name}</p>
                        <p className="text-xs text-gray-500">{wallet.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-black text-[#165E39]">
                    {wallet.balance.toLocaleString("fr-FR")} {wallet.currency}
                  </td>
                  <td className="p-4 text-gray-600 font-bold">
                    {wallet._count.transactions}
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 w-max",
                      wallet.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {wallet.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <ShieldBan className="w-3 h-3" />}
                      {wallet.status === "ACTIVE" ? "Actif" : "Suspendu"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleStatusChange(wallet.id, wallet.status)}
                      disabled={isUpdating === wallet.id}
                      className={cn(
                        "p-2 rounded-xl transition-colors inline-flex items-center justify-center",
                        wallet.status === "ACTIVE" 
                          ? "text-red-600 hover:bg-red-50" 
                          : "text-emerald-600 hover:bg-emerald-50",
                        isUpdating === wallet.id && "opacity-50 cursor-not-allowed"
                      )}
                      title={wallet.status === "ACTIVE" ? "Suspendre ce compte" : "Réactiver ce compte"}
                    >
                      {isUpdating === wallet.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : wallet.status === "ACTIVE" ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredWallets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                    Aucun portefeuille trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-black text-gray-900">Opérations en attente de confirmation</h2>
        {pending.member.length + pending.association.length === 0 ? (
          <p className="text-sm font-semibold text-gray-400">Aucune opération en attente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="p-3">Propriétaire</th><th className="p-3">Type</th><th className="p-3">Montant</th><th className="p-3">Prestataire</th><th className="p-3 text-right">Décision</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {[...pending.member.map((tx: any) => ({ ...tx, walletType: "MEMBER", owner: tx.wallet?.user?.name ?? "Membre" })),
                  ...pending.association.map((tx: any) => ({ ...tx, walletType: "ASSOCIATION", owner: tx.wallet?.association?.name ?? "Association" }))].map((tx: any) => (
                  <tr key={`${tx.walletType}-${tx.id}`}>
                    <td className="p-3 font-bold">{tx.owner}</td>
                    <td className="p-3">{tx.type}</td>
                    <td className="p-3 font-black">{tx.amount.toLocaleString("fr-FR")}</td>
                    <td className="p-3">{tx.provider ?? "—"}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => decideTransaction(tx.id, tx.walletType, "APPROVE")} className="mr-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Confirmer</button>
                      <button onClick={() => decideTransaction(tx.id, tx.walletType, "REJECT")} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Refuser</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}