"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Landmark,
  Plus,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingDown,
  Search,
  Filter,
  CreditCard,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";

type LoanStatus = "PENDING" | "APPROVED" | "ACTIVE" | "REPAID" | "DEFAULTED";

interface Loan {
  id: string;
  amount: number;
  totalDue: number;
  interestRate?: number | null;
  duration: number;
  purpose?: string | null;
  status: LoanStatus;
  createdAt: string;
  approvedAt?: string | null;
  disbursedAt?: string | null;
  dueDate?: string | null;
  borrowerMembership: {
    id: string;
    memberNumber?: string | null;
    user: { name: string | null; email: string };
  };
}

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  ACTIVE: "Actif",
  REPAID: "Remboursé",
  DEFAULTED: "Défaut",
};

const STATUS_STYLE: Record<LoanStatus, { bg: string; color: string; icon: any }> = {
  PENDING: { bg: "#fef9c3", color: "#a16207", icon: Clock },
  APPROVED: { bg: "#dcfce7", color: "#166534", icon: CheckCircle },
  ACTIVE: { bg: "#dbeafe", color: "#1e40af", icon: CreditCard },
  REPAID: { bg: "#dcfce7", color: "#166534", icon: CheckCircle },
  DEFAULTED: { bg: "#fee2e2", color: "#991b1b", icon: AlertCircle },
};

