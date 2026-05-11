"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useSession } from "next-auth/react";
import { 
  Trophy, Star, Award, Crown, Gem, TrendingUp, 
  Target, Zap, Shield, HeartHandshake, Sprout
} from "lucide-react";
import { motion } from "framer-motion";

const levels = [
  { name: 'Novice', icon: Star, xp: '0-99', color: '#B87333', privileges: ['Accès basique'] },
  { name: 'Actif', icon: Award, xp: '100-299', color: '#A8A8A8', privileges: ['Prêts ≤ 50k FCFA'] },
  { name: 'Engagé', icon: Gem, xp: '300-599', color: '#D4A843', privileges: ['Prêts ≤ 200k FCFA'] },
  { name: 'Leader', icon: Crown, xp: '600-999', color: '#0D7377', privileges: ['Prêts ≤ 500k FCFA'] },
  { name: 'Légende', icon: Crown, xp: '1000+', color: '#3D2B5C', privileges: ['Prêts illimités'] },
];

const dimensions = [
  { icon: Zap, title: 'Fiabilité Financière', score: 280, max: 400, color: 'bg-forest' },
  { icon: HeartHandshake, title: 'Solidarité', score: 210, max: 300, color: 'bg-info' },
  { icon: Sprout, title: 'Nature & Services', score: 140, max: 200, color: 'bg-warning' },
  { icon: Shield, title: 'Conformité Éthique', score: 92, max: 100, color: 'bg-gold' },
];

export default function MemberGamificationPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const currentXP = user?.score || 722;
  const currentLevel = levels.find(l => {
    const [min, max] = l.xp.split('-').map(n => parseInt(n));
    if (l.xp.includes('+')) return currentXP >= 1000;
    return currentXP >= min && currentXP <= max;
  }) || levels[0];

  return (
    <DashboardLayout title="Ma Réputation & Gamification">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Profile Card / Hero */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-5xl">
                {currentLevel.icon && <currentLevel.icon className="w-16 h-16 text-gold" />}
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-gold text-charcoal flex items-center justify-center font-black shadow-lg">
                {currentXP}
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/20 mb-4">
                <Trophy className="w-3 h-3 text-gold" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-gold">Statut : {currentLevel.name}</span>
              </div>
              <h1 className="text-4xl font-black mb-2">{session?.user?.name || "Membre Tchoua"}</h1>
              <p className="text-emerald-100/60 font-medium max-w-md">
                Votre score de réputation est calculé sur 4 dimensions clés. 
                Plus votre score est élevé, plus vous débloquez de privilèges au sein de la communauté.
              </p>
            </div>
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dimensions.map((dim, i) => (
            <div key={dim.title} className="bg-warm-white rounded-3xl p-8 border border-stone shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${dim.color} text-white flex items-center justify-center shadow-lg`}>
                    <dim.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal">{dim.title}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-charcoal">{dim.score} <span className="text-ash/60 text-sm font-bold">/ {dim.max}</span></div>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(dim.score / dim.max) * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`h-full ${dim.color}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Levels Timeline */}
        <div className="bg-warm-white rounded-2xl p-10 border border-stone shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-10">
             <h2 className="text-2xl font-semibold text-charcoal">Progression des Niveaux</h2>
             <Target className="w-6 h-6 text-gray-200" />
          </div>
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {levels.map((lvl, i) => {
                const isPassed = currentXP >= parseInt(lvl.xp.split('-')[0]) || (lvl.xp.includes('+') && currentXP >= 1000);
                const isActive = currentLevel.name === lvl.name;
                
                return (
                  <div key={lvl.name} className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border-4 transition-all ${
                      isActive ? 'bg-gold text-white border-gold shadow-xl scale-110' : 
                      isPassed ? 'bg-forest text-white border-emerald-500' : 'bg-warm-white text-gray-200 border-stone'
                    }`}>
                      <lvl.icon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-black ${isActive ? 'text-gray-900' : isPassed ? 'text-forest' : 'text-ash'}`}>{lvl.name}</div>
                      <div className="text-[10px] font-bold text-ash mt-1">{lvl.xp} XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Privileges */}
        <div className="bg-[#f7f3eb] rounded-2xl p-10 border border-[#e2ddd4]">
           <h2 className="text-2xl font-semibold text-charcoal mb-8 flex items-center gap-3">
             <Zap className="w-6 h-6 text-gold" /> Vos Privilèges Actuels
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentLevel.privileges.map((p, i) => (
                <div key={i} className="flex items-center gap-4 bg-warm-white p-5 rounded-2xl shadow-sm">
                   <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 fill-current" />
                   </div>
                   <span className="font-bold text-gray-700">{p}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 bg-white/50 border border-dashed border-gray-300 p-5 rounded-2xl opacity-60">
                 <div className="w-10 h-10 rounded-xl bg-gray-100 text-ash flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5" />
                 </div>
                 <span className="font-bold text-ash">Prochain : Prêts prioritaires</span>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
