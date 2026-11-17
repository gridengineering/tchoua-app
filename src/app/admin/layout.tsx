"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Activity, ArrowLeftRight, Bell, Boxes, Building2, ChevronLeft, ChevronRight,
  FileText, History, LayoutDashboard, Landmark, LogOut, Menu, PanelLeftClose,
  PanelLeftOpen, Search, Settings, ShieldCheck, Sliders, Users, Wallet, X,
} from "lucide-react";

type NavItem = { name: string; href: string; icon: any; exact?: boolean; roles?: string[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Pilotage & Contrôle",
    items: [
      { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Audit & Journaux",
    items: [
      { name: "Audit financier", href: "/admin/finance", icon: Landmark, roles: ["SUPER_ADMIN", "ADMIN", "AUDITOR", "FINANCE"] },
      { name: "Historique complet", href: "/admin/historique", icon: History, roles: ["SUPER_ADMIN", "ADMIN", "AUDITOR", "FINANCE"] },
      { name: "Journaux système", href: "/admin/audit", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN", "AUDITOR"] },
    ],
  },
  {
    label: "Écosystème & ARP",
    items: [
      { name: "Associations", href: "/admin/associations", icon: Building2 },
      { name: "Référentiel ARP", href: "/admin/arp", icon: Boxes, roles: ["SUPER_ADMIN", "ADMIN"] },
      { name: "Modèles", href: "/admin/templates", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Conformité",
    items: [
      { name: "Conformité KYC", href: "/admin/kyc", icon: ShieldCheck, roles: ["SUPER_ADMIN", "ADMIN", "COMPLIANCE", "AUDITOR"] },
      { name: "Confiance & Scores", href: "/admin/confiance", icon: ShieldCheck, roles: ["SUPER_ADMIN", "ADMIN", "COMPLIANCE", "AUDITOR"] },
      { name: "Utilisateurs système", href: "/admin/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
      { name: "Rôles & permissions", href: "/admin/roles", icon: ShieldCheck, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Wallets & Frais",
    items: [
      { name: "Supervision Wallets", href: "/admin/wallets", icon: Wallet, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "AUDITOR"] },
      { name: "Frais & Plafonds", href: "/admin/settings/wallet", icon: Sliders, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "Gouvernance & Paramètres",
    items: [
      { name: "Paramètres plateforme", href: "/admin/settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN"] },
      { name: "Gouvernance & Mail", href: "/admin/gouvernance", icon: ShieldCheck, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
];

const CRUMB_LABELS: Record<string, string> = {
  admin: "Administration",
  users: "Utilisateurs",
  roles: "Rôles",
  associations: "Associations",
  confiance: "Confiance & conformité",
  historique: "Historique complet",
  kyc: "Conformité KYC",
  arp: "Référentiel ARP",
  templates: "Modèles",
  wallets: "Wallets",
  wallet: "Frais & Plafonds Wallet",
  gouvernance: "Gouvernance & Mail",
  finance: "Audit financier",
  notifications: "Notifications",
  audit: "Journaux",
  settings: "Paramètres",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem("tchoua-admin-collapsed") === "1");
    fetch("/api/notifications?unreadOnly=true&limit=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (typeof d?.unreadCount === "number") setUnreadCount(d.unreadCount); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !user?.systemRoleId) router.push("/403");
  }, [mounted, status, user, router]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  const roleKey = String(user?.systemRoleName || "").trim().toUpperCase().replace(/[ _-]+/g, " ");
  const isFullAdmin = !roleKey || roleKey.includes("ADMIN") || roleKey === "SUPER ADMIN" || roleKey === "PRINCIPAL";
  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles || isFullAdmin) return true;
        return item.roles.includes(roleKey);
      }),
    })).filter((g) => g.items.length > 0);
  }, [roleKey, isFullAdmin]);

  const adminSearchEntries = useMemo(() => {
    const all = [
      { label: "Tableau de bord", href: "/admin", tag: "Pilotage" },
      { label: "Audit financier", href: "/admin/finance", tag: "Pilotage" },
      { label: "Historique complet", href: "/admin/historique", tag: "Pilotage" },
      { label: "Journaux système", href: "/admin/audit", tag: "Pilotage" },
      { label: "Associations", href: "/admin/associations", tag: "Écosystème" },
      { label: "Référentiel ARP", href: "/admin/arp", tag: "Écosystème" },
      { label: "Modèles associatifs", href: "/admin/templates", tag: "Écosystème" },
      { label: "Conformité KYC", href: "/admin/kyc", tag: "Conformité" },
      { label: "Confiance & Scores", href: "/admin/confiance", tag: "Conformité" },
      { label: "Utilisateurs système", href: "/admin/users", tag: "Accès" },
      { label: "Rôles & permissions", href: "/admin/roles", tag: "Accès" },
      { label: "Supervision Wallets", href: "/admin/wallets", tag: "Finances" },
      { label: "Frais & Plafonds Wallet", href: "/admin/settings/wallet", tag: "Finances" },
      { label: "Notifications", href: "/admin/notifications", tag: "Système" },
      { label: "Gouvernance & Mail", href: "/admin/gouvernance", tag: "Système" },
      { label: "Paramètres plateforme", href: "/admin/settings", tag: "Système" },
    ];
    const q = searchQuery.trim().toLowerCase();
    return q ? all.filter((i) => i.label.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q)) : all.slice(0, 10);
  }, [searchQuery]);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => ({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: CRUMB_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
      last: index === segments.length - 1,
    }));
  }, [pathname]);

  const toggleCollapsed = () => {
    const value = !collapsed;
    setCollapsed(value);
    localStorage.setItem("tchoua-admin-collapsed", value ? "1" : "0");
  };

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Chargement de la console</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && !user?.systemRoleId) return null;

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    if (item.href === "/admin/settings") {
      return pathname === "/admin/settings" || (pathname.startsWith("/admin/settings/") && !pathname.startsWith("/admin/settings/wallet"));
    }
    if (item.href === "/admin/settings/wallet") return pathname.startsWith("/admin/settings/wallet");
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const SidebarContent = (
    <>
      <div className={`flex h-16 items-center gap-3 border-b border-white/5 px-4 ${collapsed ? "justify-center" : ""}`}>
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white">
            <img src="/logo.png" alt="Tchoua" className="h-6 w-6 object-contain" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-white">Tchoua</span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Console</span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="ml-auto hidden rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:block"
            aria-label="Réduire le menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav aria-label="Navigation administration" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.label}</p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-indigo-500/15 text-white ring-1 ring-inset ring-indigo-400/30"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-indigo-300" : "text-slate-400"}`} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/5 p-3">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/10 ${collapsed ? "justify-center" : ""}`}
          title="Espace membre"
        >
          <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Espace membre</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 ${collapsed ? "justify-center" : ""}`}
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-slate-950 transition-all duration-200 lg:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {SidebarContent}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm lg:flex"
            aria-label="Déplier le menu"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        )}
      </aside>

      <div className={`flex min-h-screen flex-col transition-all duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="hidden items-center gap-1.5 text-sm sm:flex" aria-label="Fil d'Ariane">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                {crumb.last ? (
                  <span className="font-semibold text-slate-900">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-slate-500 hover:text-slate-900">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 sm:flex"
              title="Recherche rapide (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Rechercher…</span>
              <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Ctrl+K</kbd>
            </button>
            <span className="hidden items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" /> Mode administration
            </span>
            <Link
              href="/admin/notifications"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-2">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold leading-none text-slate-900">{user?.name}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {user?.systemRoleName ?? "Administrateur"}
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-slate-200 px-6 py-3 text-xs text-slate-400">
          Console Tchoua · {new Date().getFullYear()} — Toutes les actions sensibles sont auditées.
        </footer>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-950">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-20 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Aller à un module d'administration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && adminSearchEntries[0]) {
                    router.push(adminSearchEntries[0].href);
                    setSearchOpen(false);
                  }
                }}
                className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Échap</button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {adminSearchEntries.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => { router.push(item.href); setSearchOpen(false); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-100"
                >
                  <span>{item.label}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{item.tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
