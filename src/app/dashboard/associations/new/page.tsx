"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Sparkles, CheckCircle2, Wand2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function NewAssociationChoicePage() {
  return (
    <DashboardLayout title="Créer une association">
      <div className="mx-auto max-w-5xl space-y-7 animate-in fade-in duration-500">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
          </Link>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900">Nouvelle association</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Choisissez votre point de départ. Vous pourrez ensuite compléter et ajuster tous les paramètres dans la configuration de l&apos;association.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/dashboard/associations/create" className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-900">Formulaire vierge</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
              Vous connaissez déjà l&apos;organisation de votre association. Ouvrez directement le formulaire complet et renseignez chaque champ à votre rythme.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-slate-900">Ouvrir le formulaire <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>

          <Link href="/dashboard/associations/assistant" className="group relative flex flex-col overflow-hidden rounded-3xl border border-emerald-900 bg-[#0d3d28] p-7 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#d4a343]/20 blur-2xl" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a343] text-[#0d3d28]">
              <Wand2 className="h-6 w-6" />
            </div>
            <div className="relative mt-5 flex items-center gap-2">
              <h2 className="text-xl font-black">Assistant de génération</h2>
              <Sparkles className="h-4 w-4 text-[#d4a343]" />
            </div>
            <p className="relative mt-2 flex-1 text-sm leading-relaxed text-white/75">
              Répondez à quelques questions essentielles. L&apos;assistant prépare le nom, la vocation, les activités, les réunions, les finances et le règlement intérieur, puis crée l&apos;association pour vous.
            </p>
            <div className="relative mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-white/80">
              <span className="rounded-full bg-white/10 px-2.5 py-1">5 étapes</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">~3 minutes</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">Modifiable ensuite</span>
            </div>
            <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-black text-[#f0c76b]">Démarrer l&apos;assistant <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            <CheckCircle2 className="absolute bottom-5 right-6 h-16 w-16 text-white/5" />
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400">
          Le formulaire vierge et la configuration restent accessibles à tout moment. Vous pourrez modifier toutes les informations après la création.
        </p>
      </div>
    </DashboardLayout>
  );
}
