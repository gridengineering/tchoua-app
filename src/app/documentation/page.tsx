"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle, Download, Globe2, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-layout";
import { useI18n } from "@/lib/i18n/context";
import { publicLang } from "@/lib/i18n/public-copy";
import { DOCS_COPY } from "@/lib/i18n/docs-copy";

const PDF = "/docs/Tchoua_Documentation_Complete_2026_Anonymisee.pdf";
const HTML_MANUAL = "/docs/manuel/index.html";

export default function DocumentationPage() {
  const { lang, setLang, availableLangs } = useI18n();
  const d = DOCS_COPY[publicLang(lang)];
  const docLangs = availableLangs.filter((l) => ["fr", "en", "es", "de"].includes(l.code));

  return (
    <div className="min-h-screen" style={{ background: "#f7f3eb", color: "#1a1a1a" }}>
      <PublicHeader />

      <section className="relative overflow-hidden" style={{ background: "#0d3d28" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 18% 40%, #e68a00 0%, transparent 45%), radial-gradient(circle at 82% 15%, #2d7a52 0%, transparent 40%)",
        }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "rgba(212,163,67,0.18)", color: "#f0c56a", border: "1px solid rgba(212,163,67,0.3)" }}>
                <BookOpen className="h-3.5 w-3.5" /> {d.badge}
              </div>
              <h1 className="mb-5 text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
                {d.title1}<br /><span className="text-[#e68a00]">{d.title2}</span>
              </h1>
              <p className="mb-7 max-w-xl text-lg leading-relaxed text-white/70">{d.desc}</p>
              <div className="mb-8 flex flex-wrap gap-2">
                {[d.pages, d.captures, d.diagrams, d.version].map((x) => (
                  <span key={x} className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#e8f0ea", border: "1px solid rgba(255,255,255,0.12)" }}>{x}</span>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={HTML_MANUAL}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e68a00] px-6 py-4 text-xs font-black uppercase tracking-widest text-[#0d3d28] shadow-xl shadow-[#e68a00]/20 transition-all hover:bg-[#ff9d0a]">
                  <BookOpen className="h-4 w-4" /> {d.readOnline}
                </a>
                <a href={PDF} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-medium text-white transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
                  <Download className="h-4 w-4" /> {d.download}
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  <img src="/logo.png" alt="Tchoua" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Tchoua.com</div>
                  <div className="text-xs text-white/50">Documentation · 2026</div>
                </div>
              </div>
              <div className="rounded-2xl bg-[#f7f3eb] p-5 text-[#0d3d28]">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a97b18]">{d.contents}</div>
                <div className="mt-2 text-2xl font-black leading-tight">18 {d.chaptersWord}<br />+ {d.annexWord}</div>
                <div className="mt-4 space-y-2">
                  {d.parts.map((p) => (
                    <div key={p.title} className="flex items-center justify-between border-b border-[#ddd5c4] pb-2 text-xs">
                      <span className="font-semibold">{p.title}</span>
                      <span className="text-[#7a857e]">{p.chapters.length} {d.chWord}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#0d6b4f]">
                  <ShieldCheck className="h-3.5 w-3.5" /> {d.notice.split(":")[0]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e2ddd4] bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "#0d3d28" }}>{d.domainsTitle}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500">{d.domainsDesc}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.domains.map((x) => (
              <div key={x.title} className="rounded-2xl border border-[#e2ddd4] bg-[#fdfbf6] p-5">
                <div className="mb-2 text-2xl">{x.icon}</div>
                <h3 className="mb-1 text-sm font-bold" style={{ color: "#0d3d28" }}>{x.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{x.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contents" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-[#a97b18]">Documentation</div>
              <h2 className="text-3xl font-bold" style={{ color: "#0d3d28" }}>{d.contents}</h2>
            </div>
            <a href={PDF} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold"
              style={{ borderColor: "#0d3d28", color: "#0d3d28" }}>
              <Download className="h-4 w-4" /> {d.download}
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {d.parts.map((part) => (
              <div key={part.title} className="overflow-hidden rounded-2xl border border-[#e2ddd4] bg-white">
                <div className="border-b border-[#eee6d6] bg-[#f7f3eb] px-5 py-3">
                  <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "#0d3d28" }}>{part.title}</h3>
                </div>
                <div className="divide-y divide-[#f1ebdf]">
                  {part.chapters.map((ch) => (
                    <a key={ch.n} href={`${HTML_MANUAL}#${ch.n === "A" ? "annexes" : "ch" + ch.n.padStart(2, "0")}`}
                      className="flex items-start gap-4 px-5 py-3 transition-colors hover:bg-[#fdfaf2]">
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black"
                        style={{ background: "#0d3d28", color: "#f4d58d" }}>{ch.n}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold" style={{ color: "#1a1a1a" }}>{ch.title}</span>
                        <span className="block text-xs text-gray-500">{ch.desc}</span>
                      </span>
                      <span className="text-xs font-semibold text-[#a97b18]">p. {ch.page}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#e8d39a] bg-[#fbf6e8] p-5 text-sm leading-relaxed text-[#6b5418]">
            <strong>{d.notice.split(":")[0]} :</strong> {d.notice.split(":").slice(1).join(":").trim()}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: "#0d3d28" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#f0c56a]">
                <Globe2 className="h-4 w-4" /> {d.langTitle}
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">{d.langTitle}</h2>
              <p className="max-w-xl text-sm leading-relaxed text-white/60">{d.langDesc}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {docLangs.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    lang === l.code ? "border-[#e68a00] bg-[#e68a00] text-[#0d3d28]" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}>
                  <div className="text-lg">{l.flag}</div>
                  <div className="mt-1 font-semibold">{l.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: "#f7f3eb" }}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-3xl font-bold" style={{ color: "#0d3d28" }}>{d.ctaDesc}</h2>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <a href={HTML_MANUAL} className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-white"
              style={{ background: "#0d3d28" }}>{d.readOnline} <ArrowRight className="h-4 w-4" /></a>
            <a href={PDF} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 font-semibold"
              style={{ borderColor: "#0d3d28", color: "#0d3d28" }}>
              <Download className="h-4 w-4" /> {d.download}
            </a>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle className="h-3.5 w-3.5 text-[#0d6b4f]" /> {d.version}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
