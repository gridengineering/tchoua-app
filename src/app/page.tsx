"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Star, Users, TrendingUp, MessageCircle } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-layout";
import { useI18n } from "@/lib/i18n/context";
import { HOME_COPY, publicLang } from "@/lib/i18n/public-copy";

const TYPE_ICONS = ["💰", "🌾", "🤝"];
const TYPE_BGS = [
  "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
  "linear-gradient(135deg, #fff8e1, #ffecb3)",
  "linear-gradient(135deg, #fce4ec, #f8bbd0)",
];
const PLACE_ICONS = ["🏦", "🌿", "✨"];
const STEP_ICONS = ["👥", "💳", "🎯"];
const LEVEL_ICONS = ["🌱", "⭐", "🌟", "🏆", "👑"];
const MODULE_ICONS = ["💰", "🔄", "🏦", "❤️", "💹", "🛒", "🎭", "💬", "🤖", "📊", "📅", "🔔", "📚", "🏅", "🌾", "👥", "⚙️", "🏛️", "🌍"];
const ROW_COLORS = ["#4ade80", "#4ade80", "#f87171", "#4ade80"];

export default function HomePage() {
  const { lang } = useI18n();
  const c = HOME_COPY[publicLang(lang)];

  const footerColumns = [
    {
      title: c.footer.product,
      links: [
        { label: c.footer.modules, href: "/#modules" },
        { label: c.footer.pricing, href: "/#pricing" },
        { label: c.footer.security, href: "/security" },
        { label: c.footer.api, href: "/developpeurs" },
      ],
    },
    {
      title: c.footer.resources,
      links: [
        { label: c.footer.how, href: "/how-it-works" },
        { label: c.footer.help, href: "/aide" },
        { label: c.footer.aboutLink, href: "/about" },
        { label: c.footer.contact, href: "mailto:contact@tchoua.com" },
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f7f3eb", color: "#1a1a1a" }}>
      <PublicHeader />

      {/* HERO */}
      <section style={{ background: "#0d3d28" }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #e68a00 0%, transparent 50%), radial-gradient(circle at 80% 20%, #2d7a52 0%, transparent 40%)"
        }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "rgba(212,163,67,0.2)", color: "#f0c56a", border: "1px solid rgba(212,163,67,0.3)" }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e68a00]" />
                {c.hero.badge}
              </div>

              <h1 className="mb-6 text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
                {c.hero.title1}<br />
                <span className="text-[#e68a00]">{c.hero.title2}</span>
              </h1>

              <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/70">{c.hero.desc}</p>

              <div className="mb-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e68a00] px-6 py-4 text-xs font-black uppercase tracking-widest text-[#0d3d28] shadow-xl shadow-[#e68a00]/20 transition-all hover:bg-[#ff9d0a]">
                  {c.hero.cta1}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-medium text-white transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
                  {c.hero.cta2}
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-[#e68a00] text-[#e68a00]" />)}
                </div>
                <span className="text-sm text-white/60">{c.hero.social}</span>
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <div className="relative h-72 w-80">
                <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-2xl" style={{ background: "#0a2e1e" }}>
                  <div className="border-b border-white/10 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-[#e68a00]">
                        <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain" />
                      </div>
                      <span className="text-sm font-semibold text-white">{c.hero.ledger}</span>
                      <span className="ml-auto text-xs text-white/40">OHADA</span>
                    </div>
                  </div>
                  <div className="space-y-2 p-3">
                    {c.hero.rows.map((row, i) => (
                      <div key={row.label} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <span className="text-xs text-white/70">{row.label}</span>
                        <span className="text-xs font-semibold" style={{ color: ROW_COLORS[i] }}>{row.amount}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "rgba(212,163,67,0.15)", border: "1px solid rgba(212,163,67,0.3)" }}>
                      <span className="text-xs text-[#e68a00]">🗳 {c.hero.vote}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-6 -top-4 flex items-center gap-2 rounded-xl bg-white p-3 shadow-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#f0fdf4" }}>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{c.hero.repayment}</div>
                    <div className="text-sm font-bold text-gray-900">98.2%</div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-6 flex items-center gap-2 rounded-xl bg-white p-3 shadow-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#fef9f0" }}>
                    <Users className="h-4 w-4" style={{ color: "#e68a00" }} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{c.hero.members}</div>
                    <div className="text-sm font-bold text-gray-900">2,547</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-[#e2ddd4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {c.stats.map((s) => (
              <div key={s.label}>
                <div className="mb-1 text-3xl font-bold md:text-4xl" style={{ color: "#0d3d28" }}>{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TONTINE TYPES */}
      <section id="tontines" className="px-6 py-20" style={{ background: "#f7f3eb" }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>{c.tontines.badge}</span>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: "#0d3d28" }}>
              {c.tontines.title1}<br />{c.tontines.title2}
            </h2>
            <p className="mx-auto max-w-xl text-gray-500">{c.tontines.desc}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {c.tontines.items.map((t, i) => (
              <div key={t.title} className="overflow-hidden rounded-2xl border border-[#e2ddd4] bg-white shadow-sm transition-all hover:shadow-md">
                <div className="flex h-40 items-center justify-center text-6xl" style={{ background: TYPE_BGS[i] }}>{TYPE_ICONS[i]}</div>
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-bold" style={{ color: "#0d3d28" }}>{t.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{t.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.tags?.map((tag) => (
                      <span key={tag} className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: "#f7f3eb", color: "#1a5c3a", border: "1px solid #e2ddd4" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLACES */}
      <section className="px-6 py-20" style={{ background: "#0d3d28" }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">{c.places.title}</h2>
            <p className="mx-auto max-w-xl text-white/60">{c.places.desc}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {c.places.items.map((p, i) => (
              <div key={p.title} className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="mb-4 text-3xl">{PLACE_ICONS[i]}</div>
                <h3 className="mb-2 text-lg font-bold text-white">{p.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-white/60">{p.desc}</p>
                <div className="space-y-1.5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-[#e68a00]" />{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section id="steps" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>{c.steps.badge}</span>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: "#0d3d28" }}>{c.steps.title}</h2>
            <p className="mx-auto max-w-lg text-gray-500">{c.steps.desc}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {c.steps.items.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: i === 0 ? "#0d3d28" : i === 1 ? "#e68a00" : "#1a5c3a" }}>{STEP_ICONS[i]}</div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">{c.steps.step} {i + 1}</div>
                <h3 className="mb-3 text-xl font-bold" style={{ color: "#0d3d28" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENGAGEMENT */}
      <section id="engagement" className="px-6 py-20" style={{ background: "linear-gradient(135deg, #f5e6c0, #fdf0d0, #f0d99a)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="mb-5 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{ background: "rgba(138,100,20,0.15)", color: "#8a6414" }}>{c.engagement.badge}</span>
              <h2 className="mb-5 text-3xl font-bold md:text-4xl" style={{ color: "#5a3a00" }}>{c.engagement.title}</h2>
              <p className="mb-6 leading-relaxed text-[#7a5a10]">{c.engagement.desc}</p>
              <div className="mb-8 grid grid-cols-2 gap-3">
                {c.engagement.levels.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-2 rounded-xl bg-white/60 p-3">
                    <span className="text-xl">{LEVEL_ICONS[i]}</span>
                    <div>
                      <div className="text-xs font-bold" style={{ color: "#5a3a00" }}>{l.name}</div>
                      <div className="text-xs text-[#7c2d12]">{l.pts} pts</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#8a6414" }}>
                {c.engagement.cta}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-[#e8d49a] bg-white/70 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold" style={{ color: "#5a3a00" }}>{c.engagement.table}</h3>
              {c.engagement.levels.map((l, i) => (
                <div key={l.name} className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium" style={{ color: "#5a3a00" }}>{LEVEL_ICONS[i]} {l.name}</span>
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

      {/* TESTIMONIALS */}
      <section className="px-6 py-20" style={{ background: "#f7f3eb" }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>{c.testimonials.badge}</span>
            <h2 className="text-3xl font-bold md:text-4xl" style={{ color: "#0d3d28" }}>{c.testimonials.title}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {c.testimonials.items.map((t) => (
              <div key={t.name} className="rounded-2xl border border-[#e2ddd4] bg-white p-6 shadow-sm">
                <div className="mb-3 flex">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-[#e68a00] text-[#e68a00]" />)}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: "#0d3d28" }}>{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#0d3d28" }}>{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>{c.modules.badge}</span>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: "#0d3d28" }}>
              {c.modules.title1}<br />{c.modules.title2}
            </h2>
            <p className="mx-auto max-w-xl text-gray-500">{c.modules.desc}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {c.modules.items.map((m, i) => (
              <div key={m.title} className="group rounded-xl border border-[#e2ddd4] p-4 transition-all hover:border-[#0d3d28]/30 hover:shadow-sm">
                <div className="mb-3 text-2xl">{MODULE_ICONS[i]}</div>
                <h3 className="mb-1 text-sm font-semibold group-hover:text-[#0d3d28]" style={{ color: "#1a1a1a" }}>{m.title}</h3>
                <p className="text-xs leading-relaxed text-gray-400">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-20" style={{ background: "#f7f3eb" }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "rgba(212,163,67,0.15)", color: "#7c2d12" }}>{c.pricing.badge}</span>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: "#0d3d28" }}>
              {c.pricing.title1}<br />{c.pricing.title2}
            </h2>
            <p className="mx-auto max-w-lg text-gray-500">{c.pricing.desc}</p>
          </div>

          <div className="overflow-hidden rounded-3xl border-2 shadow-xl" style={{ borderColor: "#e68a00" }}>
            <div className="px-8 py-8 text-center" style={{ background: "#0d3d28" }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold" style={{ background: "#e68a00", color: "#0d3d28" }}>
                🌿 Open Source · MIT / Apache 2.0
              </div>
              <h3 className="mb-1 text-4xl font-bold text-white">{c.pricing.plan}</h3>
              <div className="mb-2 text-6xl font-bold" style={{ color: "#e68a00" }}>{c.pricing.price}</div>
              <p className="text-sm text-white/60">{c.pricing.sub}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-4">
                {c.pricing.perks.map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-sm text-white/80">
                    <CheckCircle className="h-3.5 w-3.5 text-[#e68a00]" />{f}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8">
              <h4 className="mb-5 text-center text-lg font-bold" style={{ color: "#0d3d28" }}>{c.pricing.included}</h4>
              <div className="grid gap-x-12 gap-y-2 md:grid-cols-2">
                {c.pricing.groups.map((group) => (
                  <div key={group.category}>
                    <div className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#7c2d12" }}>{group.category}</div>
                    {group.items.map((f) => (
                      <div key={f} className="flex items-center gap-2 border-b border-[#f7f3eb] py-1.5">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#1a5c3a" }} />
                        <span className="text-sm text-gray-700">{f}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-semibold text-white transition-all hover:opacity-90" style={{ background: "#0d3d28" }}>
                  {c.pricing.free}<ArrowRight className="h-4 w-4" />
                </Link>
                <a href="https://github.com/gridengineering/tchoua-app" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-8 py-3.5 font-semibold transition-all hover:bg-gray-50"
                  style={{ borderColor: "#0d3d28", color: "#0d3d28" }}>
                  ⭐ {c.pricing.github}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20" style={{ background: "#0d3d28" }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">{c.finalCta.title1}<br />{c.finalCta.title2}</h2>
          <p className="mb-8 text-lg text-white/60">{c.finalCta.desc}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#0d3d28] transition-all hover:bg-[#f7f3eb]">
              {c.finalCta.cta1}<ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-medium text-white transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}>{c.finalCta.cta2}</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#071e14" }} className="text-white/60">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-10 grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#1a5c3a" }}>
                  <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                </div>
                <span className="text-lg font-bold text-white">Tchoua</span>
              </div>
              <p className="mb-5 max-w-sm text-sm leading-relaxed">{c.footer.about}</p>
              <div className="flex gap-3">
                <a href="https://github.com/gridengineering/tchoua-app" target="_blank" rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }} aria-label="GitHub">GH</a>
                <a href="https://x.com/stampolla" target="_blank" rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }} aria-label="X">𝕏</a>
                <a href="mailto:contact@tchoua.com"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }} aria-label="Email">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </div>
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h4>
                <div className="space-y-2.5">
                  {col.links.map((l) => (
                    <Link key={l.label} href={l.href} className="block text-sm transition-colors hover:text-white">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs md:flex-row">
            <span>© 2026 Tchoua. {c.footer.rights}</span>
            <div className="flex gap-5">
              <Link href="/security" className="hover:text-white">{c.footer.privacy}</Link>
              <Link href="/security" className="hover:text-white">{c.footer.terms}</Link>
              <Link href="/security" className="hover:text-white">{c.footer.cookies}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
