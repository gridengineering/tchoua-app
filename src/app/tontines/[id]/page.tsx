"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getInitials, getTontineTypeLabel, getFrequencyLabel } from "@/lib/utils";
import { ArrowLeft, Users, PiggyBank, RotateCcw, Landmark, Plus } from "lucide-react";

export default function TontineDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "membres" | "sessions" | "cotisations" | "prets">("overview");

  useEffect(() => {
    if (id) {
      fetch(`/api/tontines/${id}`)
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  if (!data?.tontine) return (
    <DashboardLayout>
      <div className="text-center py-16 text-graphite">Tontine introuvable</div>
    </DashboardLayout>
  );

  const t = data.tontine;
  const myRole = data.myRole;

  const tabs = [
    { key: "overview", label: "Aperçu", icon: PiggyBank },
    { key: "membres", label: `Membres (${t._count?.memberships || 0})`, icon: Users },
    { key: "sessions", label: `Sessions (${t._count?.sessions || 0})`, icon: RotateCcw },
    { key: "cotisations", label: "Cotisations", icon: PiggyBank },
    { key: "prets", label: "Prêts", icon: Landmark },
  ];

  return (
    <DashboardLayout title={t.name}>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <Link href="/tontines" className="flex items-center gap-2 text-sm text-graphite hover:text-violet-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour aux tontines
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge status={t.status} />
                <span className="text-sm text-graphite">{getTontineTypeLabel(t.type)}</span>
                {myRole && <span className="text-sm text-violet-600 font-medium">Mon rôle : {myRole}</span>}
              </div>
            </div>
            {["PRESIDENT", "TREASURER", "SECRETARY"].includes(myRole) && (
              <Button size="sm"><Plus className="w-4 h-4" /> Gérer</Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Membres actifs", value: t._count?.memberships || 0, icon: "👥" },
            { label: "Sessions", value: t._count?.sessions || 0, icon: "🔄" },
            { label: "Cotisation", value: t.contributionAmount > 0 ? formatCurrency(t.contributionAmount) : "Variable", icon: "💰" },
            { label: "Fréquence", value: getFrequencyLabel(t.frequency), icon: "📅" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-graphite">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Description */}
        {t.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-gray-700">{t.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === key
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-graphite hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  {[
                    { label: "Type", value: getTontineTypeLabel(t.type) },
                    { label: "Fréquence", value: getFrequencyLabel(t.frequency) },
                    { label: "Max membres", value: t.maxMembers },
                    { label: "Région", value: t.region || "Non précisée" },
                    { label: "Créé le", value: formatDate(t.createdAt) },
                    { label: "Accès", value: t.isPublic ? "Public" : "Privé" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <dt className="text-graphite">{label}</dt>
                      <dd className="font-medium text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {t.rules && (
              <Card>
                <CardHeader><CardTitle>Règlement intérieur</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.rules}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "membres" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Membres ({t.memberships?.length || 0})</CardTitle>
                {["PRESIDENT", "TREASURER"].includes(myRole) && (
                  <Button size="sm"><Plus className="w-4 h-4" /> Ajouter</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {t.memberships?.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{getInitials(m.user.name)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{m.user.name}</p>
                      <p className="text-xs text-graphite">Score : {m.user.score} pts · {m.user.level}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      m.role === "PRESIDENT" ? "bg-violet-100 text-violet-700" :
                      m.role === "TREASURER" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{m.role}</span>
                    {m.joinedAt && <span className="text-xs text-ash">{formatDate(m.joinedAt)}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "sessions" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sessions de rotation</CardTitle>
                {["PRESIDENT", "TREASURER"].includes(myRole) && (
                  <Link href={`/sessions?tontineId=${t.id}`}>
                    <Button size="sm"><Plus className="w-4 h-4" /> Planifier</Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {t.sessions?.length === 0 ? (
                <div className="py-12 text-center text-graphite">
                  <RotateCcw className="w-10 h-10 mx-auto mb-3 text-ash/60" />
                  <p>Aucune session planifiée</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {t.sessions?.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
                        <span className="font-bold text-info">#{s.sessionNumber}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Session {s.sessionNumber}</p>
                        <p className="text-xs text-graphite">{formatDate(s.startDate)} · {formatCurrency(s.amount)}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "cotisations" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cotisations récentes</CardTitle>
                <Link href={`/cotisations?tontineId=${t.id}`}>
                  <Button size="sm"><Plus className="w-4 h-4" /> Cotiser</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {t.contributions?.length === 0 ? (
                <div className="py-12 text-center text-graphite">Aucune cotisation</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {t.contributions?.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{c.user?.name}</p>
                        <p className="text-xs text-graphite">{formatDate(c.createdAt)}</p>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(c.amount)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "prets" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prêts</CardTitle>
                <Link href={`/prets?tontineId=${t.id}`}>
                  <Button size="sm"><Plus className="w-4 h-4" /> Demander</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {t.loans?.length === 0 ? (
                <div className="py-12 text-center text-graphite">Aucun prêt en cours</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {t.loans?.map((l: any) => (
                    <div key={l.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{l.borrower?.name}</p>
                        <p className="text-xs text-graphite">{l.purpose}</p>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(l.amount)}</span>
                      <StatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
