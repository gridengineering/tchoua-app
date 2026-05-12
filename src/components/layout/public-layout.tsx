"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Menu, X, Globe, ChevronDown } from "lucide-react";

type NavItem = 
  | { href: string; key: keyof typeof import("@/lib/i18n/translations").translations.fr.nav }
  | { labelKey: keyof typeof import("@/lib/i18n/translations").translations.fr.nav; 
      isMega?: boolean;
      items?: any[];
      key?: any;
      href?: any;
    };

const PUBLIC_NAV: NavItem[] = [
  {
    labelKey: "fonctionnalites",
    isMega: true,
    items: [
      {
        title: "Gestion Financière",
        image: "/hero-app-mockup.png",
        links: [
          { href: "/fonctionnalites", key: "cotisations", icon: "💰" },
          { href: "/fonctionnalites", key: "sessions", icon: "🔄" },
          { href: "/gamification", key: "gamification", icon: "🏅" },
        ]
      },
      {
        title: "Épargne & Crédit",
        image: "/hero-app-mockup.png",
        links: [
          { href: "/fonctionnalites", key: "epargne", icon: "💹" },
          { href: "/fonctionnalites", key: "prets", icon: "🤝" },
          { href: "/fonctionnalites", key: "solidarite", icon: "❤️" },
        ]
      },
      {
        title: "Organisation",
        image: "/hero-app-mockup.png",
        links: [
          { href: "/fonctionnalites", key: "modeles_association", icon: "🏛️" },
          { href: "/#modules", key: "modules", icon: "⚙️" },
          { href: "/fonctionnalites", key: "rapports", icon: "📊" },
        ]
      },
    ]
  },
  {
    labelKey: "ressources",
    items: [
      { href: "/how-it-works", key: "how_it_works" },
      { href: "/academie", key: "academie" },
      { href: "/mobile", key: "mobile" },
      { href: "/security", key: "security" },
      { href: "/aide", key: "aide" },
    ]
  },
  { href: "/developpeurs", key: "developers" },
  { href: "/about", key: "about" },
  { href: "/#pricing", key: "tarifs" }
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { lang, setLang, availableLangs, t } = useI18n();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e2ddd4]/60">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-[#0d3d28]/10 transition-transform group-hover:scale-105" style={{ background: "#0d3d28" }}>
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl leading-none tracking-tight" style={{ color: "#7c2d12" }}>Tchoua</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#e68a00]">Solidarité Digitale</span>
          </div>
        </Link>

        {/* Main Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV.map((item: any) => (
            item.isMega ? (
              <div key={item.labelKey} className="relative group px-1">
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#0d3d28] hover:bg-[#0d3d28]/5 rounded-xl transition-all">
                  {t.nav[item.labelKey as keyof typeof t.nav]} 
                  <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                {/* Mega Menu Content */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[850px] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="bg-white border border-[#e2ddd4] shadow-2xl rounded-[2rem] overflow-hidden p-8 grid grid-cols-3 gap-8">
                    {item.items!.map((section: any) => (
                      <div key={section.title} className="space-y-5">
                        <div className="relative h-32 rounded-2xl overflow-hidden group/img shadow-md">
                          <img src={section.image} alt={section.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                            <span className="text-white font-black text-sm tracking-wide uppercase">
                              {section.title}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {section.links.map((link: any) => (
                            <Link key={link.key} href={link.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f7f3eb] transition-all group/link border border-transparent hover:border-[#e2ddd4]">
                              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-lg shadow-sm group-hover/link:bg-white transition-colors">
                                {link.icon}
                              </div>
                              <span className="text-sm font-bold text-gray-600 group-hover/link:text-[#0d3d28]">
                                {t.nav[link.key as keyof typeof t.nav]}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : item.items ? (
              <div key={item.labelKey} className="relative group px-1">
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#0d3d28] hover:bg-[#0d3d28]/5 rounded-xl transition-all">
                  {t.nav[item.labelKey as keyof typeof t.nav]} 
                  <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-white border border-[#e2ddd4] shadow-xl rounded-2xl overflow-hidden py-2 z-50">
                  {item.items.map(subItem => (
                    <Link key={subItem.href} href={subItem.href} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-[#f7f3eb] hover:text-[#0d3d28] transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#e68a00] opacity-0 group-hover:opacity-100 transition-opacity" />
                      {t.nav[subItem.key as keyof typeof t.nav]}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={item.href!} href={item.href!} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#0d3d28] hover:bg-[#0d3d28]/5 rounded-xl transition-all">
                {t.nav[item.key as keyof typeof t.nav]}
              </Link>
            )
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Enhanced Lang Selector */}
          <div className="relative group mr-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e2ddd4] bg-gray-50/50 hover:bg-white transition-all text-sm font-bold text-gray-700">
              <Globe className="w-4 h-4 text-[#0d3d28]" />
              <span className="uppercase">{lang.slice(0, 2)}</span>
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-white border border-[#e2ddd4] shadow-2xl rounded-2xl overflow-hidden py-2 z-50">
              <div className="grid grid-cols-4 gap-1 p-2">
                {availableLangs.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    title={l.name}
                    className={`text-2xl p-2 rounded-lg transition-all hover:bg-[#f7f3eb] ${lang === l.code ? "bg-[#0d3d28]/5 scale-110" : "opacity-40 hover:opacity-100"}`}
                  >
                    {l.flag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2" />

          <Link href="/login" className="text-sm font-bold px-5 py-2.5 rounded-xl border-2 border-[#0d3d28] text-[#0d3d28] hover:bg-[#0d3d28] hover:text-white transition-all duration-300">
            {lang === "fr" ? "Connexion" : "Sign In"}
          </Link>
          <Link href="/register" className="text-sm font-black px-6 py-2.5 rounded-xl text-white shadow-lg shadow-[#0d3d28]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" style={{ background: "#0d3d28" }}>
            {lang === "fr" ? "Commencer" : "Get Started"}
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden p-2 rounded-xl bg-gray-50 text-[#0d3d28]" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-20 z-50 bg-white animate-in slide-in-from-right duration-300 p-6 flex flex-col gap-8 overflow-y-auto">
          {PUBLIC_NAV.map((item: any) => (
            <div key={item.labelKey || item.href} className="space-y-4">
              <div className="text-lg font-black text-[#0d3d28] border-b border-gray-100 pb-2">
                {t.nav[item.labelKey as keyof typeof t.nav]}
              </div>
              <div className="grid gap-3 pl-2">
                {item.isMega ? (
                  item.items!.map((section: any) => (
                    <div key={section.title} className="space-y-3 pt-2">
                      <div className="text-[11px] font-black text-[#e68a00] uppercase tracking-widest">{section.title}</div>
                      {section.links.map((link: any) => (
                        <Link key={link.key} href={link.href} className="flex items-center gap-3 text-sm font-bold text-gray-600 py-1" onClick={() => setOpen(false)}>
                          <span className="text-xl">{link.icon}</span>
                          {t.nav[link.key as keyof typeof t.nav]}
                        </Link>
                      ))}
                    </div>
                  ))
                ) : item.items ? (
                  item.items.map(subItem => (
                    <Link key={subItem.href} href={subItem.href} className="text-sm font-bold text-gray-600 py-1 flex items-center gap-3" onClick={() => setOpen(false)}>
                      <ChevronRight className="w-4 h-4 text-[#e68a00]" />
                      {t.nav[subItem.key as keyof typeof t.nav]}
                    </Link>
                  ))
                ) : (
                  <Link href={item.href!} className="text-sm font-bold text-gray-600 py-1" onClick={() => setOpen(false)}>
                    {t.nav[item.key as keyof typeof t.nav]}
                  </Link>
                )}
              </div>
            </div>
          ))}

          <div className="mt-auto space-y-6 pt-8 border-t border-gray-100">
            <div className="space-y-3">
              <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Langue</div>
              <div className="flex gap-4 flex-wrap">
                {availableLangs.map((l) => (
                  <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }} className={`text-3xl ${lang === l.code ? "grayscale-0" : "grayscale opacity-50"}`}>{l.flag}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <Link href="/login" className="w-full text-center py-4 rounded-2xl border-2 border-[#0d3d28] text-[#0d3d28] font-black text-sm" onClick={() => setOpen(false)}>Connexion</Link>
              <Link href="/register" className="w-full text-center py-4 rounded-2xl text-white font-black text-sm shadow-xl shadow-[#0d3d28]/20" style={{ background: "#0d3d28" }} onClick={() => setOpen(false)}>Commencer gratuitement</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


export function PublicFooter() {
  const { lang, setLang, availableLangs, t } = useI18n();
  
  const productLinks = [
    { labelKey: "fonctionnalites", href: "/fonctionnalites" },
    { labelKey: "tarifs", href: "/#pricing" },
    { labelKey: "security", href: "/security" },
    { labelKey: "developers", href: "/developpeurs" },
  ];

  const resourceLinks = [
    { labelKey: "how_it_works", href: "/how-it-works" },
    { labelKey: "academie", href: "/academie" },
    { labelKey: "mobile", href: "/mobile" },
    { labelKey: "gamification", href: "/gamification" },
  ];

  const companyLinks = [
    { labelKey: "about", href: "/about" },
    { label: "Contact", href: "/aide" },
    { label: "Support", href: "/aide" },
  ];

  return (
    <footer className="bg-[#0d3d28] text-white pt-24 pb-12 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e68a00] to-transparent opacity-30" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110">
                <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl leading-none tracking-tight text-white">Tchoua</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e68a00]">Solidarité Digitale</span>
              </div>
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed max-w-xs font-medium">
              L&apos;ERP des tontines africaines. Digitaliser la solidarité traditionnelle avec les outils de demain. Gratuit & Open Source.
            </p>
            <div className="flex items-center gap-4">
               {/* Social placeholders - Lucide icons would be better but keeping it clean */}
               <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                 <Globe className="w-4 h-4 text-gray-400" />
               </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#e68a00] mb-6">Produit</h4>
            <ul className="space-y-4">
              {productLinks.map((link) => (
                <li key={link.labelKey}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors font-bold">
                    {t.nav[link.labelKey as keyof typeof t.nav]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#e68a00] mb-6">Ressources</h4>
            <ul className="space-y-4">
              {resourceLinks.map((link) => (
                <li key={link.labelKey}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors font-bold">
                    {t.nav[link.labelKey as keyof typeof t.nav]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#e68a00] mb-6">Entreprise</h4>
            <ul className="space-y-4">
              {companyLinks.map((link) => (
                <li key={link.labelKey || link.label}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors font-bold">
                    {link.labelKey ? t.nav[link.labelKey as keyof typeof t.nav] : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#e68a00] mb-6 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Langues
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {availableLangs.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  title={l.name}
                  className={`text-2xl p-2 rounded-xl transition-all hover:bg-white/10 ${lang === l.code ? "bg-white/10 grayscale-0" : "grayscale opacity-40 hover:opacity-100"}`}
                >
                  {l.flag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider">
            © 2026 TCHOUA · OPEN SOURCE · MIT/APACHE 2.0
          </p>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Mentions Légales</Link>
            <Link href="#" className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Confidentialité</Link>
            <Link href="#" className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f3eb" }}>
      <PublicHeader />
      <main className="flex-1">
        {title && (
          <div className="max-w-7xl mx-auto px-6 pt-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
