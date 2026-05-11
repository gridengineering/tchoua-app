"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, Plus, ChevronLeft, CheckCircle, XCircle, Clock, AlertCircle, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";

type AidCategory =
  | "MALADIE_MEMBRE" | "MALADIE_CONJOINT" | "MALADIE_ENFANT"
  | "DECES_MEMBRE" | "DECES_CONJOINT" | "DECES_ENFANT" | "DECES_PARENT"
  | "MARIAGE" | "NAISSANCE" | "SCOLARITE" | "CATASTROPHE";

type AidStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

interface AidRequest {
  id: string;
  category: AidCategory;
  requestedAmount: number;
  approvedAmount?: number;
  status: AidStatus;
  justification?: string;
  urgencyLevel: number;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedReason?: string;
  membership: { user: { name: string | null; email: string }; memberNumber?: string };
}

const CATEGORY_LABELS: Record<AidCategory, string> = {
  MALADIE_MEMBRE: "Maladie – membre",
  MALADIE_CONJOINT: "Maladie – conjoint",
  MALADIE_ENFANT: "Maladie – enfant",
  DECES_MEMBRE: "Décès – membre",
  DECES_CONJOINT: "Décès – conjoint",
  DECES_ENFANT: "Décès – enfant",
  DECES_PARENT: "Décès – parent",
  MARIAGE: "Mariage",
  NAISSANCE: "Naissance",
  SCOLARITE: "Scolarité",
  CATASTROPHE: "Catastrophe",
};

const STATUS_STYLE: Record<AidStatus, { bg: string; color: string; label: string; icon: any }> = {
  PENDING: { bg: "#fef9c3", color: "#a16207", label: "En attente", icon: Clock },
  APPROVED: { bg: "#dcfce7", color: "#166534", label: "Approuvée", icon: CheckCircle },
  REJECTED: { bg: "#fee2e2", color: "#991b1b", label: "Rejetée", icon: XCircle },
  PAID: { bg: "#dbeafe", color: "#1e40af", label: "Payée", icon: CheckCircle },
};

