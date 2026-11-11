"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ActivityForm } from "@/components/associations/activities/ActivityForm";

export default function NewActivityPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <DashboardLayout title="Nouvelle activité">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-forest p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gold">
              Activités · Configuration
            </p>
            <h1 className="text-3xl font-black tracking-tight">Créer une activité</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-100/70">
              Tontine, épargne, prêts ou solidarité : définissez la cotisation, la fréquence des
              sessions et les règles de répartition. Toutes les échéances sont calculées
              automatiquement.
            </p>
          </div>
        </div>
        <ActivityForm associationId={id} mode="create" />
      </div>
    </DashboardLayout>
  );
}
