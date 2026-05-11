"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Gavel, Check, AlertTriangle, Users } from "lucide-react";

type Member = { id: string; name: string };
type Bid = { membershipId: string; amount: number; memberName: string };

type AuctionManagerProps = {
  sessionId: string;
  activityId: string;
  associationId: string;
  potAmount: number;
  minBidPct: number;
  members: Member[];
  onAuctionComplete: (result: any) => void;
};

export function AuctionManager({ sessionId, activityId, associationId, potAmount, minBidPct, members, onAuctionComplete }: AuctionManagerProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minBid = (potAmount * minBidPct) / 100;
  const currentHighestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : 0;
  const nextMinBid = Math.max(minBid, currentHighestBid + 500); // 500 FCFA min increment

  const handleAddBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !bidAmount) return;
    
    const amount = Number(bidAmount);
    if (amount < nextMinBid) {
      setError(`La mise doit être d'au moins ${formatCurrency(nextMinBid)}`);
      return;
    }

    const member = members.find(m => m.id === selectedMember);
    if (!member) return;

    setBids(prev => [{ membershipId: selectedMember, amount, memberName: member.name }, ...prev]);
    setBidAmount("");
    setSelectedMember("");
    setError(null);
  };

  const handleCloseAuction = async () => {
    if (bids.length === 0) {
      setError("Aucune enchère n'a été placée.");
      return;
    }

    setLoading(true);
    
    // Sort bids highest to lowest
    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
    const winner = sortedBids[0];
    const runnerUp = sortedBids.length > 1 ? sortedBids[1] : null;

    const netAmountForWinner = potAmount - winner.amount;

    const auctionResult = {
      winnerId: winner.membershipId,
      winnerName: winner.memberName,
      winningBid: winner.amount,
      runnerUpId: runnerUp?.membershipId,
      runnerUpName: runnerUp?.memberName,
      runnerUpBid: runnerUp?.amount,
      netAmount: netAmountForWinner,
      allBids: sortedBids,
    };

    try {
      // In a real scenario, this would call an API endpoint to save the result
      // Example: POST /api/associations/[id]/activities/[actId]/sessions/[sessionId]/auction
      
      // For this implementation, we will simulate the API call and pass it back to the parent
      setTimeout(() => {
        onAuctionComplete(auctionResult);
        setLoading(false);
      }, 500);
      
    } catch (err) {
      setError("Erreur lors de la clôture des enchères.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-warm-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-gold" />
            Séance d'Enchères
          </h3>
          <p className="text-sm text-graphite">Cagnotte totale : <strong className="text-gray-900">{formatCurrency(potAmount)}</strong></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-graphite uppercase font-semibold">Mise à prix ({minBidPct}%)</p>
          <p className="text-lg font-bold text-gold">{formatCurrency(minBid)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulaire de mise */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700">Enregistrer une offre</h4>
          
          <form onSubmit={handleAddBid} className="space-y-3 p-4 bg-cream rounded-lg border border-stone">
            <div>
              <label className="block text-xs font-semibold text-graphite mb-1">Membre enchérisseur</label>
              <select 
                className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">Sélectionner un membre...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-graphite mb-1">Montant proposé (Minimum: {formatCurrency(nextMinBid)})</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm font-bold"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={nextMinBid}
                step={500}
                placeholder="ex: 15000"
              />
            </div>
            
            {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {error}</p>}
            
            <button 
              type="submit" 
              className="w-full py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Placer l'offre
            </button>
          </form>
        </div>

        {/* Historique des mises */}
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center justify-between">
            Offres en cours
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{bids.length} offre(s)</span>
          </h4>
          
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {bids.length === 0 ? (
              <div className="p-4 text-center text-ash border border-dashed rounded-lg text-sm">
                En attente de la première enchère...
              </div>
            ) : (
              bids.map((bid, i) => (
                <div key={i} className={`p-3 rounded-lg border flex items-center justify-between ${i === 0 ? 'bg-gold/10 border-amber-200' : 'bg-warm-white border-stone'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-graphite'}`}>
                      {i + 1}
                    </div>
                    <span className={`text-sm ${i === 0 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{bid.memberName}</span>
                  </div>
                  <span className={`font-mono text-sm ${i === 0 ? 'font-bold text-amber-700' : 'text-graphite'}`}>
                    {formatCurrency(bid.amount)}
                  </span>
                </div>
              ))
            )}
          </div>

          {bids.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button 
                onClick={handleCloseAuction}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : <><Check className="w-4 h-4"/> Adjugé vendu</>}
              </button>
              <p className="text-xs text-center text-graphite mt-2">
                Le gagnant recevra {formatCurrency(potAmount - bids[0].amount)} nets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
