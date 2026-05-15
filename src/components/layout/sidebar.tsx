"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import {
  LayoutDashboard, Users, PiggyBank, RotateCcw, Landmark,
  Heart, BarChart3, Settings, LogOut, ChevronLeft, ChevronDown,
  MessageCircle, Calendar, Bot, Globe, FileText,
  Building2, UserCircle, ArrowLeftRight, Check, ShieldCheck, Plus,
  ShoppingBag, PartyPopper, Trophy, GraduationCap, Coins, Leaf
} from "lucide-react";

// ─── Structure du menu Membre (15 Modules complets) ─────────────────────────
const MEMBER_NAV = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Tableau de Bord" },
  { href: "/tontines",               icon: PiggyBank,       label: "Mes Tontines" },
  { href: "/epargne",                icon: Landmark,        label: "Épargne & Invest." },
  { href: "/prets",                  icon: Coins,           label: "Prêts & Crédit" },
  { href: "/solidarite",             icon: Heart,           label: "Solidarité" },
  { href: "/sessions",               icon: RotateCcw,       label: "Sessions & Tirages" },
  { href: "/dashboard/calendrier",   icon: Calendar,        label: "Calendrier" },
  { href: "/membres",                icon: Users,           label: "Membres" },
  { href: "/marketplace",            icon: ShoppingBag,     label: "Marketplace" },
  { href: "/evenements",             icon: PartyPopper,     label: "Événements" },
  { href: "/chat",                   icon: MessageCircle,   label: "Chat de Groupe" },
  { href: "/conseils",               icon: Bot,             label: "Conseils IA" },
  { href: "/rapports",               icon: BarChart3,       label: "Rapports" },
  { href: "/dashboard/gamification", icon: Trophy,          label: "Gamification" },
  { href: "/academie",               icon: GraduationCap,   label: "Académie" },
  { href: "/profil",                 icon: UserCircle,      label: "Mon Profil" },
];

type MyAssociation = { id: string; name: string; color?: string; myRole?: string };

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user?: { name?: string | null; email?: string | null; score?: number; level?: string; systemRoleId?: string | null; systemRoleName?: string | null };
}

