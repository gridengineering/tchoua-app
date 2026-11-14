"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, PiggyBank, RotateCcw, Landmark, Heart, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronDown, MessageCircle, Calendar, Bot,
  FileText, Building2, UserCircle, Check, ShieldCheck, Plus, ShoppingBag,
  PartyPopper, Trophy, GraduationCap, Coins, Wallet, X, ChevronRight, History, TrendingUp,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: any; feature?: string };
type Group = { title: string; items: NavItem[] };
type Assoc = { id: string; name: string; color?: string | null; myRole?: string };

const FEATURE_BY_HREF: Record<string, string> = {
  "/marketplace": "marketplace",
  "/academie": "academy",
  "/chat": "chat",
  "/conseils": "ai",
  "/dashboard/gamification": "gamification",
  "/evenements": "events",
};

const GLOBAL_GROUPS: Group[] = [
  {
    title: "Pilotage",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/associations", label: "Mes associations", icon: Building2 },
      { href: "/dashboard/calendrier", label: "Calendrier", icon: Calendar },
      { href: "/kyc", label: "Vérification KYC", icon: ShieldCheck },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/tontines", label: "Tontines", icon: PiggyBank },
      { href: "/epargne", label: "Épargne", icon: Landmark },
      { href: "/prets", label: "Prêts", icon: Coins },
      { href: "/solidarite", label: "Solidarité", icon: Heart },
      { href: "/sessions", label: "Sessions", icon: RotateCcw },
      { href: "/dashboard/wallet", label: "Portefeuille", icon: Wallet },
    ],
  },
  {
    title: "Communauté",
    items: [
      { href: "/membres", label: "Membres", icon: Users },
      { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, feature: "marketplace" },
      { href: "/evenements", label: "Événements", icon: PartyPopper, feature: "events" },
      { href: "/chat", label: "Chat de groupe", icon: MessageCircle, feature: "chat" },
    ],
  },
  {
    title: "Analyse & apprentissage",
    items: [
      { href: "/rapports", label: "Rapports", icon: BarChart3 },
      { href: "/conseils", label: "Conseils IA", icon: Bot, feature: "ai" },
      { href: "/dashboard/gamification", label: "Gamification", icon: Trophy, feature: "gamification" },
      { href: "/academie", label: "Académie", icon: GraduationCap, feature: "academy" },
    ],
  },
];

function AssociationNav({ id }: { id: string }) {
  const items: NavItem[] = [
    { href: `/associations/${id}`, label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: `/associations/${id}/activities`, label: "Activités", icon: PiggyBank },
    { href: `/associations/${id}/configuration`, label: "Configuration", icon: Settings },
    { href: `/associations/${id}/prets`, label: "Prêts", icon: Landmark },
    { href: `/associations/${id}/aides`, label: "Aides sociales", icon: Heart },
    { href: `/associations/${id}/reunions`, label: "Réunions & sessions", icon: RotateCcw },
    { href: `/associations/${id}/dividendes`, label: "Dividendes", icon: Coins },
    { href: `/associations/${id}/members`, label: "Membres", icon: Users },
    { href: `/associations/${id}/kyc`, label: "Conformité KYC", icon: ShieldCheck },
    { href: `/associations/${id}/rapports`, label: "Rapports", icon: FileText },
    { href: `/associations/${id}/historique`, label: "Historique", icon: History },
    { href: `/associations/${id}/interets`, label: "Intérêts", icon: TrendingUp },
    { href: `/associations/${id}/parametres`, label: "Paramètres", icon: Settings },
  ];
  const pathname = usePathname();
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const active = item.href === `/associations/${id}`
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarLink key={item.href} item={item} active={active} />
        );
      })}
    </div>
  );
}

function SidebarLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
        collapsed && "justify-center px-2",
        active ? "m-active font-semibold" : "m-muted m-hover m-hover-text"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active ? "m-accent-text" : "m-muted ")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full m-accent-bg" />}
    </Link>
  );
}

