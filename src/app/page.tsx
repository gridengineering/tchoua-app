"use client";

import Link from "next/link";
import {
  ArrowRight, CheckCircle, Star, Users, TrendingUp, Shield,
  Zap, Heart, BarChart3,
  MessageCircle, Calendar, ShoppingBag, Bot, PiggyBank
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-layout";

export default function HomePage() {


  return (
    <div className="min-h-screen" style={{ background: "#f7f3eb", color: "#1a1a1a" }}>

      {/* ── NAV ── */}
      <PublicHeader />

      {/* ── HERO ── */}
      <section style={{ background: "#0d3d28" }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #e68a00 0%, transparent 50%), radial-gradient(circle at 80% 20%, #2d7a52 0%, transparent 40%)"
        }} />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
                style={{ background: "rgba(212,163,67,0.2)", color: "#f0c56a", border: "1px solid rgba(212,163,67,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#e68a00] animate-pulse" />
                ERP Tontine Open Source — 100% Gratuit
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                La Solidarité,<br />
                <span className="text-[#e68a00]">Digitalisée.</span>
              </h1>

              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                Tchoua transforme votre tontine traditionnelle en un système numérique
                complet — transparence totale, cotisations multi-supports, prêts et solidarité.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-[#0d3d28] bg-[#e68a00] hover:bg-[#ff9d0a] shadow-xl shadow-[#e68a00]/20 transition-all uppercase text-xs tracking-widest">
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
                  Voir la Démo
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-[#e68a00] text-[#e68a00]" />
                  ))}
                </div>
                <span className="text-white/60 text-sm">4.9/5 · 2,500+ membres actifs</span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-80 h-72">
                {/* Mock dashboard card */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#0a2e1e" }}>
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#e68a00] flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                      </div>
                      <span className="text-white text-sm font-semibold">Grand livre</span>
                      <span className="ml-auto text-white/40 text-xs">OHADA</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { label: "Cotisation M.", amount: "+50,000", color: "#4ade80" },
                      { label: "Fonds urgence", amount: "+5,000", color: "#4ade80" },
                      { label: "Prêt accordé", amount: "-100,000", color: "#f87171" },
                      { label: "Remboursement", amount: "+18,500", color: "#4ade80" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <span className="text-white/70 text-xs">{row.label}</span>
                        <span className="text-xs font-semibold" style={{ color: row.color }}>{row.amount}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(212,163,67,0.15)", border: "1px solid rgba(212,163,67,0.3)" }}>
                      <span className="text-[#e68a00] text-xs">🗳 Assemblée : Vote investissement terrain — 6/10</span>
                    </div>
                  </div>
                </div>
                {/* Floating stats */}
                <div className="absolute -top-4 -right-6 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Taux de remboursement</div>
                    <div className="text-sm font-bold text-gray-900">98.2%</div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fef9f0" }}>
                    <Users className="w-4 h-4" style={{ color: "#e68a00" }} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Membres actifs</div>
                    <div className="text-sm font-bold text-gray-900">2,547</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-[#e2ddd4]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2,500+", label: "Membres" },
              { value: "180+", label: "Tontines" },
              { value: "850M+", label: "FCFA gérés" },
              { value: "4", label: "Pays" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#0d3d28" }}>{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TYPES DE TONTINES ── */}
      <section className="py-20 px-6" style={{ background: "#f7f3eb" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>Fonctionnalités</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#0d3d28" }}>
              Une Tontine.<br />Tous les Types.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Qu'il s'agisse de cotisations cash, nature, ou de solidarité, Tchoua s'adapte à chaque tradition.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tontineTypes.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e2ddd4] hover:shadow-md transition-all group">
                <div className="h-40 flex items-center justify-center text-6xl" style={{ background: t.bg }}>
                  {t.icon}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2" style={{ color: "#0d3d28" }}>{t.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {t.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "#f7f3eb", color: "#1a5c3a", border: "1px solid #e2ddd4" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAQUE TONTINE A SA PLACE ── */}
      <section className="py-20 px-6" style={{ background: "#0d3d28" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Chaque Tontine a sa Place
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Financière, naturelle ou culturelle — chaque pratique traditionnelle trouve son écrin numérique.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {tontinePlaces.map((p, i) => (
              <div key={i} className="rounded-2xl p-6 hover:scale-[1.02] transition-all"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{p.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-4">{p.desc}</p>
                <div className="space-y-1.5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle className="w-3.5 h-3.5 text-[#e68a00] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 GESTES ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>Simplicité</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0d3d28" }}>
              Ensemble, en Trois Gestes
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              De la création à la distribution, tout se fait en quelques clics.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl"
                  style={{ background: i === 0 ? "#0d3d28" : i === 1 ? "#e68a00" : "#1a5c3a" }}>
                  {step.icon}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">Étape {i + 1}</div>
                <h3 className="font-bold text-xl mb-3" style={{ color: "#0d3d28" }}>{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALORISEZ CHAQUE ENGAGEMENT ── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(135deg, #f5e6c0, #fdf0d0, #f0d99a)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-5"
                style={{ background: "rgba(138,100,20,0.15)", color: "#8a6414" }}>Engagement</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-5" style={{ color: "#5a3a00" }}>
                Valorisez Chaque Engagement
              </h2>
              <p className="text-[#7a5a10] mb-6 leading-relaxed">
                Points, badges et niveaux récompensent la fiabilité, la solidarité
                et l'implication communautaire de chaque membre.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {levels.map((l) => (
                  <div key={l.name} className="flex items-center gap-2 p-3 rounded-xl bg-white/60">
                    <span className="text-xl">{l.icon}</span>
                    <div>
                      <div className="text-xs font-bold" style={{ color: "#5a3a00" }}>{l.name}</div>
                      <div className="text-xs text-[#7c2d12]">{l.pts} pts</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#8a6414" }}>
                Voir mon score
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white/70 rounded-2xl p-6 shadow-sm border border-[#e8d49a]">
              <h3 className="font-bold text-lg mb-4" style={{ color: "#5a3a00" }}>Tableau de progression</h3>
              {levels.map((l, i) => (
                <div key={l.name} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: "#5a3a00" }}>{l.icon} {l.name}</span>
                    <span style={{ color: "#7c2d12" }}>{l.pts} pts</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f0d99a]">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${(i + 1) * 20}%`, background: "#e68a00" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="py-20 px-6" style={{ background: "#f7f3eb" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>Communauté</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#0d3d28" }}>
              La Voix des Communautés
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2ddd4]">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-[#e68a00] text-[#e68a00]" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: "#0d3d28" }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "#0d3d28" }}>{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>Fonctionnalités</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0d3d28" }}>
              18 Modules.<br />Un Écosystème Complet.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Tchoua ne remplace pas la tontine traditionnelle — il lui donne des ailes numériques.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {modules.map((m, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#e2ddd4] hover:border-[#0d3d28]/30 hover:shadow-sm transition-all group">
                <div className="text-2xl mb-3">{m.icon}</div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-[#0d3d28]" style={{ color: "#1a1a1a" }}>{m.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-6" style={{ background: "#f7f3eb" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>Tarifs</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0d3d28" }}>
              Gratuit &amp; Open Source.<br />Pour Toujours.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Tchoua est 100% gratuit et open source (MIT/Apache 2.0). Toutes les fonctionnalités sont incluses,
              sans limite, sans carte bancaire, pour toujours.
            </p>
          </div>

          {/* Single plan card */}
          <div className="rounded-3xl overflow-hidden shadow-xl border-2" style={{ borderColor: "#e68a00" }}>
            {/* Header */}
            <div className="py-8 px-8 text-center" style={{ background: "#0d3d28" }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
                style={{ background: "#e68a00", color: "#0d3d28" }}>
                🌿 Open Source · MIT / Apache 2.0
              </div>
              <h3 className="text-4xl font-bold text-white mb-1">Gratuit</h3>
              <div className="text-6xl font-bold mb-2" style={{ color: "#e68a00" }}>0 FCFA</div>
              <p className="text-white/60 text-sm">Pour toujours · Sans carte bancaire · Auto-hébergeable</p>
              <div className="flex justify-center gap-4 mt-5 flex-wrap">
                {["18 modules inclus", "Membres illimités", "Tontines illimitées", "Code source ouvert"].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-sm text-white/80">
                    <CheckCircle className="w-3.5 h-3.5 text-[#e68a00]" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Feature table */}
            <div className="bg-white p-8">
              <h4 className="font-bold text-lg mb-5 text-center" style={{ color: "#0d3d28" }}>
                Toutes les fonctionnalités incluses
              </h4>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">
                {allFeatures.map((group, gi) => (
                  <div key={gi}>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2 mt-4"
                      style={{ color: "#7c2d12" }}>{group.category}</div>
                    {group.items.map(f => (
                      <div key={f} className="flex items-center gap-2 py-1.5 border-b border-[#f7f3eb]">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#1a5c3a" }} />
                        <span className="text-sm text-gray-700">{f}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#0d3d28" }}>
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="https://github.com/gridengineering/tchoua-app" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold border transition-all hover:bg-gray-50"
                  style={{ borderColor: "#0d3d28", color: "#0d3d28" }}>
                  ⭐ GitHub — Code source
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-6" style={{ background: "#0d3d28" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Prêt à Amplifier<br />Votre Tontine ?
          </h2>
          <p className="text-white/60 mb-8 text-lg">
            Rejoignez 2,500+ membres qui digitalisent leur solidarité avec Tchoua.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#0d3d28] bg-white hover:bg-[#f7f3eb] transition-all">
              Créer Mon Groupe
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-medium text-white transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
              Voir la Démo
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#071e14" }} className="text-white/60">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-5 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a5c3a" }}>
                  <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="font-bold text-white text-lg">Tchoua</span>
              </div>
              <p className="text-sm leading-relaxed mb-5">
                L'ERP des tontines africaines. Digitaliser la solidarité traditionnelle avec les outils de demain.
              </p>
              <div className="flex gap-3">
                {["𝕏", "in", "📘", "▶️"].map((s, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer hover:bg-white/10 transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            {footerLinks.map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wide">{col.title}</h4>
                <div className="space-y-2.5">
                  {col.links.map((l) => (
                    <div key={l} className="text-sm hover:text-white cursor-pointer transition-colors">{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
            <span>© 2024 Tchoua. Tous droits réservés.</span>
            <div className="flex gap-5">
              {["Privacy", "Terms", "Cookies"].map((l) => (
                <span key={l} className="hover:text-white cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const tontineTypes = [
  {
    icon: "💰",
    title: "Cotisations Cash & Nature",
    bg: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
    desc: "MTN MoMo, Orange Money, Wave, espèces, maïs, macabo, huile de palme — tous les modes de cotisation acceptés.",
    tags: ["ROSCA", "ASCA", "Multi-devises"],
  },
  {
    icon: "🌾",
    title: "Contributions en Nature",
    bg: "linear-gradient(135deg, #fff8e1, #ffecb3)",
    desc: "Gérez les apports non monétaires avec conversion automatique et suivi qualité des contributions.",
    tags: ["Tontine Nature", "Coopérative", "Agriculture"],
  },
  {
    icon: "🤝",
    title: "Solidarité & Services",
    bg: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
    desc: "Fonds d'urgence, soutien naissance/mariage/deuil, échanges de services et compétences communautaires.",
    tags: ["Entraide", "Urgence", "Culture"],
  },
];

const tontinePlaces = [
  {
    icon: "🏦",
    title: "Financière",
    desc: "ROSCA et ASCA avec tours de tirage, prêts internes et microfinance communautaire.",
    features: ["Tours de tirage automatiques", "Prêts avec intérêts", "Rapports OHADA", "Paiements mobiles"],
  },
  {
    icon: "🌿",
    title: "En Nature",
    desc: "Contributions en produits agricoles avec système de valorisation et échange.",
    features: ["Conversion unités/valeur", "Contrôle qualité", "Marketplace intégré", "Coopérative agricole"],
  },
  {
    icon: "✨",
    title: "Services & Compétences",
    desc: "Échangez des heures de travail, expertises professionnelles et services domestiques.",
    features: ["Banque de temps", "Profils de compétences", "Rating des échanges", "Contrats de service"],
  },
];

const steps = [
  {
    icon: "👥",
    title: "Créez Votre Groupe",
    desc: "Configurez votre tontine en quelques minutes — type, montant, fréquence, règles et membres.",
  },
  {
    icon: "💳",
    title: "Cotisez à Votre Rythme",
    desc: "Mobile Money, espèces ou nature — chaque cotisation est enregistrée et confirmée en temps réel.",
  },
  {
    icon: "🎯",
    title: "Distribuez Équitablement",
    desc: "Tirage aléatoire ou par ordre, chaque bénéficiaire reçoit son dû de façon transparente.",
  },
];

const levels = [
  { name: "Novice", icon: "🌱", pts: "0-99" },
  { name: "Actif", icon: "⭐", pts: "100-299" },
  { name: "Engagé", icon: "🌟", pts: "300-599" },
  { name: "Leader", icon: "🏆", pts: "600-999" },
  { name: "Légende", icon: "👑", pts: "1000+" },
];

const testimonials = [
  {
    text: "Depuis que nous utilisons Tchoua, notre tontine est beaucoup plus transparente. Chaque membre peut voir les transactions en temps réel.",
    name: "Marie Ngono",
    initials: "MN",
    role: "Présidente, Tontine Femmes Entrepreneurs, Yaoundé",
  },
  {
    text: "J'ai pu obtenir un micro-prêt en 48h grâce à mon bon score Tchoua. La plateforme a vraiment changé notre façon de fonctionner.",
    name: "Jean-Baptiste Nkomo",
    initials: "JN",
    role: "Membre, Coopérative Agricole, Bafoussam",
  },
  {
    text: "La gestion des contributions en maïs et café est maintenant simple et précise. Tout le monde fait confiance au système.",
    name: "Alice Mballa",
    initials: "AM",
    role: "Secrétaire, Entraide Famille Mballa, Douala",
  },
];

const modules = [
  { icon: "💰", title: "Cotisations", desc: "Cash & nature multi-supports" },
  { icon: "🔄", title: "Sessions & Tirage", desc: "ROSCA et bénéficiaires" },
  { icon: "🏦", title: "Prêts & Crédit", desc: "Microfinance interne" },
  { icon: "❤️", title: "Solidarité", desc: "Aide sociale et urgences" },
  { icon: "💹", title: "Épargne", desc: "Objectifs et projections" },
  { icon: "🛒", title: "Marketplace", desc: "Achats groupés & commerce" },
  { icon: "🎭", title: "Événements", desc: "Culture & assemblées" },
  { icon: "💬", title: "Chat Groupe", desc: "Messagerie par tontine" },
  { icon: "🤖", title: "Conseils IA", desc: "Conseiller financier local" },
  { icon: "📊", title: "Rapports", desc: "Analytics & export CSV" },
  { icon: "📅", title: "Calendrier", desc: "Vue unifiée multi-tontines" },
  { icon: "🔔", title: "Notifications", desc: "Push, SMS, email" },
  { icon: "📚", title: "Grand Livre", desc: "Comptabilité OHADA" },
  { icon: "🏅", title: "Scoring", desc: "Gamification & badges" },
  { icon: "🌾", title: "Nature", desc: "Gestion des tontines nature" },
  { icon: "👥", title: "Membres", desc: "Profils & rôles" },
  { icon: "⚙️", title: "Paramètres", desc: "Configuration avancée" },
  { icon: "🏛️", title: "Modèles d'Association", desc: "Bibliothèque de modèles (AMSED, NDI, etc.)" },
  { icon: "🌍", title: "Multi-pays", desc: "CEMAC & diaspora" },
];

const allFeatures = [
  {
    category: "Gestion de tontines",
    items: [
      "Tontines illimitées (ROSCA, ASCA, Nature, Services, Solidarité, Hybride)",
      "Membres illimités par tontine",
      "Fréquences flexibles (1er Samedi, après le 5, jour fixe, hebdo...)",
      "Parts configurables + reliquat en caisse",
      "Plusieurs bénéficiaires par séance",
      "Modes d'attribution : montant fixe ou % de la cagnotte",
    ],
  },
  {
    category: "Cotisations & paiements",
    items: [
      "Cotisations cash multi-devises (FCFA, XAF...)",
      "Cotisations en nature (maïs, huile, café...)",
      "Échanges de services et compétences",
      "MTN MoMo, Orange Money, Wave, Express Union, espèces",
      "Suivi des retards et pénalités",
    ],
  },
  {
    category: "Caisse & Microfinance",
    items: [
      "Caisse automatique (reliquat cumulé)",
      "Prêts sur caisse avec taux d'intérêt mensuel",
      "Remboursement obligatoire à la séance suivante",
      "Prêts internes avec approbation et suivi",
      "Tableau d'amortissement automatique",
      "Grand livre partagé (norme OHADA)",
    ],
  },
  {
    category: "Solidarité & Aide",
    items: [
      "Fonds d'urgence (maladie, accident, décès)",
      "Aide naissance, mariage, scolarité",
      "Vote démocratique sur les décisions",
      "Assemblée générale virtuelle",
    ],
  },
  {
    category: "Épargne & Investissement",
    items: [
      "Objectifs d'épargne avec projections",
      "Investissements collectifs",
      "Suivi multi-tontines",
    ],
  },
  {
    category: "Marketplace & Événements",
    items: [
      "Marketplace communautaire",
      "Achats groupés avec prix de gros",
      "Événements culturels & assemblées",
      "Calendrier fusionné multi-tontines",
    ],
  },
  {
    category: "Communication & IA",
    items: [
      "Chat de groupe par tontine (temps réel)",
      "Canaux publics & restreints",
      "Conseiller financier IA (local, sans API externe)",
      "Notifications intelligentes (push, email)",
    ],
  },
  {
    category: "Rapports & Scoring",
    items: [
      "Rapports individuels & croisés multi-tontines",
      "Export CSV",
      "Scoring & gamification (5 niveaux)",
      "Badges et récompenses",
      "Audit trail complet",
    ],
  },
  {
    category: "Technique & Accès",
    items: [
      "Interface multilingue (FR, EN, ES, DE + extensible)",
      "App mobile Android & iOS (Expo/React Native)",
      "API REST complète",
      "Open Source MIT/Apache 2.0",
      "Auto-hébergeable (SQLite/PostgreSQL)",
    ],
  },
];

const footerLinks = [
  {
    title: "Product",
    links: ["Modules", "Pricing", "Security", "API"],
  },
  {
    title: "Resources",
    links: ["Blog", "Guides", "FAQ", "Support"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Partners", "Contact"],
  },
];
