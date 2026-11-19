"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Image as ImageIcon, Loader2, Puzzle, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";

type InfoApp = {
  app: {
    id: string;
    slug: string;
    name: string;
    tagline?: string | null;
    description?: string | null;
    scope: string;
    category: string;
    version: string;
    developerName: string;
    repositoryUrl?: string | null;
    iconUrl?: string | null;
  };
  descriptionHtml?: string | null;
  descriptionUrl?: string | null;
  screenshots?: string[];
};

const scopeLabel: Record<string, string> = {
  ADMIN: "Administration",
  MEMBER: "Espace membre",
  ASSOCIATION: "Espace association",
};

export default function AppInfoPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<InfoApp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${params.slug}/info`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || "App introuvable.");
        setData(payload);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "App introuvable."))
      .finally(() => setLoading(false));
  }, [params.slug]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/apps" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d3d28] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à Apps marketplace
        </Link>

        {loading ? (
          <div className="flex h-96 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#0d3d28]" /></div>
        ) : error || !data ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error || "App introuvable."}</div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-3xl border border-[#dbe7dd] bg-gradient-to-br from-[#f6fbf7] to-[#fbf8ef] p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                    {data.app.iconUrl ? <img src={data.app.iconUrl} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <Puzzle className="h-8 w-8 text-[#0d3d28]" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#0d3d28] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{scopeLabel[data.app.scope] ?? data.app.scope}</span>
                      <span className="text-[11px] font-semibold text-[#a47718]">{data.app.category}</span>
                      <span className="text-[11px] text-slate-400">v{data.app.version}</span>
                    </div>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{data.app.name}</h1>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{data.app.tagline || data.app.description || "Une extension de l'écosystème Tchoua."}</p>
                    <p className="mt-3 text-[11px] font-semibold text-slate-500">Par {data.app.developerName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.app.repositoryUrl ? <a href={data.app.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Dépôt <ExternalLink className="h-3.5 w-3.5" /></a> : null}
                  <Link href={`/apps?scope=${data.app.scope}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d3d28] px-3 py-2 text-xs font-bold text-white hover:bg-[#0a3020]">Installer l&apos;app</Link>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-wide text-[#a47718]">Fiche Info apps</p><h2 className="text-base font-black text-slate-900">Description du module</h2></div>
                  <ShieldCheck className="h-5 w-5 text-[#0d3d28]" />
                </div>
                {data.descriptionHtml ? (
                  <iframe title={`Description ${data.app.name}`} srcDoc={data.descriptionHtml} sandbox="allow-scripts allow-popups" className="h-[620px] w-full bg-white" />
                ) : data.descriptionUrl ? (
                  <iframe title={`Description ${data.app.name}`} src={data.descriptionUrl} sandbox="allow-scripts allow-popups" className="h-[620px] w-full bg-white" />
                ) : (
                  <div className="p-6 text-sm leading-6 text-slate-600 whitespace-pre-wrap">{data.app.description || "Le développeur n'a pas encore fourni de description HTML."}</div>
                )}
              </section>

              <aside className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#0d3d28]" /><h2 className="text-sm font-black text-slate-900">Captures d&apos;écran</h2></div>
                  {data.screenshots?.length ? (
                    <div className="mt-3 space-y-2">{data.screenshots.map((image) => <a key={image} href={image} target="_blank" rel="noreferrer"><img src={image} alt="" className="w-full rounded-xl border border-slate-100 object-cover hover:opacity-90" /></a>)}</div>
                  ) : <p className="mt-2 text-xs leading-5 text-slate-400">Aucune capture fournie pour le moment.</p>}
                </section>
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold text-amber-900">Développeur</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">Cette fiche est générée à partir du fichier HTML fourni par le développeur. La marketplace n&apos;exécute pas ce contenu dans la page principale : il est isolé dans une iframe.</p>
                </section>
              </aside>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
