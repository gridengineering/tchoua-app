"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Download, CheckCircle, Clock, XCircle, BarChart2, Users, Vault, ChevronRight } from "lucide-react";
import { AuctionManager } from "@/components/associations/activities/AuctionManager";
import { DrawManager } from "@/components/associations/activities/DrawManager";

type Member = { id: string; name: string };
type Activity = { id: string; name: string; type: string; participation: string; contributionAmount?: number; contributionFrequency: string; distributionMode: string; caisseBalance: number; associationId: string; auctionMinBidPct?: number; };
type Session = { id: string; sessionNumber: number; scheduledAt: string; status: string; potAmount?: number; distributed: number; reliquat: number; drawResult?: string; auctionResult?: string; };
type Contribution = { id: string; membershipId: string; amount: number; status: string; paymentMethod?: string; paidAt?: string; dueAt?: string; };

const PARTICIPATION_COLORS: Record<string, string> = { MANDATORY: "#16a34a", OPTIONAL: "#2563eb", CONDITIONAL: "#d97706" };
const TYPE_EMOJI: Record<string, string> = { TONTINE_ROTATIVE: "🔄", TONTINE_ASCA: "🏦", TONTINE_ENCHERES: "🔨", EPARGNE: "💰", AIDE_SOLIDAIRE: "❤️", PRET: "🤝", NATURE: "🌾", INVESTISSEMENT: "📈", ACHATS_GROUPES: "🛒", COLLECTION: "📋" };

