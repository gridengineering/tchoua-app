"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coins, CheckCircle, AlertTriangle, Users, FileText, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type KPI = {
  totalCollected: number;
  totalMembers: number;
  membersPaid: number;
  membersNotPaid: number;
  membersInFailure: number;
};

export default function MeetingCaissePage() {
  const { id, meetingId } = useParams<{ id: string; meetingId: string }>();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [kpis, setKpis] = useState<KPI | null>(null);
  
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetingData = () => {
    fetch(`/api/associations/${id}/meetings/${meetingId}/caisse`)
      .then(r => r.json())
      .then(d => {
        if (d.meeting) {
          setMeeting(d.meeting);
          setKpis(d.kpis);
        }
      });
  };

  useEffect(() => {
    fetchMeetingData();
  }, [id, meetingId]);

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
          paymentMethod,
          meetingId
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 422 && data.allocations) {
          setResult(data);
          setError(data.error);
        } else {
          setError(data.error || "Une erreur est survenue");
        }
      } else {
        setResult(data);
      }
      
      // Rafraichir les KPIs
      fetchMeetingData();
      
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  if (!meeting) return <DashboardLayout title="Chargement..."><div /></DashboardLayout>;

  return (
    <DashboardLayout title={`Caisse de la Réunion : ${meeting.title || "Session"}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/associations/${id}/meetings`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#0d3d28]"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux réunions
          </Link>
          
          <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black">
            <FileText className="w-4 h-4" />
            Rapport PDF de fin de session
          </button>
        </div>

        {/* KPIs Dashboard */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-forest text-white">
              <CardContent className="p-4">
                <div className="text-sm text-green-100/70 uppercase font-semibold mb-1">Total Collecté</div>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalCollected)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-graphite uppercase font-semibold mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" /> Membres à jour
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpis.membersPaid} <span className="text-sm font-normal text-graphite">/ {kpis.totalMembers}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-graphite uppercase font-semibold mb-1">
                  <Users className="w-4 h-4 text-info" /> En attente
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpis.membersNotPaid}</div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-error/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-red-600 uppercase font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4" /> En échec / Sanctions
                </div>
                <div className="text-2xl font-bold text-red-700">{kpis.membersInFailure}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulaire d'encaissement */}
          <div className="lg:col-span-1 bg-warm-white p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-[#0d3d28]" />
              Saisie Versement Global
            </h3>
            
            <form onSubmit={handleDistribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-graphite uppercase mb-1">Membre présent</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] focus:outline-none text-sm"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                >
                  <option value="">Sélectionner...</option>
                  {meeting.attendances.map((a: any) => (
                    <option key={a.membershipId} value={a.membershipId}>
                      {a.membership.user.name} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite uppercase mb-1">Montant versé (FCFA)</label>
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
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] focus:outline-none text-sm"
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
                {loading ? "Répartition..." : "Répartir les fonds"}
              </button>
            </form>
          </div>

          {/* Résultat / Rapport de l'algorithme */}
          <div className="lg:col-span-2">
            {!result && !error ? (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center flex flex-col items-center justify-center text-ash h-full bg-cream/50">
                <Coins className="w-12 h-12 mb-3 text-ash/60" />
                <p>Sélectionnez un membre pour traiter son versement.</p>
                <p className="text-sm mt-2 max-w-md">
                  Le système vérifiera d'abord ses dettes, puis honorera la Tontine (Priorité 1), la Solidarité (Priorité 2), etc. Si le montant est insuffisant pour les priorités 1 ou 2, des sanctions seront générées automatiquement.
                </p>
              </div>
            ) : (
              <div className={`p-5 rounded-xl border ${result?.success ? 'bg-green-50 border-green-200' : 'bg-error/10 border-red-200'}`}>
                {/* Contenu du résultat, similaire à la page de caisse précédente */}
                <div className="flex items-start gap-3 mb-4">
                  {result?.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-bold text-lg ${result?.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result?.success ? 'Répartition traitée' : 'Échec et Sanctions générées'}
                    </h3>
                    <p className={`text-sm ${result?.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result?.success 
                        ? "L'algorithme a distribué les fonds avec succès."
                        : "Le montant versé est insuffisant pour couvrir les obligations obligatoires."}
                    </p>
                  </div>
                </div>

                <div className="bg-warm-white rounded-lg border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-cream text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2">Priorité</th>
                        <th className="px-4 py-2">Obligation</th>
                        <th className="px-4 py-2 text-right">Attendu</th>
                        <th className="px-4 py-2 text-right">Alloué</th>
                        <th className="px-4 py-2 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result?.allocations?.map((alloc: any, i: number) => (
                        <tr key={i} className={alloc.status === 'FAILED' ? 'bg-error/10 text-red-900' : ''}>
                          <td className="px-4 py-2 font-semibold">
                            {alloc.priority < 5 ? `Priorité ${alloc.priority}` : "-"}
                          </td>
                          <td className="px-4 py-2 font-medium">{alloc.name}</td>
                          <td className="px-4 py-2 text-right">
                            {alloc.amountExpected === Infinity ? "Illimité" : `${alloc.amountExpected.toLocaleString()} F`}
                          </td>
                          <td className="px-4 py-2 text-right font-bold">
                            {alloc.amountAllocated.toLocaleString()} F
                          </td>
                          <td className="px-4 py-2 text-center">
                            {alloc.status === 'SUCCESS' && <span className="text-green-600 font-semibold">✔ Payé</span>}
                            {alloc.status === 'FAILED' && <span className="text-red-600 font-semibold">✖ Sanctionné</span>}
                            {alloc.status === 'SKIPPED' && <span className="text-ash">Ignoré</span>}
                            {alloc.status === 'PARTIAL' && <span className="text-gold font-semibold">Partiel</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-cream font-bold border-t">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">Excédent ajouté au solde membre :</td>
                        <td className="px-4 py-3 text-right text-[#0d3d28]">{result?.remainingBalance?.toLocaleString()} F</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => { setResult(null); setError(null); setAmount(""); }}
                    className="px-4 py-2 bg-warm-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-cream"
                  >
                    Traiter un autre membre
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
