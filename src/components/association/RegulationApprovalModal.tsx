"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Check, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";

type Article = {
  id: string;
  articleNumber: number;
  title: string | null;
  content: string;
};

type RegulationApprovalModalProps = {
  associationId: string;
  associationName: string;
  onAllApproved: () => void;
};

export function RegulationApprovalModal({ associationId, associationName, onAllApproved }: RegulationApprovalModalProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [approvals, setApprovals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/associations/${associationId}/regulations`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setApprovals(data.approvals || []);
        if (data.allApproved && data.membershipStatus === "ACTIVE") {
          onAllApproved();
        }
      }
    } finally {
      setLoading(false);
    }
  }, [associationId, onAllApproved]);

  useEffect(() => { load(); }, [load]);

  const approveArticle = async (articleId: string) => {
    if (approvals.includes(articleId) || approving) return;
    setApproving(articleId);
    try {
      const res = await fetch(`/api/associations/${associationId}/regulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId })
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals(prev => [...prev, articleId]);
        if (data.activatedNow) {
          setJustActivated(true);
          setTimeout(() => onAllApproved(), 2500);
        }
      }
    } finally {
      setApproving(null);
    }
  };

  const approvedCount = approvals.length;
  const total = articles.length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-warm-white rounded-3xl p-8 flex items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#165E39]" />
          <span className="font-bold text-gray-700">Chargement du règlement...</span>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    onAllApproved();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-warm-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-stone bg-gradient-to-r from-[#165E39] to-[#0F3F26] rounded-t-3xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider">Validation Requise</div>
              <h2 className="text-lg font-black text-white">{associationName}</h2>
            </div>
          </div>
          <p className="text-sm text-white/80 font-medium">
            Vous devez approuver chaque article du règlement intérieur pour accéder à l'association.
          </p>
          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>{approvedCount} / {total} articles approuvés</span>
              <span>{Math.round((approvedCount / total) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E38513] rounded-full transition-all duration-500"
                style={{ width: `${(approvedCount / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {justActivated ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-forest" />
              </div>
              <h3 className="text-xl font-semibold text-charcoal">Bienvenue !</h3>
              <p className="text-graphite font-medium">
                Vous avez approuvé tous les articles. Votre adhésion est maintenant <strong className="text-forest">Active</strong> !
              </p>
            </div>
          ) : (
            articles.map((article) => {
              const isApproved = approvals.includes(article.id);
              const isApproving = approving === article.id;
              return (
                <div
                  key={article.id}
                  className={`p-4 rounded-2xl border transition-all ${isApproved ? "bg-forest/10 border-emerald-200" : "bg-cream border-gray-200"}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${isApproved ? "bg-forest text-white" : "bg-gray-300 text-gray-600"}`}>
                          {isApproved ? <Check className="w-3.5 h-3.5" /> : article.articleNumber}
                        </div>
                        <h4 className={`font-bold text-sm ${isApproved ? "text-forest" : "text-gray-800"}`}>
                          {article.title || `Article ${article.articleNumber}`}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed pl-8">{article.content}</p>
                    </div>
                    <button
                      onClick={() => approveArticle(article.id)}
                      disabled={isApproved || !!approving}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isApproved
                        ? "bg-forest/10 text-forest cursor-default"
                        : "bg-[#165E39] text-white hover:bg-[#0F3F26] disabled:opacity-50"
                        }`}
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : isApproved ? "✓ Lu et approuvé" : "J'approuve"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer warning */}
        {!justActivated && approvedCount < total && (
          <div className="p-4 border-t border-stone bg-gold/10 rounded-b-3xl">
            <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              Vous ne pouvez pas accéder à l'espace de l'association tant que tous les articles ne sont pas approuvés.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