export default function ActivityPage() {
  const { id, actId } = useParams<{ id: string; actId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "sessions" | "contributions" | "beneficiaries" | "caisse">("overview");
  const [activity, setActivity] = useState<Activity | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ scheduledAt: "", notes: "", potAmount: "" });
  const [paymentForm, setPaymentForm] = useState({ membershipId: "", amount: "", paymentMethod: "CASH", reference: "", paidAt: new Date().toISOString().slice(0, 10) });
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/associations/${id}/activities/${actId}`).then(r => r.json()),
      fetch(`/api/associations/${id}/activities/${actId}/sessions`).then(r => r.json()),
      fetch(`/api/associations/${id}/activities/${actId}/contributions`).then(r => r.json()),
      fetch(`/api/associations/${id}`).then(r => r.json()),
    ]).then(([act, sess, contribs, assocData]) => {
      setActivity(act);
      setSessions(Array.isArray(sess) ? sess : []);
      setContributions(Array.isArray(contribs) ? contribs : []);
      if (assocData?.association?.memberships) {
        setMembers(assocData.association.memberships.map((m: any) => ({ id: m.id, name: m.user.name })));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, actId]);

  const handleCreateSession = async () => {
    const res = await fetch(`/api/associations/${id}/activities/${actId}/sessions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: sessionForm.scheduledAt, notes: sessionForm.notes, potAmount: parseFloat(sessionForm.potAmount) || null }),
    });
    if (res.ok) { const s = await res.json(); setSessions(p => [s, ...p]); setShowSessionModal(false); }
  };

  const handlePayment = async () => {
    const res = await fetch(`/api/associations/${id}/activities/${actId}/contributions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...paymentForm, amount: parseFloat(paymentForm.amount) || 0 }),
    });
    if (res.ok) { const c = await res.json(); setContributions(p => [c, ...p]); setShowPaymentModal(false); }
  };

  const handleAuctionComplete = async (sessionId: string, result: any) => {
    // Dans la réalité, appel API pour sauvegarder le résultat des enchères et fermer la session
    const res = await fetch(`/api/associations/${id}/activities/${actId}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "HELD", auctionResult: JSON.stringify(result), distributed: result.winningBid, reliquat: result.netAmount })
    });
    if (res.ok) {
      const updatedSess = await res.json();
      setSessions(p => p.map(s => s.id === sessionId ? updatedSess : s));
    }
  };

  const handleDrawComplete = async (sessionId: string, result: any) => {
    // Appel API pour sauvegarder le tirage
    const res = await fetch(`/api/associations/${id}/activities/${actId}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "HELD", drawResult: JSON.stringify(result), distributed: result.beneficiaries[0].amount })
    });
    if (res.ok) {
      const updatedSess = await res.json();
      setSessions(p => p.map(s => s.id === sessionId ? updatedSess : s));
    }
  };

  const exportCSV = () => {
    const rows = [["Membre","Montant","Statut","Mode","Date"], ...contributions.map(c => [c.membershipId, c.amount, c.status, c.paymentMethod||"", c.paidAt||""])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `cotisations-${actId}.csv`; a.click();
  };

  const tabs = [
    { key: "overview", label: "Aperçu" }, { key: "sessions", label: "Sessions" },
    { key: "contributions", label: "Cotisations" }, { key: "beneficiaries", label: "Bénéficiaires" },
    { key: "caisse", label: "Caisse" },
  ] as const;

  if (loading) return <DashboardLayout title="Activité"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#0d3d28] border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout title={activity?.name || "Activité"}>
      <div className="space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-graphite">
          <button onClick={() => router.push(`/associations/${id}`)} className="hover:text-[#0d3d28] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Association
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-medium text-gray-800">{activity?.name}</span>
        </div>

        {/* Header */}
        {activity && (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "rgba(13,61,40,0.08)" }}>
              {TYPE_EMOJI[activity.type] || "📌"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{activity.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: PARTICIPATION_COLORS[activity.participation] }}>
                  {activity.participation}
                </span>
              </div>
              <p className="text-sm text-graphite mt-0.5">{activity.type} · {activity.contributionFrequency}</p>
              {activity.contributionAmount && (
                <p className="text-sm font-semibold mt-1" style={{ color: "#0d3d28" }}>{formatCurrency(activity.contributionAmount)} / cotisation</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setShowPaymentModal(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium border" style={{ borderColor: "#0d3d28", color: "#0d3d28" }}>
                Enregistrer paiement
              </button>
              <button onClick={() => setShowSessionModal(true)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#0d3d28" }}>
                <Plus className="w-4 h-4 inline mr-1" />Session
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? "border-[#0d3d28] text-[#0d3d28]" : "border-transparent text-graphite hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Aperçu */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Sessions", value: sessions.length, icon: BarChart2 },
              { label: "Cotisations collectées", value: formatCurrency(contributions.filter(c => c.status === "PAID").reduce((s, c) => s + c.amount, 0)), icon: CheckCircle },
              { label: "En attente", value: contributions.filter(c => c.status === "PENDING").length, icon: Clock },
              { label: "Caisse", value: formatCurrency(activity?.caisseBalance || 0), icon: Vault },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: "#0d3d28" }} />
                  <span className="text-xs text-graphite">{label}</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
              </CardContent></Card>
            ))}
          </div>
        )}

        {/* Sessions */}
        {tab === "sessions" && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-ash">Aucune session. Créez la première session.</CardContent></Card>
            ) : sessions.map(s => (
              <Card key={s.id}><CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Session #{s.sessionNumber}</div>
                    <div className="text-sm text-graphite">{new Date(s.scheduledAt).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                    {s.status === "HELD" && (
                      <div className="flex gap-4 mt-1 text-sm">
                        <span>Distribué: <strong>{formatCurrency(s.distributed)}</strong></span>
                        {s.reliquat > 0 && <span className="text-gold">Reliquat: <strong>{formatCurrency(s.reliquat)}</strong></span>}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === "HELD" ? "bg-green-100 text-green-700" : s.status === "CANCELLED" ? "bg-error/10 text-red-700" : "bg-info/10 text-blue-700"}`}>
                    {s.status}
                  </span>
                </div>
                {s.drawResult && (
                  <div className="mt-2 p-2 rounded bg-cream text-xs text-gray-600 border border-stone">
                    <strong>Résultat tirage :</strong> {JSON.stringify(JSON.parse(s.drawResult), null, 2)}
                  </div>
                )}
                {s.auctionResult && (
                  <div className="mt-2 p-3 rounded bg-gold/10 text-xs text-amber-900 border border-amber-100">
                    <strong className="block mb-1">Résultat enchères :</strong>
                    <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(JSON.parse(s.auctionResult), null, 2)}</pre>
                  </div>
                )}
                {s.status === "UPCOMING" && activity && activity.type === "TONTINE_ENCHERES" && (
                  <div className="mt-4 border-t pt-4">
                    <AuctionManager 
                      sessionId={s.id} 
                      activityId={activity.id} 
                      associationId={id} 
                      potAmount={s.potAmount || activity.contributionAmount || 0} 
                      minBidPct={activity.auctionMinBidPct || 5} 
                      members={members} 
                      onAuctionComplete={(res) => handleAuctionComplete(s.id, res)} 
                    />
                  </div>
                )}
                {s.status === "UPCOMING" && activity && activity.type === "TONTINE_ROTATIVE" && (
                  <div className="mt-4 border-t pt-4">
                    <DrawManager 
                      sessionId={s.id} 
                      activityId={activity.id} 
                      associationId={id} 
                      potAmount={s.potAmount || activity.contributionAmount || 0} 
                      members={members} 
                      distributionMode={activity.distributionMode}
                      onDrawComplete={(res) => handleDrawComplete(s.id, res)} 
                    />
                  </div>
                )}
              </CardContent></Card>
            ))}
          </div>
        )}

        {/* Cotisations */}
        {tab === "contributions" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border" style={{ borderColor: "#e2ddd4", color: "#0d3d28" }}>
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <Card><CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone">
                  {["Membre", "Montant", "Statut", "Mode paiement", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-graphite">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {contributions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ash">Aucune cotisation enregistrée</td></tr>
                  ) : contributions.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-cream">
                      <td className="px-4 py-3 font-mono text-xs text-graphite">{c.membershipId.slice(-6)}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(c.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "PAID" ? "bg-green-100 text-green-700" : c.status === "LATE" ? "bg-error/10 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {c.status === "PAID" ? <><CheckCircle className="w-3 h-3 inline mr-1" />Payé</> : c.status === "LATE" ? <><XCircle className="w-3 h-3 inline mr-1" />En retard</> : <><Clock className="w-3 h-3 inline mr-1" />En attente</>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.paymentMethod || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{c.paidAt ? new Date(c.paidAt).toLocaleDateString("fr-FR") : c.dueAt ? `Dû ${new Date(c.dueAt).toLocaleDateString("fr-FR")}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          </div>
        )}

        {/* Bénéficiaires */}
        {tab === "beneficiaries" && (
          <Card><CardContent className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Mode: {activity?.distributionMode}</h3>
            <p className="text-sm text-graphite">
              {activity?.distributionMode === "ROTATION" && "Rotation fixe par ordre d'ancienneté. Les bénéficiaires sont listés dans l'ordre de passage."}
              {activity?.distributionMode === "LOTTERY_MONTHLY" && "Tirage au sort mensuel. Chaque session désigne aléatoirement le(s) bénéficiaire(s) parmi les membres non encore bénéficiaires du cycle."}
              {activity?.distributionMode === "LOTTERY_UNIQUE" && "Tirage unique au début du cycle. L'ordre est irrevocable pour toute la durée du cycle."}
              {activity?.distributionMode === "AUCTION" && `Enchères publiques. Mise à prix minimum: ${activity.type}.`}
              {activity?.distributionMode === "MERIT" && "Attribution par mérite (ancienneté et ponctualité)."}
              {activity?.distributionMode === "NEED" && "Attribution par urgence sociale (priorité aux besoins les plus pressants)."}
            </p>
            <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(13,61,40,0.04)", border: "1px solid rgba(13,61,40,0.1)" }}>
              <p className="text-sm" style={{ color: "#0d3d28" }}>Consultez les sessions pour voir les résultats de chaque tirage ou enchère.</p>
            </div>
          </CardContent></Card>
        )}

        {/* Caisse */}
        {tab === "caisse" && (
          <div className="space-y-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Vault className="w-6 h-6" style={{ color: "#0d3d28" }} />
                <div>
                  <div className="text-xs text-graphite">Solde en caisse</div>
                  <div className="text-2xl font-bold" style={{ color: "#0d3d28" }}>{formatCurrency(activity?.caisseBalance || 0)}</div>
                </div>
              </div>
              <p className="text-sm text-graphite">Les reliquats non distribués s'accumulent en caisse et peuvent être prêtés aux membres à taux d'intérêt.</p>
            </CardContent></Card>
          </div>
        )}
      </div>

      {/* Modal Nouvelle Session */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-warm-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold" style={{ color: "#0d3d28" }}>Nouvelle Session</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date & heure *</label>
              <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4" }}
                value={sessionForm.scheduledAt} onChange={e => setSessionForm(p => ({ ...p, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cagnotte estimée (FCFA)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4" }}
                value={sessionForm.potAmount} onChange={e => setSessionForm(p => ({ ...p, potAmount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea rows={2} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4", resize: "none" }}
                value={sessionForm.notes} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSessionModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#e2ddd4" }}>Annuler</button>
              <button onClick={handleCreateSession} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#0d3d28" }}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enregistrer Paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-warm-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold" style={{ color: "#0d3d28" }}>Enregistrer un paiement</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ID Membre (membershipId)</label>
              <input className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4" }}
                placeholder="Identifiant du membre" value={paymentForm.membershipId} onChange={e => setPaymentForm(p => ({ ...p, membershipId: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Montant (FCFA) *</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4" }}
                  value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mode paiement</label>
                <select className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4" }}
                  value={paymentForm.paymentMethod} onChange={e => setPaymentForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                  {["CASH", "MOBILE_MONEY", "BANK", "NATURE", "TIME"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Référence / N° reçu</label>
              <input className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4" }}
                value={paymentForm.reference} onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date de paiement</label>
              <input type="date" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]" style={{ borderColor: "#e2ddd4" }}
                value={paymentForm.paidAt} onChange={e => setPaymentForm(p => ({ ...p, paidAt: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#e2ddd4" }}>Annuler</button>
              <button onClick={handlePayment} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#0d3d28" }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
