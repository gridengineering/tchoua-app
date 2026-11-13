"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Check, ChevronDown, Globe, Menu, X } from "lucide-react";
import { HEADER_COPY, HOME_COPY, publicLang } from "@/lib/i18n/public-copy";
import { DOCS_COPY } from "@/lib/i18n/docs-copy";

type SubLink = { href: string; key: string };

const NAV: { key: string; href: string }[] = [
  { key: "fonctionnalites", href: "/#modules" },
  { key: "how_it_works", href: "/#steps" },
  { key: "tarifs", href: "/#pricing" },
  { key: "documentation", href: "/documentation" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { lang, setLang, availableLangs, t } = useI18n();
  const h = HEADER_COPY[publicLang(lang)];
  const c = HOME_COPY[publicLang(lang)];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const [brand, setBrand] = useState<{
    siteName: string; logoUrl: string; primaryColor: string; siteTagline: string;
    maintenanceMode: boolean; maintenanceMessage: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.settings && setBrand(data.settings))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenu(null);
      if (langRef.current && !langRef.current.contains(event.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const label = (key: string) => key === "documentation" ? DOCS_COPY[publicLang(lang)].nav : (t.nav as Record<string, string>)[key] ?? key;

  const LanguageList = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? "grid grid-cols-2 gap-2" : "max-h-80 w-64 overflow-y-auto py-1"}>
      {availableLangs.map((l) => (
        <button
          key={l.code}
          onClick={() => { setLang(l.code); setLangOpen(false); setMobileOpen(false); }}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[#f7f3eb] ${
            lang === l.code ? "font-semibold text-[#0d3d28]" : "text-gray-600"
          }`}
        >
          <span className="flex items-center gap-2"><span className="text-base">{l.flag}</span>{l.name}</span>
          {lang === l.code && <Check className="h-4 w-4 text-[#0d3d28]" />}
        </button>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[#e2ddd4]/70 bg-white/95 backdrop-blur-md">
      {brand?.maintenanceMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-white">
          {brand.maintenanceMessage || (lang === "fr" ? "Plateforme en maintenance." : "Platform under maintenance.")}
        </div>
      )}

      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-[#0d3d28]/10 transition-transform group-hover:scale-105"
            style={{ background: brand?.primaryColor || "#0d3d28" }}>
            <img src={brand?.logoUrl || "/logo.png"} alt="Logo" className="h-6 w-6 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black leading-none tracking-tight" style={{ color: "#7c2d12" }}>{brand?.siteName || "Tchoua"}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#e68a00]">{brand?.siteTagline || "Solidarité Digitale"}</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav ref={menuRef} className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link key={item.key} href={item.href}
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-[#0d3d28]/5 hover:text-[#0d3d28]">
              {label(item.key)}
            </Link>
          ))}
          <a href="mailto:contact@tchoua.com"
            className="whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-[#0d3d28]/5 hover:text-[#0d3d28]">
            {c.footer.contact}
          </a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-[#e2ddd4] bg-gray-50/60 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-white"
              aria-label={h.language}
            >
              <Globe className="h-4 w-4 text-[#0d3d28]" />
              <span className="uppercase">{lang.slice(0, 2)}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#e2ddd4] bg-white shadow-2xl">
                <LanguageList />
              </div>
            )}
          </div>

          <Link href="/login" className="rounded-xl border-2 border-[#0d3d28] px-4 py-2 text-sm font-bold text-[#0d3d28] transition-colors hover:bg-[#0d3d28] hover:text-white">
            {h.login}
          </Link>
          <Link href="/register" className="rounded-xl bg-[#0d3d28] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#0d3d28]/20 transition-transform hover:scale-[1.02]">
            {h.start}
          </Link>
        </div>

        <button
          className="rounded-xl bg-gray-50 p-2 text-[#0d3d28] lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? h.close : h.menu}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-50 flex flex-col overflow-y-auto bg-white p-6 lg:hidden">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <div key={item.key} className="border-b border-gray-100 py-2">
                <Link href={item.href} onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 text-base font-semibold text-[#0d3d28] hover:bg-[#f7f3eb]">
                  {label(item.key)}
                </Link>
              </div>
            ))}
            <div className="border-b border-gray-100 py-2">
              <a href="mailto:contact@tchoua.com" onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-2 py-2 text-base font-semibold text-[#0d3d28] hover:bg-[#f7f3eb]">
                {c.footer.contact}
              </a>
            </div>
          </nav>

          <div className="mt-6 space-y-3">
            <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">{h.language}</div>
            <LanguageList mobile />
          </div>

          <div className="mt-auto grid gap-3 pt-8">
            <Link href="/login" onClick={() => setMobileOpen(false)}
              className="w-full rounded-2xl border-2 border-[#0d3d28] py-3.5 text-center text-sm font-black text-[#0d3d28]">
              {h.login}
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)}
              className="w-full rounded-2xl bg-[#0d3d28] py-3.5 text-center text-sm font-black text-white shadow-xl shadow-[#0d3d28]/20">
              {h.start}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const { lang, setLang, availableLangs, t } = useI18n();
  const c = HOME_COPY[publicLang(lang)];

  const productLinks = [
    { label: c.footer.modules, href: "/#modules" },
    { label: c.footer.pricing, href: "/#pricing" },
    { label: c.footer.how, href: "/#steps" },
    { label: c.footer.api, href: "https://github.com/gridengineering/tchoua-app" },
  ];
  const resourceLinks = [
    { label: c.footer.aboutLink, href: "/about" },
    { label: c.footer.help, href: "/aide" },
    { label: c.footer.security, href: "/security" },
    { label: DOCS_COPY[publicLang(lang)].nav, href: "/documentation" },
    { label: c.footer.contact, href: "mailto:contact@tchoua.com" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#0d3d28] pb-10 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black leading-none tracking-tight text-white">Tchoua</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e68a00]">Solidarité Digitale</span>
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-300">{c.footer.about}</p>
            <div className="flex gap-2">
              <a href="https://github.com/gridengineering/tchoua-app" target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs hover:bg-white/10" aria-label="GitHub">GH</a>
              <a href="https://x.com/stampolla" target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs hover:bg-white/10" aria-label="X">𝕏</a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-widest text-[#e68a00]">{c.footer.product}</h4>
            <ul className="space-y-3">
              {productLinks.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm font-medium text-gray-400 transition-colors hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-widest text-[#e68a00]">{c.footer.resources}</h4>
            <ul className="space-y-3">
              {resourceLinks.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm font-medium text-gray-400 transition-colors hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#e68a00]">
              <Globe className="h-3.5 w-3.5" /> {t.lang.select}
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {availableLangs.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    lang === l.code ? "bg-white/10 font-semibold text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}>
                  <span>{l.flag}</span><span className="truncate">{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-[10px] font-bold tracking-wider text-gray-500">© 2026 TCHOUA · OPEN SOURCE · MIT/APACHE 2.0</p>
          <div className="flex items-center gap-6">
            <Link href="/security" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-white">{c.footer.privacy}</Link>
            <Link href="/security" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-white">{c.footer.terms}</Link>
            <Link href="/security" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-white">{c.footer.cookies}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#f7f3eb" }}>
      <PublicHeader />
      <main className="flex-1">
        {title && (
          <div className="mx-auto max-w-7xl px-6 pt-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
