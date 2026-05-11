"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Shuffle, CalendarDays, CheckCircle, Users } from "lucide-react";

type Member = { id: string; name: string };
type DrawResult = { 
  beneficiaries: { membershipId: string; name: string; partsCount: number; amount: number }[];
  method: "RANDOM" | "CALENDAR";
};

type DrawManagerProps = {
  sessionId: string;
  activityId: string;
  associationId: string;
  potAmount: number;
  members: Member[]; // Membres éligibles au tirage
  distributionMode: string;
  onDrawComplete: (result: DrawResult) => void;
};

export function DrawManager({ sessionId, activityId, associationId, potAmount, members, distributionMode, onDrawComplete }: DrawManagerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);

  const handleRandomDraw = () => {
    if (members.length === 0) return;
    setLoading(true);
    
    // Simuler un tirage au sort (animation)
    setTimeout(() => {
      // Choix aléatoire d'un gagnant (pour simplifier, un seul gagnant prend toute la cagnotte)
      // Dans la réalité, cela dépendrait du nombre de parts
      const winnerIndex = Math.floor(Math.random() * members.length);
      const winner = members[winnerIndex];
      
      const drawRes: DrawResult = {
        method: "RANDOM",
        beneficiaries: [
          { membershipId: winner.id, name: winner.name, partsCount: 1, amount: potAmount }
        ]
      };
      
      setResult(drawRes);
      setLoading(false);
    }, 1500);
  };

  const handleConfirmDraw = () => {
    if (result) {
      onDrawComplete(result);
    }
  };

  return (
    <div className="bg-warm-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-info" />
            Tirage au sort
          </h3>
          <p className="text-sm text-graphite">Cagnotte à distribuer : <strong className="text-gray-900">{formatCurrency(potAmount)}</strong></p>
        </div>
        <div className="bg-info/10 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {members.length} membres éligibles
        </div>
      </div>

      {!result ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-6">
            <div className={`w-20 h-20 bg-info/10 rounded-full flex items-center justify-center ${loading ? 'animate-spin' : ''}`}>
              <Shuffle className="w-10 h-10 text-info" />
            </div>
            {loading && <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />}
          </div>
          
          {loading ? (
            <p className="text-gray-600 font-medium">Tirage en cours...</p>
          ) : (
            <>
              <p className="text-gray-600 text-center max-w-sm mb-6 text-sm">
                Le système va sélectionner aléatoirement un bénéficiaire parmi les membres n'ayant pas encore "mangé" la tontine.
              </p>
              <button 
                onClick={handleRandomDraw}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Lancer le tirage
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <h4 className="text-sm text-green-800 font-semibold mb-1">Bénéficiaire désigné !</h4>
            {result.beneficiaries.map((b, i) => (
              <div key={i} className="mt-4">
                <div className="text-2xl font-bold text-gray-900">{b.name}</div>
                <div className="text-sm text-graphite mt-1">Montant alloué : <span className="font-bold text-[#0d3d28]">{formatCurrency(b.amount)}</span></div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setResult(null)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-cream transition-colors"
            >
              Recommencer
            </button>
            <button 
              onClick={handleConfirmDraw}
              className="flex-1 py-2.5 bg-forest text-white font-semibold rounded-lg hover:bg-[#0a2f1f] transition-colors"
            >
              Valider le résultat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
