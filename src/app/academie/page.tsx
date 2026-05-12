"use client";

import React, { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n/context";
import { wikiTranslations, WikiLang } from "@/lib/i18n/wiki-translations";
import { ArchitectureDiagram } from "@/components/wiki/ArchitectureDiagram";
import { Search, BookOpen, Shield, Layers, Workflow, ChevronDown, ChevronUp, Globe, CheckCircle, ArrowRight, Server, Database, Lock, FileText, Users } from "lucide-react";

const MODULE_KEYS = [
  "tontine_rotative",
  "asca",
  "encheres",
  "solidarite",
  "prets",
  "epargne",
  "marketplace",
  "gamification",
  "rapports",
  "admin",
] as const;

const WORKFLOW_KEYS = ["cotisation", "session", "pret"] as const;

export default function AcademiePage() {
  const rawLang = useLang();
  const lang = (rawLang in wikiTranslations ? rawLang : "fr") as WikiLang;
  const t = wikiTranslations[lang];

  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const toggleModule = (key: string) =>
    setOpenModules((p) => ({ ...p, [key]: !p[key] }));

  /* ── Architecture diagram nodes ── */
  const archNodes = useMemo(
    () => [
      { id: "user", label: "Utilisateur", sublabel: "Web / Mobile", color: "#0d3d28", x: 350, y: 20, w: 120, h: 50 },
      { id: "nextjs", label: "Next.js 16", sublabel: "Turbopack + React", color: "#e68a00", x: 350, y: 110, w: 120, h: 50 },
      { id: "api", label: "API Routes", sublabel: "REST / Server Actions", color: "#2563eb", x: 350, y: 200, w: 120, h: 50 },
      { id: "auth", label: "NextAuth", sublabel: "JWT + OAuth", color: "#7c3aed", x: 120, y: 200, w: 120, h: 50 },
      { id: "prisma", label: "Prisma ORM", sublabel: "PostgreSQL", color: "#0891b2", x: 580, y: 200, w: 120, h: 50 },
      { id: "firebase", label: "Firebase", sublabel: "Auth / Storage", color: "#ea4335", x: 120, y: 290, w: 120, h: 50 },
      { id: "db", label: "PostgreSQL", sublabel: "Données structurées", color: "#0891b2", x: 350, y: 290, w: 120, h: 50 },
      { id: "zustand", label: "Zustand", sublabel: "State global", color: "#e68a00", x: 580, y: 290, w: 120, h: 50 },
    ],
    []
  );
  const archEdges = useMemo(
    () => [
      { from: "user", to: "nextjs" },
      { from: "nextjs", to: "api" },
      { from: "api", to: "auth", label: "auth" },
      { from: "api", to: "prisma", label: "query" },
      { from: "auth", to: "firebase", dashed: true },
      { from: "prisma", to: "db", label: "SQL" },
      { from: "nextjs", to: "zustand", dashed: true },
    ],
    []
  );

  /* ── Search filter ── */
  const filteredModules = useMemo(() => {
    if (!search.trim()) return MODULE_KEYS;
    const q = search.toLowerCase();
    return MODULE_KEYS.filter((k) => {
      const m = t.modules[k];
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [search, t]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb]">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden bg-[#0d3d28] text-white py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#e68a00]/20 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold mb-6">
            <BookOpen className="w-4 h-4" />
            WIKI / DOCUMENTATION
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">{t.pageTitle}</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">{t.pageSubtitle}</p>

          {/* Search + Lang */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#e68a00]"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 font-bold">
              <Globe className="w-5 h-5" />
              {lang.toUpperCase()}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STICKY NAV ═══════════════════ */}
      <nav className="sticky top-20 z-40 bg-white/90 backdrop-blur-md border-b border-[#e2ddd4]">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto py-3">
          {[
            { id: "overview", label: t.navOverview, icon: BookOpen },
            { id: "architecture", label: t.navArchitecture, icon: Server },
            { id: "modules", label: t.navModules, icon: Layers },
            { id: "workflows", label: t.navWorkflows, icon: Workflow },
            { id: "security", label: t.navSecurity, icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? "bg-[#0d3d28] text-white"
                  : "text-gray-600 hover:bg-[#0d3d28]/5 hover:text-[#0d3d28]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-24">
        {/* ═══════════════════ OVERVIEW ═══════════════════ */}
        <section id="overview">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Layers, label: "18", desc: lang === "fr" ? "Modules interconnectés" : lang === "en" ? "Interconnected modules" : lang === "es" ? "Módulos interconectados" : "Vernetzte Module" },
              { icon: Users, label: "8", desc: lang === "fr" ? "Langues supportées" : lang === "en" ? "Supported languages" : lang === "es" ? "Idiomas soportados" : "Unterstützte Sprachen" },
              { icon: Shield, label: "∞", desc: lang === "fr" ? "Associations illimitées" : lang === "en" ? "Unlimited associations" : lang === "es" ? "Asociaciones ilimitadas" : "Unbegrenzte Vereine" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e2ddd4] p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#0d3d28]/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-[#0d3d28]" />
                </div>
                <div className="text-3xl font-black text-[#0d3d28]">{s.label}</div>
                <div className="text-sm font-semibold text-gray-500 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════ ARCHITECTURE ═══════════════════ */}
        <section id="architecture">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#0d3d28] flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0d3d28]">{t.architectureTitle}</h2>
              <p className="text-gray-500 font-medium">{t.architectureDesc}</p>
            </div>
          </div>

          <ArchitectureDiagram nodes={archNodes} edges={archEdges} height={380} />

          {/* Tech stack cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Server, title: "Next.js 16", desc: "SSR / Turbopack / React 19", color: "#0d3d28" },
              { icon: Database, title: "PostgreSQL", desc: "Prisma ORM + Relations", color: "#0891b2" },
              { icon: Lock, title: "NextAuth.js", desc: "JWT + OAuth + RBAC", color: "#7c3aed" },
              { icon: FileText, title: "Zustand + API", desc: "State + REST Actions", color: "#e68a00" },
            ].map((tech, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e2ddd4] p-5 hover:shadow-md transition-shadow">
                <tech.icon className="w-8 h-8 mb-3" style={{ color: tech.color }} />
                <h3 className="font-black text-gray-900">{tech.title}</h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════ MODULES ═══════════════════ */}
        <section id="modules">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#e68a00] flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0d3d28]">{t.modulesTitle}</h2>
              <p className="text-gray-500 font-medium">{t.modulesDesc}</p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredModules.map((key) => {
              const m = t.modules[key];
              const open = openModules[key];
              return (
                <div key={key} className="bg-white rounded-2xl border border-[#e2ddd4] overflow-hidden">
                  <button
                    onClick={() => toggleModule(key)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0d3d28]/10 flex items-center justify-center text-lg font-black text-[#0d3d28]">
                        {MODULE_KEYS.indexOf(key) + 1}
                      </div>
                      <div>
                        <h3 className="font-black text-[#0d3d28] text-lg">{m.title}</h3>
                        <p className="text-sm text-gray-500 font-medium line-clamp-1">{m.description}</p>
                      </div>
                    </div>
                    {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>

                  {open && (
                    <div className="px-5 pb-6 border-t border-[#e2ddd4]">
                      <p className="text-gray-700 font-medium leading-relaxed mt-4">{m.description}</p>

                      {/* Features */}
                      <div className="mt-4">
                        <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-3">
                          {lang === "fr" ? "Fonctionnalités" : lang === "en" ? "Features" : lang === "es" ? "Funcionalidades" : "Funktionen"}
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {m.features.map((f, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-[#0d3d28] mt-0.5 shrink-0" />
                              <span className="text-sm font-semibold text-gray-700">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Workflow */}
                      <div className="mt-6">
                        <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-3">
                          {lang === "fr" ? "Workflow" : lang === "en" ? "Workflow" : lang === "es" ? "Workflow" : "Workflow"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {m.workflow.map((w, i) => (
                            <React.Fragment key={i}>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f7f3eb] border border-[#e2ddd4]">
                                <span className="w-5 h-5 rounded-full bg-[#0d3d28] text-white text-[10px] font-black flex items-center justify-center">{w.step}</span>
                                <span className="text-xs font-bold text-[#0d3d28]">{w.title}</span>
                              </div>
                              {i < m.workflow.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-[#e68a00] shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {m.workflow.map((w, i) => (
                            <div key={i} className="text-xs font-medium text-gray-600 bg-gray-50 rounded-lg p-3">
                              <span className="font-black text-[#0d3d28]">{w.step}.</span> {w.desc}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Example */}
                      <div className="mt-6 bg-[#0d3d28]/5 rounded-xl p-5 border border-[#0d3d28]/10">
                        <h4 className="text-sm font-black uppercase tracking-wider text-[#0d3d28] mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {m.example.title}
                        </h4>
                        <ol className="space-y-2">
                          {m.example.steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                              <span className="w-5 h-5 rounded-full bg-[#e68a00] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              {s}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredModules.length === 0 && (
              <div className="text-center py-12 text-gray-400 font-bold">
                {lang === "fr" ? "Aucun résultat" : lang === "en" ? "No results" : lang === "es" ? "Sin resultados" : "Keine Ergebnisse"}
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════ WORKFLOWS ═══════════════════ */}
        <section id="workflows">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb] flex items-center justify-center">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0d3d28]">{t.workflowsTitle}</h2>
              <p className="text-gray-500 font-medium">{t.workflowsDesc}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {WORKFLOW_KEYS.map((key) => {
              const w = t.workflows[key];
              return (
                <div key={key} className="bg-white rounded-2xl border border-[#e2ddd4] p-6">
                  <h3 className="font-black text-[#0d3d28] mb-4 text-center">{w.title}</h3>
                  <div className="space-y-3">
                    {w.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0d3d28] text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</div>
                        <div className="flex-1 text-sm font-semibold text-gray-700">{s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════ SECURITY ═══════════════════ */}
        <section id="security">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0d3d28]">{t.securityTitle}</h2>
              <p className="text-gray-500 font-medium">{t.securityDesc}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.security.items.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e2ddd4] p-6 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#0d3d28]/10 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-[#0d3d28]" />
                </div>
                <h3 className="font-black text-[#0d3d28] mb-2">{item.title}</h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>


    </div>
  );
}
