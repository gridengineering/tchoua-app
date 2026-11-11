"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ActivityForm, ActivityInitial } from "@/components/associations/activities/ActivityForm";
import { Button } from "@/components/ui/button";

export default function EditActivityPage() {
  const { id, actId } = useParams<{ id: string; actId: string }>();
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityInitial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/associations/${id}/activities/${actId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Activité introuvable");
        setActivity(data.activity ?? data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, actId]);

  return (
    <DashboardLayout title="Modifier l'activité">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-forest p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gold">
              Activités · Paramétrage
            </p>
            <h1 className="text-3xl font-black tracking-tight">Modifier l&apos;activité</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-100/70">
              Les sessions passées restent inchangées : la nouvelle fréquence ne s&apos;applique
              qu&apos;aux sessions futures.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-warm-white" />
        ) : error ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 p-8 text-center">
            <p className="text-sm font-medium text-error">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Retour
            </Button>
          </div>
        ) : (
          <ActivityForm associationId={id} mode="edit" initial={{ ...activity, id: actId }} />
        )}
      </div>
    </DashboardLayout>
  );
}