export function Sidebar({ collapsed, onToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, availableLangs } = useI18n();

  const [myAssocs, setMyAssocs] = useState<MyAssociation[]>([]);
  const [selectedAssoc, setSelectedAssoc] = useState<MyAssociation | null>(null);
  const [assocDropOpen, setAssocDropOpen] = useState(false);

  const hasSystemRole = !!user?.systemRoleId;

  // Détection de l'association courante dans l'URL
  const assocMatch = pathname.match(/^\/associations\/([^/]+)(?:\/|$)/);
  const currentAssocId = assocMatch?.[1];

  useEffect(() => {
    fetch("/api/associations")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list: MyAssociation[] = (data?.associations ?? []).map((a: any) => ({
          id: a.id, name: a.name, color: a.color, myRole: a.myRole,
        }));
        setMyAssocs(list);
        if (currentAssocId) {
          const found = list.find(a => a.id === currentAssocId);
          if (found) setSelectedAssoc(found);
        }
      })
      .catch(() => {});
  }, [currentAssocId]);

  const handleSelectAssoc = (assoc: MyAssociation | null) => {
    setSelectedAssoc(assoc);
    setAssocDropOpen(false);
    if (assoc) {
      router.push(`/associations/${assoc.id}`);
    } else {
      router.push("/dashboard");
    }
  };

  // Navigation contextuelle association
  const assocNavItems = currentAssocId ? [
    { href: `/associations/${currentAssocId}`,              label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
    { href: `/associations/${currentAssocId}/activities?type=TONTINE`, label: "Tontines", icon: PiggyBank },
    { href: `/associations/${currentAssocId}/activities?type=SAVINGS`, label: "Épargne", icon: BarChart3 },
    { href: `/associations/${currentAssocId}/prets`,        label: "Prêts",          icon: Landmark },
    { href: `/associations/${currentAssocId}/aides`,        label: "Solidarité",     icon: Heart },
    { href: `/associations/${currentAssocId}/reunions`,     label: "Sessions",       icon: RotateCcw },
    { href: `/associations/${currentAssocId}/rapports`,     label: "Rapports",       icon: BarChart3 },
    { href: `/associations/${currentAssocId}?tab=members`,  label: "Membres",        icon: Users },
  ] : [];

  const inAssocContext = !!currentAssocId;

  return (
    <aside
      className={cn(
        "h-full flex flex-col transition-all duration-300 flex-shrink-0 relative bg-dark-bg border-r border-white/5",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* ── Logo + Toggle ────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center px-4 flex-shrink-0 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <Leaf className="w-6 h-6 text-gold shrink-0" />
          {!collapsed && (
            <span className="font-display text-lg font-bold text-white tracking-tight whitespace-nowrap">
              Tchoua
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="flex-shrink-0 transition-colors ml-auto p-1.5 rounded-lg text-cream/60 hover:text-white hover:bg-white/5"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* ── Sélecteur d'Association ─────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 py-3 relative border-b border-white/5">
          <button
            onClick={() => setAssocDropOpen(!assocDropOpen)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all bg-white/5 text-cream/80 hover:bg-white/10 hover:text-white"
            aria-expanded={assocDropOpen}
            aria-haspopup="menu"
          >
            <Building2 className="w-4 h-4 flex-shrink-0 text-gold" />
            <span className="flex-1 text-left truncate">
              {selectedAssoc ? selectedAssoc.name : "Toutes mes associations"}
            </span>
            <ChevronDown className={cn("w-4 h-4 flex-shrink-0 transition-transform text-cream/60", assocDropOpen && "rotate-180")} />
          </button>

          {/* Dropdown */}
          {assocDropOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl bg-dark-surface border border-white/10">
              {/* Option "Toutes" */}
              <button
                onClick={() => handleSelectAssoc(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-white/10 text-left",
                  !selectedAssoc ? "text-white" : "text-cream/80"
                )}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">Toutes mes associations</span>
                {!selectedAssoc && <Check className="w-3 h-3 text-gold" />}
              </button>

              {myAssocs.length > 0 && (
                <div className="border-t border-white/5">
                  {myAssocs.map(assoc => (
                    <button
                      key={assoc.id}
                      onClick={() => handleSelectAssoc(assoc)}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-white/10 text-left",
                        selectedAssoc?.id === assoc.id ? "text-white" : "text-cream/80"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: assoc.color || "#D4A843" }} />
                      <span className="flex-1 truncate">{assoc.name}</span>
                      {selectedAssoc?.id === assoc.id && <Check className="w-3 h-3 text-gold" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Créer une association */}
              <div className="border-t border-white/5">
                <Link
                  href="/associations/new"
                  onClick={() => setAssocDropOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-white/10 text-gold"
                >
                  <Plus className="w-4 h-4" />
                  Créer une association
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicateur association sélectionnée (mode collapsed) */}
      {collapsed && selectedAssoc && (
        <div className="px-2 py-2 border-b border-white/5">
          <div className="w-2 h-2 rounded-full mx-auto" style={{ background: selectedAssoc.color || "#D4A843" }} />
        </div>
      )}

      {/* ── Navigation principale ──────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {/* Bandeau retour en contexte association */}
        {inAssocContext && !collapsed && (
          <div className="px-2 mb-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-cream/60 hover:text-white hover:bg-white/5"
            >
              ← Toutes les associations
            </Link>
          </div>
        )}

        {/* Items de navigation */}
        {(inAssocContext ? assocNavItems : MEMBER_NAV.map(i => ({
          href: i.href,
          label: i.label,
          icon: i.icon,
          exact: i.href === "/dashboard",
        }))).map(({ href, label, icon: Icon, exact }) => {
          const cleanHref = href.split("?")[0];
          const active = exact
            ? pathname === cleanHref
            : pathname.startsWith(cleanHref) && cleanHref !== "/dashboard";

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-0.5 group",
                active
                  ? "bg-forest text-white"
                  : "text-cream/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors",
                active ? "text-white" : "group-hover:text-white")} />
              {!collapsed && <span className="truncate font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Pied de sidebar ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/5 p-2 space-y-1">
        {/* Bouton bascule Admin (seulement si systemRole présent) */}
        {hasSystemRole && (
          <Link
            href="/admin"
            title={collapsed ? "Console Admin" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-cream/60 hover:text-white hover:bg-white/5"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Console Admin</span>
            )}
          </Link>
        )}

        {/* Langue */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/60 hover:text-white hover:bg-white/5 transition-all">
          <Globe className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none cursor-pointer text-cream/80"
            >
              {availableLangs.map(l => (
                <option key={l.code} value={l.code} style={{ background: "#0F1A15" }}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          )}
          {collapsed && <span className="text-[10px] font-medium text-cream/60">{lang.toUpperCase()}</span>}
        </div>

        <Link href="/profil"
          title={collapsed ? "Mon Profil" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group text-cream/60 hover:text-white hover:bg-white/5"
        >
          <UserCircle className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Mon Profil</span>}
        </Link>

        <Link href="/parametres"
          title={collapsed ? "Paramètres" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group text-cream/60 hover:text-white hover:bg-white/5"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Paramètres</span>}
        </Link>

        {/* Toggle collapse (desktop only visual cue, actual toggle is on logo row) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/60 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          <ChevronLeft className={cn("w-4 h-4 flex-shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-sm font-medium">Réduire</span>}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Déconnexion" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full text-left group text-cream/60 hover:text-error hover:bg-error/10"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
