"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type Launch = {
  app: { id: string; slug: string; name: string; scope: string };
  launchUrl: string;
  expiresAt: string;
};

export default function AppLaunchPage() {
  const params = useParams<{ slug: string }>();
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const associationId = new URLSearchParams(window.location.search).get("associationId");
    const suffix = associationId ? `?associationId=${encodeURIComponent(associationId)}` : "";
    fetch(`/api/apps/${params.slug}/launch${suffix}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Ouverture impossible.");
        setLaunch(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ouverture impossible."))
      .finally(() => setLoading(false));
  }, [params.slug]);

  return (
    <DashboardLayout title={launch?.app.name || "Application"}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/apps" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d3d28] hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Retour aux apps</Link>
          <div className="flex items-center gap-2 text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5 text-[#0d3d28]" /> Session liée à votre installation · expire dans 30 min</div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#faf9f5] px-4 py-3">
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-[#a47718]">Application installée</p><p className="text-sm font-black text-slate-900">{launch?.app.name || "Chargement…"}</p></div>
            {launch ? <a href={launch.launchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">Ouvrir dans un onglet <ExternalLink className="h-3 w-3" /></a> : null}
          </div>
          {loading ? <div className="flex h-[65vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#0d3d28]" /></div> : error ? <div className="flex h-[55vh] items-center justify-center p-6 text-center"><div><p className="text-sm font-bold text-red-700">{error}</p><Link href="/apps" className="mt-2 inline-block text-xs font-semibold text-[#0d3d28] underline">Retour à la marketplace</Link></div></div> : launch ? <iframe title={launch.app.name} src={launch.launchUrl} className="h-[72vh] w-full bg-white" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads" /> : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
