"use client";

import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLevelInfo, getInitials } from "@/lib/utils";
import { Trophy, Star, Shield, Leaf } from "lucide-react";

const levels = [
  { key: "NOVICE", icon: "🌱", label: "Novice", min: 0, max: 99, color: "bg-gold" },
  { key: "ACTIF", icon: "🌿", label: "Actif", min: 100, max: 299, color: "bg-gray-400" },
  { key: "ENGAGE", icon: "🌳", label: "Engagé", min: 300, max: 599, color: "bg-gold" },
  { key: "LEADER", icon: "🦁", label: "Leader", min: 600, max: 999, color: "bg-cyan-500" },
  { key: "LEGENDE", icon: "👑", label: "Légende", min: 1000, max: 9999, color: "bg-yellow-400" },
];

const badges = [
  { icon: "⏰", name: "Ponctuel", desc: "12 cotisations à l'heure consécutives", category: "Financier", earned: false },
  { icon: "💰", name: "Épargnant", desc: "Épargne >20% des cotisations", category: "Financier", earned: false },
  { icon: "✅", name: "Crédible", desc: "5 prêts remboursés sans incident", category: "Financier", earned: false },
  { icon: "🌾", name: "Semence d'Or", desc: "10 contributions qualité A", category: "Nature", earned: false },
  { icon: "❤️", name: "Cœur d'Or", desc: "Contribution à 10 aides sociales", category: "Solidarité", earned: false },
  { icon: "🤝", name: "Bâtisseur", desc: "3 projets collectifs réalisés", category: "Solidarité", earned: false },
  { icon: "🎓", name: "Mains d'Or", desc: "20 services notés ≥4.5/5", category: "Compétences", earned: false },
  { icon: "💡", name: "Innovateur", desc: "Idée mise en œuvre dans le groupe", category: "Leadership", earned: false },
];

export default function ProfilPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const score = user?.score || 0;
  const level = user?.level || "NOVICE";
  const levelInfo = getLevelInfo(level);
  const currentLevel = levels.find(l => l.key === level) || levels[0];
  const nextLevel = levels.find(l => l.min > score);
  const progressToNext = nextLevel
    ? Math.min(100, ((score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  return (
    <DashboardLayout title="Scoring & Profil">
      <div className="space-y-6">
        {/* Profile Hero */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {user?.name ? getInitials(user.name) : "?"}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.name || "Membre"}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl">{levelInfo.icon}</span>
                <span className="text-violet-200">Niveau {levelInfo.label}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{score}</div>
              <div className="text-violet-200 text-sm">points</div>
            </div>
          </div>

          {/* Progress to next level */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-violet-200 mb-1">
              <span>{currentLevel.label} ({currentLevel.min} pts)</span>
              {nextLevel && <span>{nextLevel.label} ({nextLevel.min} pts)</span>}
              {!nextLevel && <span>Niveau maximum !</span>}
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div className="bg-warm-white h-3 rounded-full transition-all" style={{ width: `${progressToNext}%` }} />
            </div>
            {nextLevel && (
              <p className="text-xs text-violet-200 mt-1">
                Il vous manque {nextLevel.min - score} points pour atteindre le niveau {nextLevel.label}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scoring Categories */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-gold" /> Catégories de score</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Fiabilité Financière", pct: 40, icon: "💰", desc: "Cotisations, remboursements, ponctualité" },
                  { label: "Solidarité & Engagement", pct: 30, icon: "❤️", desc: "Aides, participations, parrainages" },
                  { label: "Contributions Nature/Services", pct: 20, icon: "🌾", desc: "Qualité produits, heures de service" },
                  { label: "Conformité & Éthique", pct: 10, icon: "🛡️", desc: "Respect règles, transparence" },
                ].map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{c.icon} {c.label}</span>
                      <span className="text-xs text-graphite font-medium">{c.pct}%</span>
                    </div>
                    <p className="text-xs text-ash mb-1">{c.desc}</p>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-violet-600 h-2 rounded-full" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Level Tiers */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" /> Niveaux & Privilèges</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {levels.map((l) => {
                  const isCurrentLevel = l.key === level;
                  const isPassed = score >= l.min;
                  return (
                    <div key={l.key} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrentLevel ? "bg-violet-50 border-2 border-violet-300" :
                      isPassed ? "bg-cream opacity-60" : "opacity-40"
                    }`}>
                      <span className="text-2xl">{l.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{l.label}</span>
                          {isCurrentLevel && (
                            <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full">Votre niveau</span>
                          )}
                        </div>
                        <span className="text-xs text-graphite">{l.min} – {l.max === 9999 ? "∞" : l.max} pts</span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${isPassed ? l.color : "bg-gray-200"}`} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-600" /> Badges à débloquer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {badges.map((b, i) => (
                <div key={i} className={`p-4 rounded-xl text-center border-2 transition-all ${
                  b.earned ? "border-violet-300 bg-violet-50" : "border-gray-200 opacity-50"
                }`}>
                  <div className="text-3xl mb-2">{b.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{b.name}</div>
                  <div className="text-xs text-graphite mt-1">{b.desc}</div>
                  <div className="text-xs mt-2 text-violet-600 font-medium">{b.category}</div>
                  {b.earned && <div className="text-xs text-green-600 font-medium mt-1">✓ Obtenu</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How to earn points */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Leaf className="w-5 h-5 text-green-600" /> Comment gagner des points</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { action: "Cotisation payée à l'heure", pts: "+10 pts" },
                { action: "Cotisation payée en avance", pts: "+15 pts" },
                { action: "Remboursement de prêt anticipé", pts: "+20 pts" },
                { action: "Parrainage d'un nouveau membre", pts: "+25 pts" },
                { action: "Participation à une aide solidaire", pts: "+5 pts" },
                { action: "Animation d'une activité culturelle", pts: "+20 pts" },
                { action: "Contribution qualité A en nature", pts: "+15 pts" },
                { action: "Formation dispensée à des membres", pts: "+25 pts" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-cream rounded-lg">
                  <span className="text-sm text-gray-700">{r.action}</span>
                  <span className="text-sm font-bold text-green-600">{r.pts}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