export function MemberSidebar({
  collapsed, onToggle, mobileOpen, onClose, user,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onClose: () => void;
  user?: { name?: string | null; email?: string | null; systemRoleId?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, availableLangs } = useI18n();

  const [associations, setAssociations] = useState<Assoc[]>([]);
  const [features, setFeatures] = useState<Record<string, boolean> | null>(null);
  const [assocOpen, setAssocOpen] = useState(false);

  const assocMatch = pathname.match(/^\/associations\/([^/]+)/);
  const currentAssocId = assocMatch?.[1];
  const currentAssoc = associations.find((a) => a.id === currentAssocId);

  useEffect(() => {
    fetch("/api/associations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAssociations(d?.associations ?? []))
      .catch(() => {});
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFeatures(d?.settings?.features ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => { setAssocOpen(false); }, [pathname]);

  const visibleGroups = GLOBAL_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.feature || !features || features[item.feature] !== false),
    }))
    .filter((group) => group.items.length > 0);

  const isGroupActive = (items: NavItem[]) =>
    items.some((item) => (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)));

  const content = (
    <div className="m-glass flex h-full flex-col border-r m-border">
      <div className={cn("flex h-16 flex-shrink-0 items-center border-b m-border", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg m-accent-bg">
            <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
          </span>
          {!collapsed && <span className="text-lg font-bold tracking-tight m-accent-text">Tchoua</span>}
        </Link>
        {!collapsed && (
          <button onClick={onToggle} className="ml-auto hidden rounded-lg p-1.5 m-muted m-hover m-hover-text lg:block" aria-label="Réduire le menu">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <button onClick={onClose} className="ml-auto rounded-lg p-1.5 m-muted m-hover lg:hidden" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
      </div>

      {collapsed && (
        <button onClick={onToggle} className="hidden justify-center border-b m-border py-2 m-muted m-hover lg:flex" aria-label="Déployer le menu">
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {!collapsed && (
        <div className="relative border-b m-border px-3 py-3">
          <button onClick={() => setAssocOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg border m-border m-soft px-3 py-2 text-left text-sm m-hover">
            <Building2 className="h-4 w-4 flex-shrink-0 m-accent-text" />
            <span className="flex-1 truncate m-text">{currentAssoc?.name ?? "Mes associations"}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 m-muted transition-transform", assocOpen && "rotate-180")} />
          </button>
          {assocOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-xl border m-border m-surface shadow-xl">
              <button onClick={() => { setAssocOpen(false); router.push("/dashboard"); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm m-text m-hover">
                <LayoutDashboard className="h-4 w-4" /> Mes associations
                {!currentAssocId && <Check className="ml-auto h-3.5 w-3.5 m-accent-text" />}
              </button>
              <div className="max-h-56 overflow-y-auto border-t border-slate-100">
                {associations.map((a) => (
                  <button key={a.id} onClick={() => { setAssocOpen(false); router.push(`/associations/${a.id}`); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm m-text m-hover">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: a.color || "#0d3d28" }} />
                    <span className="flex-1 truncate">{a.name}</span>
                    {currentAssocId === a.id && <Check className="h-3.5 w-3.5 m-accent-text" />}
                  </button>
                ))}
              </div>
              <Link href="/dashboard/associations/create" onClick={() => setAssocOpen(false)}
                className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm font-semibold m-accent-text m-hover-accent">
                <Plus className="h-4 w-4" /> Créer une association
              </Link>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {currentAssocId && !collapsed && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between px-3">
              <span className="text-[10px] font-bold uppercase tracking-widest m-muted">Association</span>
              <Link href="/dashboard" className="text-[10px] font-medium m-accent-text hover:underline">Quitter</Link>
            </div>
            <AssociationNav id={currentAssocId} />
          </div>
        )}

        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-3">
            {!collapsed && (
              <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest m-muted">{group.title}</div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard");
                return <SidebarLink key={item.href} item={item} active={active} collapsed={collapsed} />;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t m-border p-2">
        {user?.systemRoleId && (
          <SidebarLink item={{ href: "/admin", label: "Console admin", icon: ShieldCheck }} active={pathname.startsWith("/admin")} collapsed={collapsed} />
        )}
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm m-muted">
            <span className="flex h-7 w-7 items-center justify-center rounded-full m-accent-bg text-[11px] font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() ?? "M"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold m-text">{user?.name}</div>
              <div className="truncate text-[10px] m-muted">{user?.email}</div>
            </div>
          </div>
        )}
        {!collapsed && (
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            className="mt-1 w-full rounded-lg border m-border m-surface px-2 py-1.5 text-xs m-muted">
            {availableLangs.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        )}
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn("mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50", collapsed && "justify-center px-2")}
          title={collapsed ? "Déconnexion" : undefined}>
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && "Déconnexion"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r m-border transition-[width] duration-300 lg:block",
        collapsed ? "w-20" : "w-64"
      )}>
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
}
