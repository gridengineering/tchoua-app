"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Plus, Settings, ShieldCheck, User } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Tableau de bord", associations: "Associations", tontines: "Tontines",
  epargne: "Épargne", prets: "Prêts", solidarite: "Solidarité", sessions: "Sessions",
  membres: "Membres", marketplace: "Marketplace", evenements: "Événements", chat: "Chat",
  conseils: "Conseils IA", rapports: "Rapports", profil: "Profil", parametres: "Paramètres",
  wallet: "Portefeuille", calendrier: "Calendrier", gamification: "Gamification",
  academie: "Académie", activities: "Activités", aides: "Aides", reunions: "Réunions",
  dividendes: "Dividendes", members: "Membres", admin: "Console admin",
};

export function MemberTopbar({
  title, onMenuClick, user, onHelpClick, helpOpen,
}: {
  title?: string;
  onMenuClick: () => void;
  user?: { name?: string | null; email?: string | null; systemRoleId?: string | null };
  onHelpClick?: () => void;
  helpOpen?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = LABELS[seg] ?? (seg.length > 16 ? "Détail" : decodeURIComponent(seg));
    return { href, label };
  });

  return (
    <header className="sticky top-0 z-30 border-b m-border m-glass backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button onClick={onMenuClick} className="rounded-lg p-2 m-muted m-hover lg:hidden" aria-label="Ouvrir le menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          {title ? (
            <h1 className="truncate text-base font-semibold m-text">{title}</h1>
          ) : (
            <nav className="flex items-center gap-1.5 truncate text-sm">
              <Link href="/dashboard" className="font-medium m-muted m-hover-text">Accueil</Link>
              {crumbs.slice(0, 4).map((c, i) => (
                <span key={c.href} className="flex min-w-0 items-center gap-1.5">
                  <span className="m-muted">/</span>
                  {i === crumbs.length - 1 ? (
                    <span className="truncate font-semibold m-text">{c.label}</span>
                  ) : (
                    <Link href={c.href} className="truncate m-muted m-hover-text">{c.label}</Link>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link href="/dashboard/associations/create"
            className="hidden items-center gap-1.5 rounded-lg m-accent-bg px-3 py-2 text-sm font-semibold text-white hover:brightness-110 sm:flex">
            <Plus className="h-4 w-4" /> Nouvelle association
          </Link>
          <button
            onClick={onHelpClick}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${helpOpen ? "m-accent-bg text-white" : "m-muted m-hover"}`}
            aria-label="Afficher l’aide contextuelle"
            aria-pressed={helpOpen}
            title="Aide sur ce formulaire"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Aide</span>
          </button>
          <Link href="/profil" className="rounded-lg p-2 m-muted m-hover" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Link>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 m-hover">
              <span className="flex h-8 w-8 items-center justify-center rounded-full m-accent-bg text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() ?? "M"}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium m-text md:block">{user?.name}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 m-muted md:block" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border m-border bg-white shadow-xl">
                <div className="border-b m-border px-4 py-3">
                  <div className="truncate text-sm font-semibold m-text">{user?.name}</div>
                  <div className="truncate text-xs m-muted">{user?.email}</div>
                </div>
                <Link href="/profil" className="flex items-center gap-2 px-4 py-2.5 text-sm m-hover"><User className="h-4 w-4" /> Mon profil</Link>
                <Link href="/parametres" className="flex items-center gap-2 px-4 py-2.5 text-sm m-hover"><Settings className="h-4 w-4" /> Paramètres</Link>
                {user?.systemRoleId && (
                  <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"><ShieldCheck className="h-4 w-4" /> Console admin</Link>
                )}
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 border-t m-border px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
