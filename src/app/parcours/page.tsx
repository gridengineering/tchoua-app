"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, ShieldCheck, Users, Layers, SlidersHorizontal, CalendarDays, UserRound, FileCheck2 } from "lucide-react";

type Step = {
  key: string; title: string; description: string;
  status: "DONE" | "CURRENT" | "UPCOMING" | "BLOCKED";
  href: string; action: string; meta?: string;
};

const ICONS: Record<string, any> = {
  account: UserRound, consents: FileCheck2, kyc: ShieldCheck,
  membership: Users, subscription: Layers, allocation: SlidersHorizontal, session: CalendarDays,
};

export default function ParcoursPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/member/journey")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Mon parcours">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="rounded-2xl bg-forest text-white p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-bold">Parcours membre</p>
          <h1 className="text-3xl font-black mt-2">De l’inscription au versement</h1>
          <p className="text-emerald-100/75 mt-2 max-w-2xl">
            Chaque étape est obligatoire avant la suivante. Votre progression est enregistrée et vous pouvez reprendre à tout moment.
          </p>
          <div className="mt-6">
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-gold transition-all" style={{ width: `${data?.progress ?? 0}%` }} />
            </div>
            <p className="text-xs mt-2 text-white/70">{loading ? "Chargement…" : `${data?.progress ?? 0}% des étapes essentielles terminées`}</p>
          </div>
          {data?.next && (
            <Link href={data.next.href} className="inline-flex items-center gap-2 mt-5 rounded-lg bg-gold text-forest px-5 py-2.5 text-sm font-bold">
              Continuer : {data.next.action} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {(data?.steps ?? []).map((step: Step, index: number) => {
            const Icon = ICONS[step.key] ?? Circle;
            const done = step.status === "DONE";
            return (
              <Card key={step.key} className={step.status === "CURRENT" ? "border-gold shadow-md" : ""}>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-emerald-100 text-emerald-700" : step.status === "CURRENT" ? "bg-gold/20 text-[#8a6410]" : "bg-stone/40 text-graphite"}`}>
                    {done ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-charcoal">{step.title}</h2>
                      {step.status === "CURRENT" && <span className="text-[10px] uppercase tracking-wide font-bold bg-gold/20 text-[#8a6410] px-2 py-0.5 rounded-full">À faire</span>}
                      {done && <span className="text-[10px] uppercase tracking-wide font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Terminé</span>}
                    </div>
                    <p className="text-sm text-graphite mt-1">{step.description}</p>
                    {step.meta && <p className="text-xs text-ash mt-1">{step.meta}</p>}
                  </div>
                  <Link href={step.href}>
                    <Button variant={step.status === "CURRENT" ? "default" : "outline"} size="sm" className="whitespace-nowrap">
                      {step.action}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-graphite text-center">
          Les étapes 1 à 4 sont indispensables pour accéder aux activités financières. Les étapes 5 à 7 se répètent à chaque cycle.
        </p>
      </div>
    </DashboardLayout>
  );
}
