"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, Coins, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type Member = {
  id: string;
  name: string;
  role: string;
};

type AllocationResult = {
  success: boolean;
  allocations: {
    type: "ACTIVITY" | "LOAN" | "EXCESS";
    id: string;
    name: string;
    amountAllocated: number;
    amountExpected: number;
    priority: number;
    status: "SUCCESS" | "FAILED" | "PARTIAL" | "SKIPPED";
  }[];
  remainingBalance: number;
  error?: string;
};

export default function CaissePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/associations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.association?.memberships) {
          const formatted = d.association.memberships.map((m: any) => ({
            id: m.id,
            name: m.user.name,
            role: m.role
          }));
          setMembers(formatted);
        }
      });
  }, [id]);

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !amount || Number(amount) <= 0) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch(`/api/associations/${id}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: selectedMemberId,
          amount: Number(amount),
          paymentMethod
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 422 && data.allocations) {
          // Echec métier mais on a la simulation
          setResult(data);
          setError(data.error);
        } else {
          setError(data.error || "Une erreur est survenue");
        }
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setResult(null);
    setError(null);
  };

  return (
    <DashboardLayout title="Caisse & Répartition">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/associations/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#0d3d28]"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Formulaire d'encaissement */}
          <div className="md:col-span-1 bg-warm-white p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-[#0d3d28]" />
              Nouvel Encaissement
            </h3>
            
            <form onSubmit={handleDistribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-graphite uppercase mb-1">Membre</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] focus:outline-none"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un membre...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite uppercase mb-1">Montant global versé (FCFA)</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] focus:outline-none font-bold text-lg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ex: 25000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite uppercase mb-1">Mode de paiement</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] focus:outline-none"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Espèces (Cash)</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Virement Bancaire</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading || !selectedMemberId || !amount}
                className="w-full flex items-center justify-center gap-2 bg-forest text-white py-2.5 rounded-lg font-semibold hover:bg-[#0a2f1f] disabled:opacity-50 transition-colors"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Répartir les fonds"}
              </button>
            </form>
          </div>

          {/* Résultat de l'algorithme */}
          <div className="md:col-span-2 space-y-4">
            
            {error && !result && (
              <div className="p-4 bg-error/10 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Erreur lors de la répartition</h4>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className={`p-5 rounded-xl border ${result.success ? 'bg-green-50 border-green-200' : 'bg-error/10 border-red-200'}`}>
                <div className="flex items-start gap-3 mb-4">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-bold text-lg ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success ? 'Répartition réussie' : 'Échec de la répartition'}
                    </h3>
                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.success 
                        ? "L'algorithme a distribué les fonds avec succès selon les règles de priorité."
                        : error || "Le montant versé est insuffisant pour couvrir les obligations de Priorité 1."}
                    </p>
                  </div>
                </div>

                <div className="bg-warm-white rounded-lg border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-cream text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2">Priorité</th>
                        <th className="px-4 py-2">Activité / Obligation</th>
                        <th className="px-4 py-2 text-right">Attendu</th>
                        <th className="px-4 py-2 text-right">Alloué</th>
                        <th className="px-4 py-2 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.allocations.map((alloc, i) => (
                        <tr key={i} className={alloc.status === 'FAILED' ? 'bg-error/10' : alloc.status === 'SKIPPED' ? 'text-ash' : ''}>
                          <td className="px-4 py-3 font-semibold">
                            {alloc.priority < 5 ? `Priorité ${alloc.priority}` : "-"}
                          </td>
                          <td className="px-4 py-3 font-medium">{alloc.name}</td>
                          <td className="px-4 py-3 text-right">
                            {alloc.amountExpected === Infinity ? "Illimité" : `${alloc.amountExpected.toLocaleString()} F`}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {alloc.amountAllocated.toLocaleString()} F
                          </td>
                          <td className="px-4 py-3 text-center">
                            {alloc.status === 'SUCCESS' && <span className="text-green-600 font-semibold">✔ Payé</span>}
                            {alloc.status === 'FAILED' && <span className="text-red-600 font-semibold">✖ Échec</span>}
                            {alloc.status === 'SKIPPED' && <span className="text-graphite text-xs">Ignoré</span>}
                            {alloc.status === 'PARTIAL' && <span className="text-gold font-semibold">Partiel</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {result.success && (
                      <tfoot className="bg-cream font-bold border-t">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right">Montant restant (Non alloué) :</td>
                          <td className="px-4 py-3 text-right text-[#0d3d28]">{result.remainingBalance.toLocaleString()} F</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={resetForm}
                    className="px-4 py-2 bg-warm-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-cream"
                  >
                    Nouveau versement
                  </button>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center flex flex-col items-center justify-center text-ash h-full">
                <Coins className="w-12 h-12 mb-3 text-ash/60" />
                <p>Sélectionnez un membre et saisissez un montant global.</p>
                <p className="text-sm mt-2 max-w-sm">
                  Le moteur de répartition va automatiquement cascader le paiement sur les Tontines (Prio 1), Remboursements de Prêts (Prio 1), Solidarité (Prio 2) et Épargne (Prio 4).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
