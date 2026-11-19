"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Download, ExternalLink, Info, LayoutGrid, Loader2,
  Puzzle, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, UserRound,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { APP_SCOPE_DESCRIPTIONS, type AppScope } from "@/lib/apps";

type AppRow = {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  developerName: string;
  repositoryUrl?: string | null;
  homepageUrl?: string | null;
  iconUrl?: string | null;
  scope: AppScope;
  category: string;
  version: string;
  installCount: number;
  permissions: string[];
  installed: boolean;
  installation?: { id: string; version: string; status: string } | null;
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10";
const scopeIcon: Record<AppScope, any> = { ADMIN: ShieldCheck, MEMBER: UserRound, ASSOCIATION: LayoutGrid };

export default function AppsMarketplacePage() {
  const { data: session } = useSession();
  const isAdmin = Boolean((session?.user as any)?.systemRoleId);
  const Shell = session ? DashboardLayout : PublicLayout;
  const [scope, setScope] = useState<AppScope>("MEMBER");
  const [associationId, setAssociationId] = useState("");
  const [associations, setAssociations] = useState<Array<{ id: string; name: string; myRole?: string }>>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [installedOnly, setInstalledOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedScope = params.get("scope");
    if (requestedScope === "ADMIN" || requestedScope === "MEMBER" || requestedScope === "ASSOCIATION") {
      setScope(requestedScope);
    }
    const requestedAssociation = params.get("associationId");
    if (requestedAssociation) setAssociationId(requestedAssociation);
    fetch("/api/associations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.associations ?? []).filter((row: any) => row.myStatus !== "LEFT");
        setAssociations(rows);
        setAssociationId((current) => current || rows[0]?.id || "");
      })
      .catch(() => null);
  }, []);

  const load = async () => {
    if (scope === "ASSOCIATION" && !associationId) {
      setApps([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ scope });
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (installedOnly) params.set("installed", "true");
      if (scope === "ASSOCIATION") params.set("associationId", associationId);
      const res = await fetch(`/api/apps?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible.");
      setApps(data.apps ?? []);
      setCategories(data.categories ?? []);
    } catch (err: any) {
      setError(err?.message || "Chargement impossible.");
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, associationId, q, category, installedOnly]);

  const install = async (app: AppRow) => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent("/apps")}`;
      return;
    }
    setBusy(app.slug);
    setError(null);
    try {
      const res = await fetch(`/api/apps/${app.slug}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scope === "ASSOCIATION" ? { associationId } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Installation impossible.");
      setNotice(app.installed ? `${app.name} a été mis à jour.` : `${app.name} est installée.`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Installation impossible.");
    } finally {
      setBusy(null);
    }
  };

  const uninstall = async (app: AppRow) => {
    if (!window.confirm(`Désinstaller ${app.name} ?`)) return;
    setBusy(app.slug);
    setError(null);
    try {
      const res = await fetch(`/api/apps/${app.slug}/install${scope === "ASSOCIATION" ? `?associationId=${encodeURIComponent(associationId)}` : ""}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Désinstallation impossible.");
      setNotice(`${app.name} a été désinstallée.`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Désinstallation impossible.");
    } finally {
      setBusy(null);
    }
  };

  const openApp = (app: AppRow) => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent("/apps")}`;
      return;
    }
    const suffix = scope === "ASSOCIATION" ? `?associationId=${encodeURIComponent(associationId)}` : "";
    window.location.href = `/apps/launch/${app.slug}${suffix}`;
  };

  const tabs = useMemo(() => [
    { id: "MEMBER" as AppScope, label: "Espace membre", visible: true },
    { id: "ASSOCIATION" as AppScope, label: "Espace association", visible: associations.length > 0 },
    { id: "ADMIN" as AppScope, label: "Administration", visible: isAdmin },
  ].filter((tab) => tab.visible), [associations.length, isAdmin]);

  const currentScope = tabs.some((tab) => tab.id === scope) ? scope : "MEMBER";

  return (
    <Shell title="Apps marketplace">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a47718]">Écosystème Tchoua</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Apps marketplace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Installez des extensions pour votre espace membre, votre association ou l'administration. Chaque app respecte un périmètre explicite et peut être mise à jour ou désinstallée à tout moment.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/apps/developers" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Puzzle className="h-4 w-4 text-[#0d3d28]" /> Guide développeur
            </Link>
            <Button onClick={() => setInstalledOnly((value) => !value)} variant={installedOnly ? "default" : "outline"}>
              <Download className="h-4 w-4" /> {installedOnly ? "Toutes les apps" : "Mes apps installées"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5">
          {tabs.map((tab) => {
            const Icon = scopeIcon[tab.id];
            return (
              <button key={tab.id} onClick={() => { setScope(tab.id); setInstalledOnly(false); setCategory(""); }} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${currentScope === tab.id ? "bg-[#0d3d28] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Rechercher une app, une catégorie, un développeur…" className={`${inputClass} pl-9`} />
            </div>
            {currentScope === "ASSOCIATION" ? (
              <select value={associationId} onChange={(event) => setAssociationId(event.target.value)} className={`${inputClass} lg:w-64`}>
                <option value="">Choisir une association…</option>
                {associations.map((association) => <option key={association.id} value={association.id}>{association.name}</option>)}
              </select>
            ) : null}
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={`${inputClass} lg:w-52`}>
              <option value="">Toutes les catégories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" /> Actualiser</button>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#f8f7f3] px-3 py-2.5 text-[11px] leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0d3d28]" />
            {APP_SCOPE_DESCRIPTIONS[currentScope]}
            {currentScope === "ASSOCIATION" ? " Seuls le fondateur et les membres du bureau peuvent installer." : ""}
          </div>
        </div>

        {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
            <Puzzle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">{installedOnly ? "Aucune app installée dans cet espace." : "Aucune app publiée pour cet espace."}</p>
            <p className="mt-1 text-xs text-slate-400">{currentScope === "ADMIN" ? "Les apps administratives sont réservées aux administrateurs." : currentScope === "ASSOCIATION" ? "Choisissez une association dont vous êtes membre du bureau." : "Les développeurs peuvent soumettre de nouvelles apps depuis le guide développeur."}</p>
            {currentScope === "MEMBER" ? <Link href="/apps/developers" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0d3d28] hover:underline">Découvrir le guide développeur <ExternalLink className="h-3 w-3" /></Link> : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => {
              const Icon = scopeIcon[app.scope];
              return (
                <div key={app.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0d3d28]/25 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ef] text-2xl">{app.iconUrl ? <img src={app.iconUrl} alt="" className="h-9 w-9 rounded-xl object-cover" /> : <Icon className="h-6 w-6 text-[#0d3d28]" />}</div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{app.category}</span>
                  </div>
                  <h2 className="mt-3 text-base font-black text-slate-900">{app.name}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{app.tagline || app.description || "Une extension pour votre espace Tchoua."}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{app.permissions.slice(0, 3).map((permission) => <span key={permission} className="rounded-md bg-[#f6f4ee] px-2 py-1 text-[10px] font-semibold text-[#7a6a45]">{permission}</span>)}</div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <div><p className="text-[11px] font-semibold text-slate-600">{app.developerName}</p><p className="text-[10px] text-slate-400">v{app.version} · {app.installCount} install.</p></div>
                    <div className="flex items-center gap-1.5">
                      {app.repositoryUrl ? <a href={app.repositoryUrl} target="_blank" rel="noreferrer" title="Dépôt GitHub" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" /></a> : null}
                      <Link href={`/apps/${app.slug}/info`} title="Info apps" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-[#0d3d28] hover:bg-[#f3f8f4]"><Info className="h-3.5 w-3.5" /> Info app</Link>
                      {app.installed ? (
                        <>
                          <button onClick={() => openApp(app)} className="rounded-lg bg-[#0d3d28] px-3 py-2 text-xs font-bold text-white hover:bg-[#0a3020]">Ouvrir</button>
                          <button onClick={() => install(app)} disabled={busy === app.slug} title="Mettre à jour" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50">{busy === app.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}</button>
                          <button onClick={() => uninstall(app)} disabled={busy === app.slug} title="Désinstaller" className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </>
                      ) : (
                        <button onClick={() => install(app)} disabled={busy === app.slug} className="rounded-lg bg-[#0d3d28] px-3 py-2 text-xs font-bold text-white hover:bg-[#0a3020] disabled:opacity-50">{busy === app.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Download className="mr-1 inline h-3.5 w-3.5" /> Installer</>}</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-2xl border border-[#dbe7dd] bg-[#f6fbf7] p-5 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d3d28]/10 text-[#0d3d28]"><Sparkles className="h-5 w-5" /></span><div><p className="text-sm font-bold text-slate-900">Construisez votre app</p><p className="mt-1 text-xs leading-5 text-slate-500">Le guide développeur décrit le manifest, l'authentification, le SDK de lancement et les templates de composants.</p></div></div>
          <Link href="/apps/developers" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0d3d28] hover:underline sm:mt-0">Ouvrir le guide <ExternalLink className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </Shell>
  );
}
