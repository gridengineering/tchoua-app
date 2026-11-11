"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bell, Building2, Calendar, Check, ChevronDown, GraduationCap, Heart,
  Landmark, LayoutDashboard, LogOut, Menu, MessageCircle,
  PiggyBank, RotateCcw, Settings, ShieldCheck, ShoppingBag,
  Trophy, User, Users, Wallet, X, Bot, PartyPopper, FileText,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: any; feature?: string };

const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/tontines", label: "Tontines", icon: PiggyBank },
  { href: "/epargne", label: "Épargne", icon: Landmark },
  { href: "/prets", label: "Prêts", icon: Wallet },
  { href: "/solidarite", label: "Solidarité", icon: Heart },
  { href: "/sessions", label: "Sessions", icon: RotateCcw },
  { href: "/membres", label: "Membres", icon: Users },
  { href: "/rapports", label: "Rapports", icon: FileText },
];

const MORE_NAV: NavItem[] = [
  { href: "/dashboard/calendrier", label: "Calendrier", icon: Calendar },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, feature: "marketplace" },
  { href: "/evenements", label: "Événements", icon: PartyPopper, feature: "events" },
  { href: "/chat", label: "Chat de groupe", icon: MessageCircle, feature: "chat" },
  { href: "/conseils", label: "Conseils IA", icon: Bot, feature: "ai" },
  { href: "/dashboard/gamification", label: "Gamification", icon: Trophy, feature: "gamification" },
  { href: "/academie", label: "Académie", icon: GraduationCap, feature: "academy" },
  { href: "/profil", label: "Mon profil", icon: User },
];

type MyAssociation = { id: string; name: string; color?: string; myRole?: string };

export function MemberTopNav({ title }: { title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const [associations, setAssociations] = useState<MyAssociation[]>([]);
  const [features, setFeatures] = useState<Record<string, boolean> | null>(null);
  const [assocOpen, setAssocOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const assocMatch = pathname.match(/^\/associations\/([^/]+)/);
  const currentAssocId = assocMatch?.[1];
  const currentAssoc = associations.find((a) => a.id === currentAssocId);

  useEffect(() => {
    fetch("/api/associations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAssociations(data?.associations ?? []))
      .catch(() => {});
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setFeatures(data?.settings?.features ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setAssocOpen(false);
    setMoreOpen(false);
    setUserOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const visibleMore = useMemo(
    () => MORE_NAV.filter((item) => !features || !item.feature || features[item.feature] !== false),
    [features]
  );

  const resolveHref = (href: string) =>
    href === "/chat" && currentAssocId ? `/associations/${currentAssocId}?tab=chat` : href;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);

  const go = (href: string) => router.push(href);

  const navLink = (item: NavItem, compact = false) => (
    <Link
      key={item.href}
      href={resolveHref(item.href)}
      className={`relative flex items-center gap-2 whitespace-nowrap px-1 text-sm font-medium transition-colors ${
        compact ? "py-2.5" : "py-3"
      } ${isActive(item.href) ? "text-forest" : "text-slate-500 hover:text-slate-900"}`}
    >
      {compact && <item.icon className="h-4 w-4" />}
      {item.label}
      {isActive(item.href) && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-forest" />}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {/* Ligne 1 */}
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest">
            <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
          </span>
          <span className="hidden text-base font-bold tracking-tight text-forest sm:block">Tchoua</span>
        </Link>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <div className="relative">
          <button
            onClick={() => setAssocOpen((v) => !v)}
            className="flex max-w-[220px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Building2 className="h-4 w-4 text-forest" />
            <span className="truncate">{currentAssoc?.name ?? "Toutes mes associations"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          {assocOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <button
                onClick={() => { setAssocOpen(false); go("/dashboard"); }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                <span>Toutes mes associations</span>
                {!currentAssocId && <Check className="h-4 w-4 text-forest" />}
              </button>
              <div className="max-h-64 overflow-y-auto border-t border-slate-100">
                {associations.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setAssocOpen(false); go(`/associations/${a.id}`); }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="truncate">{a.name}</span>
                    {currentAssocId === a.id && <Check className="h-4 w-4 text-forest" />}
                  </button>
                ))}
                {associations.length === 0 && (
                  <p className="px-4 py-3 text-xs text-slate-400">Aucune association</p>
                )}
              </div>
              <Link
                href="/dashboard/associations/create"
                className="block border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-forest hover:bg-forest/5"
              >
                + Créer une association
              </Link>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link href="/dashboard/wallet" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 sm:flex">
            <Wallet className="h-4 w-4" /> <span className="hidden md:inline">Wallet</span>
          </Link>
          <Link href="/profil" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Link>
          <div className="relative">
            <button
              onClick={() => setUserOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() ?? "M"}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 md:block">
                {user?.name}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="truncate text-sm font-semibold text-slate-900">{user?.name}</div>
                  <div className="truncate text-xs text-slate-500">{user?.email}</div>
                </div>
                <Link href="/profil" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                  <User className="h-4 w-4" /> Mon profil
                </Link>
                <Link href="/parametres" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                  <Settings className="h-4 w-4" /> Paramètres
                </Link>
                {user?.systemRoleId && (
                  <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                    <ShieldCheck className="h-4 w-4" /> Console admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ligne 2 — navigation épurée */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="hidden items-center gap-6 overflow-x-auto lg:flex">
          {PRIMARY_NAV.map((item) => navLink(item))}
          <div className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex items-center gap-1 whitespace-nowrap py-3 text-sm font-medium ${
                MORE_NAV.some((i) => isActive(i.href)) ? "text-forest" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Plus <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-50 mt-0 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {visibleMore.map((item) => (
                  <Link
                    key={item.href}
                    href={resolveHref(item.href)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <item.icon className="h-4 w-4 text-slate-400" /> {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-80 flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <span className="flex items-center gap-2 font-bold text-forest">
                <img src="/logo.png" alt="" className="h-5 w-5" /> Tchoua
              </span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {[...PRIMARY_NAV, ...visibleMore].map((item) => (
                <Link
                  key={item.href}
                  href={resolveHref(item.href)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                    isActive(item.href) ? "bg-forest/5 font-semibold text-forest" : "text-slate-600"
                  }`}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
              <Link href="/dashboard/wallet" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600">
                <Wallet className="h-4 w-4" /> Wallet
              </Link>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 text-sm text-red-600"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </aside>
        </div>
      )}

      {/* Titre contextuel */}
      {title && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
            <h1 className="truncate text-sm font-semibold text-slate-600">{title}</h1>
          </div>
        </div>
      )}
    </header>
  );
}
