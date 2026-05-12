"use client";

import { motion } from "framer-motion";
import { 
  Trophy, Medal, Star, Target, Zap, Shield, 
  Users, TrendingUp, Heart, Award, CheckCircle2,
  Lock, Flame, Crown, Gem, Globe, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";

const badges = [
  {
    name: "Membre Fondateur",
    icon: Shield,
    color: "amber",
    description: "Accordé aux premiers membres ayant lancé l'association.",
    requirement: "Inscrit depuis le premier mois"
  },
  {
    name: "Cotiseur Exemplaire",
    icon: CheckCircle2,
    color: "emerald",
    description: "Zéro retard sur les 12 dernières cotisations.",
    requirement: "Régularité parfaite 12 mois"
  },
  {
    name: "Pilier de Solidarité",
    icon: Heart,
    color: "rose",
    description: "Participation active aux fonds de secours et aide aux membres.",
    requirement: "Aider 5 membres en difficulté"
  },
  {
    name: "Mentor Tontine",
    icon: Users,
    color: "blue",
    description: "A parrainé et formé plus de 5 nouveaux membres.",
    requirement: "5 parrainages réussis"
  },
  {
    name: "Génie Financier",
    icon: TrendingUp,
    color: "indigo",
    description: "Maximise ses intérêts via l'épargne productive (ASCA).",
    requirement: "Réaliser un gain de 15% via ASCA"
  },
  {
    name: "Gouverneur",
    icon: Crown,
    color: "purple",
    description: "A présidé au moins 3 sessions avec brio.",
    requirement: "Présidence de 3 cycles"
  }
];

export default function GamificationPage() {
  return (
    <PublicLayout>
      <div className="space-y-24 pb-20">
        
        {/* Hero Section */}
        <section className="relative pt-12 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-amber-100 text-gold rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-200">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold text-charcoal mb-8 leading-tight">
              La Solidarité devient un <span className="text-amber-500">Jeu.</span>
            </h1>
            <p className="text-xl text-graphite font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
              Tchoua transforme l&apos;engagement communautaire en une expérience gratifiante. 
              Gagnez des points, débloquez des badges et grimpez dans le classement.
            </p>
          </motion.div>
        </section>

        {/* System Overview */}
        <section className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Points d'Impact (IP)",
              description: "Gagnez des points pour chaque action positive : paiement ponctuel, participation aux votes, aide sociale.",
              icon: Zap,
              color: "yellow"
            },
            {
              title: "Niveaux de Confiance",
              description: "Votre niveau de confiance débloque des plafonds de crédit plus élevés et des frais réduits.",
              icon: Shield,
              color: "blue"
            },
            {
              title: "Récompenses Réelles",
              description: "Transformez vos points en avantages : baisses de taux d'intérêt ou accès prioritaire aux fonds.",
              icon: Gem,
              color: "emerald"
            }
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 bg-warm-white rounded-2xl border border-stone shadow-sm hover:shadow-xl transition-all"
            >
              <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-6`}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-4">{item.title}</h3>
              <p className="text-graphite font-medium text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </section>

        {/* Badge Collection */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-semibold text-charcoal">Collectionnez les Badges</h2>
            <p className="text-graphite font-medium">Chaque badge raconte une histoire de votre parcours dans l&apos;association.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {badges.map((badge, idx) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group relative p-6 bg-warm-white rounded-3xl border border-stone hover:bg-forest transition-all duration-500 overflow-hidden"
              >
                <div className="relative z-10 space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-${badge.color}-50 text-${badge.color}-600 flex items-center justify-center group-hover:bg-white/10 group-hover:text-white transition-colors`}>
                    <badge.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal group-hover:text-white transition-colors">{badge.name}</h4>
                    <p className="text-[10px] font-bold text-forest uppercase group-hover:text-emerald-400">{badge.requirement}</p>
                  </div>
                  <p className="text-xs text-graphite group-hover:text-ash/60 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    {badge.description}
                  </p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <badge.icon className="w-20 h-20 -mr-8 -mt-8" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Ethical Note */}
        <section className="bg-gray-900 rounded-2xl p-12 md:p-20 text-white text-center space-y-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black max-w-3xl mx-auto leading-tight">
            Une Gamification <span className="text-emerald-400">Éthique</span> & Humaine.
          </h2>
          <p className="text-lg text-ash font-medium max-w-2xl mx-auto leading-relaxed">
            Contrairement aux systèmes qui poussent à la consommation, Tchoua utilise la gamification 
            pour renforcer la discipline financière et les liens de solidarité.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
            {[
              { label: "Transparence", icon: CheckCircle2 },
              { label: "Pas de FOMO", icon: Lock },
              { label: "Inclusivité", icon: Globe },
              { label: "Respect Privé", icon: Shield }
            ].map(item => (
              <div key={item.label} className="space-y-3">
                <item.icon className="w-6 h-6 text-emerald-400 mx-auto" />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-20 bg-gold/10 rounded-2xl border-2 border-amber-100">
          <h2 className="text-3xl md:text-5xl font-semibold text-charcoal mb-8">Devenez un Pilier de votre Communauté.</h2>
          <Link href="/register" className="inline-flex items-center gap-4 px-10 py-5 bg-forest text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
             Commencer mon aventure <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </PublicLayout>
  );
}
