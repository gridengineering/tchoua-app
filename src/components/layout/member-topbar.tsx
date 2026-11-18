"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, CheckCheck, ChevronDown, HelpCircle, LogOut, Menu, Search, Settings, ShieldCheck, User, Wallet } from "lucide-react";
import { KycBadge } from "@/components/kyc/kyc-badge";

const LABELS: Record<string, string> = {
  dashboard: "Tableau de bord", associations: "Associations", tontines: "Tontines",
  epargne: "Épargne", prets: "Prêts", solidarite: "Solidarité", sessions: "Sessions",
  membres: "Membres", marketplace: "Marketplace", evenements: "Événements", chat: "Chat",
  conseils: "Conseils IA", rapports: "Rapports", profil: "Profil", parametres: "Paramètres",
  wallet: "Portefeuille", calendrier: "Calendrier", gamification: "Gamification",
  academie: "Académie", activities: "Activités", aides: "Aides", reunions: "Réunions",
  dividendes: "Dividendes", members: "Membres", admin: "Console admin",
  comptes: "Comptes & versements", parcours: "Mon parcours", historique: "Historique",
  interets: "Intérêts", kyc: "Conformité KYC", modifier: "Configuration",
  configuration: "Paramètres ARP", arp: "Moteur ARP", pending: "Approbations",
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [kyc, setKyc] = useState<{ level: number; status: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [associations, setAssociations] = useState<Array<{ id: string; name: string }>>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/kyc", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setKyc({ level: data.level, status: data.status }); })
      .catch(() => {});
    fetch("/api/wallet", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const bal = data?.wallet?.balance ?? data?.balance;
        if (typeof bal === "number") setWalletBalance(bal);
      })
      .catch(() => {});
    fetch("/api/notifications?limit=10", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifications) setNotifications(data.notifications);
        if (typeof data?.unreadCount === "number") setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
    fetch("/api/associations", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.associations) setAssociations(data.associations); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setOpen(false);
    setNotifOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const assocMatch = pathname.match(/^\/associations\/([^/]+)/);
  const currentAssocId = assocMatch?.[1];

  const searchEntries = useMemo(() => {
    const base = [
      { label: "Accueil — Tableau de bord", href: "/dashboard", tag: "Global" },
      { label: "Mon parcours", href: "/parcours", tag: "Global" },
      { label: "Mes associations", href: "/associations", tag: "Global" },
      { label: "Mon portefeuille (Wallet)", href: "/dashboard/wallet", tag: "Finances" },
      { label: "Calendrier", href: "/dashboard/calendrier", tag: "Agenda" },
      { label: "Vérification KYC", href: "/kyc", tag: "Compte" },
      { label: "Tontines", href: "/tontines", tag: "Finances" },
      { label: "Épargne", href: "/epargne", tag: "Finances" },
      { label: "Prêts", href: "/prets", tag: "Finances" },
      { label: "Solidarité", href: "/solidarite", tag: "Finances" },
      { label: "Membres & Parrainage", href: "/membres", tag: "Communauté" },
      ...associations.map((a) => ({ label: `Association : ${a.name}`, href: `/associations/${a.id}`, tag: "Association" })),
      ...(currentAssocId
        ? [
            { label: "Comptes & versements (association)", href: `/associations/${currentAssocId}/comptes`, tag: "Association" },
            { label: "Activités (association)", href: `/associations/${currentAssocId}/activities`, tag: "Association" },
            { label: "Réunions & sessions (association)", href: `/associations/${currentAssocId}/reunions`, tag: "Association" },
            { label: "Rapports, Historique, Intérêts & Dividendes", href: `/associations/${currentAssocId}/rapports`, tag: "Finances" },
            { label: "Membres & invitations (association)", href: `/associations/${currentAssocId}/members`, tag: "Association" },
          ]
        : []),
    ];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base.slice(0, 10);
    return base.filter((e) => e.label.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q)).slice(0, 12);
  }, [associations, currentAssocId, searchQuery]);

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
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 truncate text-xs m-muted">
            <Link href="/dashboard" className="font-medium m-hover-text">Mon espace</Link>
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex min-w-0 items-center gap-1.5">
                <span>/</span>
                {i === crumbs.length - 1 ? (
                  <span className="truncate font-semibold m-text">{c.label}</span>
                ) : (
                  <Link href={c.href} className="truncate m-hover-text">{c.label}</Link>
                )}
              </span>
            ))}
          </nav>
          {title ? <h1 className="truncate text-sm font-semibold m-text">{title}</h1> : null}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-lg border m-border m-soft px-2.5 py-1.5 text-xs m-muted hover:m-text sm:flex"
            title="Recherche rapide (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Rechercher…</span>
            <kbd className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Ctrl+K</kbd>
          </button>
          <Link
            href="/dashboard/wallet"
            className="hidden items-center gap-1.5 rounded-full border m-border m-soft px-3 py-1.5 text-xs font-bold m-text hover:brightness-95 sm:flex"
            title="Mon portefeuille personnel"
          >
            <Wallet className="h-3.5 w-3.5 m-accent-text" />
            <span>{walletBalance !== null ? `${walletBalance.toLocaleString("fr-FR")} FCFA` : "Portefeuille"}</span>
          </Link>
          {currentAssocId ? (
            <Link href={`/associations/${currentAssocId}/comptes`}
              className="hidden items-center gap-1.5 rounded-lg m-accent-bg px-3 py-2 text-xs font-semibold text-white hover:brightness-110 md:flex">
              <Wallet className="h-3.5 w-3.5" /> Cotiser / Verser
            </Link>
          ) : (
            <Link href="/associations"
              className="hidden items-center gap-1.5 rounded-lg m-accent-bg px-3 py-2 text-xs font-semibold text-white hover:brightness-110 md:flex">
              Mes associations
            </Link>
          )}
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
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-expanded={notifOpen}
              aria-label="Notifications"
              className="relative rounded-lg p-2 m-muted m-hover"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border m-border bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Tout lire
                    </button>
                  )}
                </div>
                <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto text-xs">
                  {notifications.length === 0 ? (
                    <p className="py-3 text-center text-slate-400">Aucune notification récente.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-lg border p-2 ${n.isRead ? "border-slate-100 bg-white text-slate-600" : "border-emerald-200 bg-emerald-50/60 text-slate-900"}`}
                      >
                        <div className="font-semibold">{n.title}</div>
                        <div className="mt-0.5 text-[11px] opacity-80">{n.message}</div>
                      </div>
                    ))
                  )}
                  {kyc && kyc.level < 1 && (
                    <Link href="/kyc" className="block rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 hover:bg-amber-100">
                      Vérification KYC incomplète — Finaliser mon profil
                    </Link>
                  )}
                  <Link href="/parcours" className="block rounded-lg border border-slate-100 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100">
                    Voir mon parcours & prochaines étapes
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 m-hover">
              <span className="flex h-8 w-8 items-center justify-center rounded-full m-accent-bg text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() ?? "M"}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium m-text md:block">{user?.name}</span>
              {kyc ? <KycBadge level={kyc.level} status={kyc.status} /> : null}
              <ChevronDown className="hidden h-3.5 w-3.5 m-muted md:block" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border m-border bg-white shadow-xl">
                <div className="border-b m-border px-4 py-3">
                  <div className="truncate text-sm font-semibold m-text">{user?.name}</div>
                  <div className="truncate text-xs m-muted">{user?.email}</div>
                  {kyc ? <div className="mt-1.5"><KycBadge level={kyc.level} status={kyc.status} /></div> : null}
                </div>
                <Link href="/profil" className="flex items-center gap-2 px-4 py-2.5 text-sm m-hover"><User className="h-4 w-4" /> Mon profil</Link>
                <Link href="/kyc" className="flex items-center gap-2 px-4 py-2.5 text-sm m-hover"><ShieldCheck className="h-4 w-4" /> Vérification KYC</Link>
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

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-20 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Aller à une association, un module, une page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchEntries[0]) {
                    router.push(searchEntries[0].href);
                    setSearchOpen(false);
                  }
                }}
                className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Échap</button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {searchEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Aucun résultat.</p>
              ) : (
                searchEntries.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => { router.push(item.href); setSearchOpen(false); }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-100"
                  >
                    <span>{item.label}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{item.tag}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