export default function PretsPage() {
  const params = useParams<{ id: string }>();
  const assocId = params.id;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [showRepay, setShowRepay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isBureau, setIsBureau] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    duration: "3",
    purpose: "",
  });

  const [repayForm, setRepayForm] = useState({ amount: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [res, associationRes] = await Promise.all([
      fetch(`/api/associations/${assocId}/loans`),
      fetch(`/api/associations/${assocId}`),
    ]);
    if (res.ok) {
      const data = await res.json();
      setLoans(data.loans ?? []);
    }
    if (associationRes.ok) {
      const association = await associationRes.json();
      setIsBureau(["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "TREASURER"].includes(association.myRole));
    }
    setLoading(false);
  }, [assocId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = loans;
    if (statusFilter !== "ALL") result = result.filter((l) => l.status === statusFilter);
    if (search) result = result.filter((l) => l.purpose?.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [loans, statusFilter, search]);

  const totalActive = loans.filter((l) => l.status === "ACTIVE").reduce((s, l) => s + l.totalDue, 0);

  async function createLoan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/associations/${assocId}/loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(form.amount),
        duration: parseInt(form.duration),
        purpose: form.purpose,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ amount: "", duration: "3", purpose: "" });
      setShowCreate(false);
      load();
    }
  }

  async function approveLoan() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/associations/${assocId}/loans`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: selected.id, action: "APPROVE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Approbation impossible");
      setSelected(null);
      await load();
      alert(data.requiresMoreApprovals ? data.message : "Prêt approuvé et décaissé.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Approbation impossible");
    } finally {
      setSaving(false);
    }
  }

  async function repayLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/associations/${assocId}/loans`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId: selected.id,
        action: "REPAY",
        amount: parseFloat(repayForm.amount),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setRepayForm({ amount: "" });
      setShowRepay(false);
      setSelected(null);
      load();
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Prêts internes">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d3d28]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Prêts internes">
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Landmark className="w-3 h-3 text-gold" />
                <span className="text-xs font-medium uppercase tracking-wider text-gold">Crédit & Financement</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Prêts internes</h1>
              <p className="text-emerald-100/60 font-medium leading-relaxed max-w-xl">
                Suivez vos emprunts, effectuez des remboursements et consultez l&apos;état de vos engagements financiers.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl text-center">
                <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">Encours Total</div>
                <div className="text-3xl font-black">{formatCurrency(totalActive)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un prêt..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone bg-warm-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LoanStatus | "ALL")}
              className="pl-12 pr-4 py-3 rounded-xl border border-stone bg-warm-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20 appearance-none min-w-[180px]"
            >
              <option value="ALL">Tous les statuts</option>
              {(Object.keys(STATUS_LABELS) as LoanStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0d3d28] text-white rounded-xl text-sm font-semibold hover:bg-[#0d3d28]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Demander un prêt
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-warm-white rounded-2xl border border-stone">
            <TrendingDown className="w-12 h-12 text-ash mx-auto mb-4" />
            <p className="text-ash font-medium">Aucun prêt trouvé</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((loan) => {
              const style = STATUS_STYLE[loan.status];
              const Icon = style.icon;
              return (
                <div
                  key={loan.id}
                  onClick={() => setSelected(loan)}
                  className="bg-warm-white rounded-2xl border border-stone p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: style.bg, color: style.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {STATUS_LABELS[loan.status]}
                        </span>
                        <span className="text-xs text-ash">{loan.borrowerMembership.user.name || loan.borrowerMembership.user.email}</span>
                      </div>
                      <h3 className="text-lg font-bold text-forest mb-1">{formatCurrency(loan.amount)}</h3>
                      <p className="text-sm text-ash">{loan.purpose || "Sans objet"}</p>
                      <div className="flex gap-4 mt-3 text-xs text-ash">
                        <span>Durée: {loan.duration} mois</span>
                        <span>Taux: {loan.interestRate ?? 0}%</span>
                        {loan.dueDate && <span>Échéance: {new Date(loan.dueDate).toLocaleDateString("fr-FR")}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-forest">{formatCurrency(loan.totalDue)}</div>
                      <div className="text-xs text-ash">Total dû</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-warm-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold text-forest mb-6">Demander un prêt</h3>
              <form onSubmit={createLoan} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-forest mb-1">Montant (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-stone bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-forest mb-1">Durée (mois)</label>
                  <input
                    type="number"
                    required
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-stone bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-forest mb-1">Objet</label>
                  <input
                    type="text"
                    value={form.purpose}
                    onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-stone bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-stone text-sm font-semibold hover:bg-stone/50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-xl bg-[#0d3d28] text-white text-sm font-semibold hover:bg-[#0d3d28]/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Envoi..." : "Soumettre"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail / Repay Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-warm-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <button onClick={() => { setSelected(null); setShowRepay(false); }} className="mb-4 flex items-center gap-1 text-sm text-ash hover:text-forest">
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
              <h3 className="text-xl font-bold text-forest mb-2">Détail du prêt</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-ash">Montant</span><span className="font-semibold">{formatCurrency(selected.amount)}</span></div>
                <div className="flex justify-between"><span className="text-ash">Total dû</span><span className="font-semibold">{formatCurrency(selected.totalDue)}</span></div>
                <div className="flex justify-between"><span className="text-ash">Durée</span><span className="font-semibold">{selected.duration} mois</span></div>
                <div className="flex justify-between"><span className="text-ash">Taux</span><span className="font-semibold">{selected.interestRate ?? 0}%</span></div>
                <div className="flex justify-between"><span className="text-ash">Statut</span><span className="font-semibold">{STATUS_LABELS[selected.status]}</span></div>
                <div className="flex justify-between"><span className="text-ash">Objet</span><span className="font-semibold">{selected.purpose || "—"}</span></div>
                {selected.dueDate && (
                  <div className="flex justify-between"><span className="text-ash">Échéance</span><span className="font-semibold">{new Date(selected.dueDate).toLocaleDateString("fr-FR")}</span></div>
                )}
              </div>
              {isBureau && selected.status === "PENDING" && (
                <button
                  onClick={approveLoan}
                  disabled={saving}
                  className="mt-6 w-full px-4 py-3 rounded-xl bg-forest text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Approbation..." : "Approuver ce prêt"}
                </button>
              )}
              {(selected.status === "ACTIVE" || selected.status === "APPROVED") && (
                <div className="mt-6">
                  {!showRepay ? (
                    <button
                      onClick={() => setShowRepay(true)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0d3d28] text-white text-sm font-semibold hover:bg-[#0d3d28]/90 transition-colors"
                    >
                      Effectuer un remboursement
                    </button>
                  ) : (
                    <form onSubmit={repayLoan} className="space-y-3">
                      <input
                        type="number"
                        required
                        placeholder="Montant du remboursement"
                        value={repayForm.amount}
                        onChange={(e) => setRepayForm({ amount: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-stone bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowRepay(false)}
                          className="flex-1 px-4 py-3 rounded-xl border border-stone text-sm font-semibold hover:bg-stone/50 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 px-4 py-3 rounded-xl bg-[#0d3d28] text-white text-sm font-semibold hover:bg-[#0d3d28]/90 transition-colors disabled:opacity-50"
                        >
                          {saving ? "Traitement..." : "Rembourser"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
