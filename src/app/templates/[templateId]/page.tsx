"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, Users, LayoutGrid, ChevronDown, ChevronUp,
  Lightbulb, Target, BookOpen, AlertTriangle, ArrowRight
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  MANDATORY: { label: "Priorité 1 — Obligatoire", color: "text-red-400" },
  OPTIONAL: { label: "Priorité 3-4 — Optionnelle", color: "text-blue-400" },
};

export default function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/templates/${templateId}`)
      .then(res => res.json())
      .then(data => { setTemplate(data.template); setLoading(false); })
      .catch(() => setLoading(false));
  }, [templateId]);

  const renderStars = (rating: number, size = "w-4 h-4") =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
    ));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Modèle introuvable.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1f14] to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/templates" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft className="w-4 h-4" /> Bibliothèque
          </Link>
          <Link
            href={`/templates/${templateId}/use`}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-green-500/25"
          >
            Utiliser ce modèle <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-10">

        {/* Hero card */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10">
          <div className="h-3 w-full" style={{ backgroundColor: template.color }} />
          <div className="p-8 bg-white/5 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <span className="text-6xl">{template.iconEmoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${template.origin === "SYSTEM" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                    {template.origin === "SYSTEM" ? "Modèle Système" : "Communauté"}
                  </span>
                  <span className="text-xs text-gray-500 font-medium uppercase">{template.category}</span>
                </div>
                <h1 className="text-3xl font-extrabold mb-3">{template.name}</h1>
                <p className="text-gray-300 text-base leading-relaxed">{template.description}</p>
                {template.targetAudience && (
                  <p className="mt-3 text-sm text-gray-500"><span className="text-green-400 font-semibold">Public cible :</span> {template.targetAudience}</p>
                )}

                <div className="flex items-center gap-6 mt-5 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid className="w-4 h-4" />
                    <span>{template.activities.length} activité{template.activities.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{template.usageCount} utilisations</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(template.rating)}
                    <span className="ml-1 font-semibold text-white">{template.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div>
          <h2 className="text-xl font-bold mb-4">Activités incluses ({template.activities.length})</h2>
          <div className="space-y-3">
            {template.activities.map((act: any) => {
              const isExpanded = expandedActivity === act.id;
              return (
                <div key={act.id} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                  <button
                    onClick={() => setExpandedActivity(isExpanded ? null : act.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white/10 text-white">
                        {act.sortOrder}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{act.name}</div>
                        <div className={`text-xs mt-0.5 ${PRIORITY_MAP[act.participation]?.color ?? "text-gray-400"}`}>
                          {PRIORITY_MAP[act.participation]?.label ?? act.participation}
                          {act.contributionAmount && ` · ${act.contributionAmount.toLocaleString()} FCFA`}
                          {act.contributionFrequency && ` · ${act.contributionFrequency}`}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/10 p-5 grid md:grid-cols-2 gap-4">
                      {act.docObjective && (
                        <div className="flex gap-3">
                          <Target className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Objectif</div>
                            <p className="text-sm text-gray-300">{act.docObjective}</p>
                          </div>
                        </div>
                      )}
                      {act.docImportance && (
                        <div className="flex gap-3">
                          <BookOpen className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Pourquoi c'est important</div>
                            <p className="text-sm text-gray-300">{act.docImportance}</p>
                          </div>
                        </div>
                      )}
                      {act.docTips && (
                        <div className="flex gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Conseils de gestion</div>
                            <p className="text-sm text-gray-300">{act.docTips}</p>
                          </div>
                        </div>
                      )}
                      {act.docPitfalls && (
                        <div className="flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Pièges à éviter</div>
                            <p className="text-sm text-gray-300">{act.docPitfalls}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Règlement type */}
        {template.reglementHtml && (
          <div>
            <h2 className="text-xl font-bold mb-4">Règlement intérieur type</h2>
            <div
              className="prose prose-invert prose-sm max-w-none bg-white/5 border border-white/10 rounded-xl p-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(template.reglementHtml) }}
            />
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-8 border-t border-white/10">
          <Link
            href={`/templates/${templateId}/use`}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3.5 rounded-2xl text-base transition shadow-xl shadow-green-500/20"
          >
            Utiliser ce modèle <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-3">Vous pourrez modifier chaque paramètre avant de créer votre association.</p>
        </div>

      </div>
    </div>
  );
}