export default function AidesPage() {
  const params = useParams<{ id: string }>();
  const assocId = params.id;
  const router = useRouter();

  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<AidRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [approveAmount, setApproveAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const [form, setForm] = useState({
    category: "MALADIE_MEMBRE" as AidCategory,
    requestedAmount: "",
    justification: "",
    urgencyLevel: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/associations/${assocId}/social-aids`);
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests ?? []);
    }
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const createRequest = async () => {
    if (!form.requestedAmount) return;
    setSaving(true);
    const res = await fetch(`/api/associations/${assocId}/social-aids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requestedAmount: Number(form.requestedAmount) }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ category: "MALADIE_MEMBRE", requestedAmount: "", justification: "", urgencyLevel: 1 });
      load();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de la soumission");
    }
    setSaving(false);
  };

  const approveRequest = async () => {
    if (!selected) return;
    setActionSaving(true);
    const res = await fetch(`/api/associations/${assocId}/social-aids`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: selected.id, action: "APPROVE", approvedAmount: Number(approveAmount) }),
    });
    if (res.ok) {
      setShowApprove(false);
      setSelected(null);
      load();
    }
    setActionSaving(false);
  };

  const rejectRequest = async () => {
    if (!selected) return;
    setActionSaving(true);
    const res = await fetch(`/api/associations/${assocId}/social-aids`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: selected.id, action: "REJECT", rejectedReason: rejectReason }),
    });
    if (res.ok) {
      setShowReject(false);
      setSelected(null);
      load();
    }
    setActionSaving(false);
  };

  const markPaid = async (r: AidRequest) => {
    await fetch(`/api/associations/${assocId}/social-aids`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: r.id, action: "PAY" }),
    });
    load();
  };

  return (
    <DashboardLayout title="Aide Solidaire">
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-gold">Solidarité & Entraide</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Caisse de Solidarité</h1>
              <p className="text-emerald-100/60 font-medium leading-relaxed max-w-xl">
                La force de notre association réside dans notre capacité à nous soutenir mutuellement. 
                Soumettez vos demandes d'aide ou suivez les actions de solidarité en cours.
              </p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="bg-gold text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nouvelle demande
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-white rounded-3xl border border-stone animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-2xl border-4 border-dashed border-gray-50">
            <Heart className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucune demande d'aide</h3>
            <p className="text-sm font-medium text-ash mt-2">La caisse de solidarité est prête à soutenir les membres en cas de besoin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map(r => {
              const style = STATUS_STYLE[r.status];
              const Icon = style.icon;
              return (
                <div key={r.id} onClick={() => setSelected(r)}
                  className="bg-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-charcoal text-lg leading-none">{CATEGORY_LABELS[r.category]}</span>
                        <span className="flex items-center gap-1 text-[9px] px-3 py-1 rounded-full text-xs font-medium text-ash uppercase tracking-wider"
                          style={{ background: style.bg, color: style.color }}>
                          <Icon className="w-3 h-3" /> {style.label}
                        </span>
                      </div>
                      <div className="text-[10px] font-black text-gold uppercase tracking-widest">
                        {r.membership.user.name || r.membership.user.email} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-[#0d3d28]">{formatCurrency(r.requestedAmount)}</div>
                      {r.approvedAmount != null && (
                        <div className="text-[9px] font-black text-forest uppercase tracking-widest">Approuvé : {formatCurrency(r.approvedAmount)}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cream/50 mb-6 relative z-10">
                    <p className="text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed">
                      {r.justification || "Aucune justification fournie."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(l => (
                        <div key={l} className={`w-2 h-2 rounded-full ${r.urgencyLevel >= l ? (r.urgencyLevel === 3 ? 'bg-error' : 'bg-gold') : 'bg-gray-200'}`}></div>
                      ))}
                      <span className="text-[9px] font-black text-ash uppercase tracking-widest ml-2">Urgence {r.urgencyLevel}/3</span>
                    </div>
                    <div className="text-[10px] font-black text-[#0d3d28] uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Détails <ChevronLeft className="w-3 h-3 rotate-180" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && !showApprove && !showReject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b flex items-center justify-between bg-cream/50">
              <h2 className="font-black text-2xl text-[#0d3d28]">{CATEGORY_LABELS[selected.category]}</h2>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-ash hover:text-gray-600 transition-colors font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-cream">
                  <p className="text-[10px] font-black text-ash uppercase tracking-widest mb-2">Demandeur</p>
                  <p className="font-semibold text-charcoal">{selected.membership.user.name || selected.membership.user.email}</p>
                </div>
                <div className="p-6 rounded-3xl bg-forest text-white">
                  <p className="text-[10px] font-black text-emerald-300/60 uppercase tracking-widest mb-2">Montant Demandé</p>
                  <p className="font-black text-2xl">{formatCurrency(selected.requestedAmount)}</p>
                </div>
              </div>

              {selected.approvedAmount != null && (
                <div className="p-6 rounded-3xl bg-forest/10 border border-emerald-100 flex items-center justify-between">
                  <div className="text-[10px] font-black text-forest uppercase tracking-widest">Montant Approuvé</div>
                  <div className="text-xl font-black text-forest">{formatCurrency(selected.approvedAmount)}</div>
                </div>
              )}

              <div className="p-6 rounded-3xl bg-cream border border-stone">
                <p className="text-[10px] font-black text-ash uppercase tracking-widest mb-2">Justification détaillée</p>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">{selected.justification}</p>
              </div>

              {selected.rejectedReason && (
                <div className="p-6 rounded-3xl bg-error/10 border border-red-100">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Motif de rejet</p>
                  <p className="text-sm font-medium text-red-700">{selected.rejectedReason}</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-cream/50 flex gap-4 justify-end border-t">
              {selected.status === "PENDING" && (
                <div>
                  <button onClick={() => { setShowReject(true); }}
                    className="px-8 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider border border-red-200 text-red-600 hover:bg-error/10 transition-colors">
                    Rejeter
                  </button>
                  <button onClick={() => { setApproveAmount(String(selected.requestedAmount)); setShowApprove(true); }}
                    className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider shadow-xl hover:scale-105 transition-all"
                    style={{ background: "#0d3d28" }}>
                    Approuver
                  </button>
                </div>
              )}
              {selected.status === "APPROVED" && (
                <button onClick={() => { markPaid(selected); setSelected(null); }}
                  className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider shadow-xl hover:scale-105 transition-all"
                  style={{ background: "#0d3d28" }}>
                  Marquer comme payée
                </button>
              )}
              <button onClick={() => setSelected(null)} className="px-8 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider border border-gray-200 text-ash">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Sub-modal */}
      {showApprove && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md p-10 shadow-2xl">
            <h3 className="font-black text-2xl mb-2 text-[#0d3d28]">Approbation</h3>
            <p className="text-xs font-medium text-ash mb-8 uppercase tracking-widest">Confirmer le montant d'aide</p>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Montant approuvé (FCFA)</label>
                <input type="number" value={approveAmount} onChange={e => setApproveAmount(e.target.value)}
                  className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black focus:ring-4 focus:ring-[#0d3d28]/5 outline-none transition-all" />
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-10">
              <button onClick={() => setShowApprove(false)} className="px-6 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider">Annuler</button>
              <button onClick={approveRequest} disabled={actionSaving || !approveAmount}
                className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                style={{ background: "#0d3d28" }}>
                {actionSaving ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Sub-modal */}
      {showReject && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md p-10 shadow-2xl">
            <h3 className="font-black text-2xl mb-2 text-red-600">Rejet</h3>
            <p className="text-xs font-medium text-ash mb-8 uppercase tracking-widest">Expliquez le motif du refus</p>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Motif du rejet</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  rows={4} className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-medium outline-none transition-all resize-none" placeholder="Motif..." />
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-10">
              <button onClick={() => setShowReject(false)} className="px-6 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider">Annuler</button>
              <button onClick={rejectRequest} disabled={actionSaving}
                className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider bg-red-600 shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                {actionSaving ? "..." : "Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-10 border-b flex items-center justify-between bg-cream/50">
              <h2 className="font-black text-2xl text-[#0d3d28]">Nouvelle demande</h2>
              <button onClick={() => setShowCreate(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-ash hover:text-gray-600 transition-colors font-bold">×</button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Catégorie</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as AidCategory }))}
                    className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black outline-none">
                    {(Object.keys(CATEGORY_LABELS) as AidCategory[]).map(k => (
                      <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Montant (FCFA)</label>
                  <input type="number" value={form.requestedAmount}
                    onChange={e => setForm(f => ({ ...f, requestedAmount: e.target.value }))}
                    className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black outline-none" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Niveau d'urgence</label>
                <div className="flex gap-3">
                  {[1, 2, 3].map(l => (
                    <button key={l} onClick={() => setForm(f => ({ ...f, urgencyLevel: l }))}
                      className={`flex-1 py-4 rounded-2xl text-[10px] text-xs font-medium text-ash uppercase tracking-wider border transition-all ${form.urgencyLevel === l ? 'bg-forest text-white border-[#0d3d28] shadow-lg' : 'bg-white text-ash border-stone'}`}>
                      {l === 1 ? "Normal" : l === 2 ? "Urgent" : "Critique"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Justification</label>
                <textarea value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                  rows={4} className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-medium outline-none transition-all resize-none"
                  placeholder="Décrivez précisément votre situation..." />
              </div>
            </div>
            <div className="p-10 bg-cream/50 flex gap-4 justify-end border-t">
              <button onClick={() => setShowCreate(false)} className="px-8 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider">Annuler</button>
              <button onClick={createRequest} disabled={saving || !form.requestedAmount}
                className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                style={{ background: "#0d3d28" }}>
                {saving ? "Envoi..." : "Soumettre la demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
