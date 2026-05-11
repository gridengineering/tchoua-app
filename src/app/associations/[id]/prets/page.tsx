import { DashboardLayout } from "@/components/layout/dashboard-layout";

// ... (types and constants remain same)

export default function PretsPage() {
  // ... (states and functions remain same)

  return (
    <DashboardLayout title="Prêts internes">
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Landmark className="w-3 h-3 text-gold" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-gold">Crédit & Financement</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Prêts internes</h1>
              <p className="text-emerald-100/60 font-medium leading-relaxed max-w-xl">
                Suivez vos emprunts, effectuez des remboursements et consultez l'état de vos engagements 
                financiers au sein de votre association.
              </p>
            </div>
            <div className="flex gap-4">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-xs font-medium text-ash uppercase tracking-wider outline-none">
                <option value="ALL" className="bg-forest">Tous les statuts</option>
                {(Object.keys(STATUS_STYLE) as LoanStatus[]).map(s => (
                  <option key={s} value={s} className="bg-forest">{STATUS_STYLE[s].label}</option>
                ))}
              </select>
              <button onClick={() => setShowCreate(true)}
                className="bg-gold text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> Demander un prêt
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-warm-white rounded-3xl border border-stone animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center bg-warm-white rounded-2xl border-4 border-dashed border-gray-50">
            <Landmark className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucun prêt trouvé</h3>
            <p className="text-sm font-medium text-ash mt-2">Vous n'avez pas encore de demande de prêt en cours.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(loan => {
              const style = STATUS_STYLE[loan.status];
              const repaidPct = loan.totalDue > 0 && loan.repaidAmount != null
                ? Math.min(100, Math.round((loan.repaidAmount / loan.totalDue) * 100))
                : 0;
              return (
                <div key={loan.id} onClick={() => setSelected(loan)}
                  className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-charcoal text-lg leading-none">
                          {loan.borrowerMembership.user.name || loan.borrowerMembership.user.email}
                        </span>
                        <span className="text-[9px] px-3 py-1 rounded-full text-xs font-medium text-ash uppercase tracking-wider"
                          style={{ background: style.bg, color: style.color }}>
                          {style.label}
                        </span>
                      </div>
                      <div className="text-[10px] font-black text-gold uppercase tracking-widest">
                        {loan.activity?.name || "Activité inconnue"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-[#0d3d28]">{(loan.amount).toLocaleString()}</div>
                      <div className="text-[9px] font-black text-ash uppercase tracking-widest">Montant Principal</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                    <div className="p-4 rounded-2xl bg-cream/50">
                      <div className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Durée</div>
                      <div className="text-sm font-semibold text-charcoal">{loan.duration} mois</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-cream/50">
                      <div className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Taux</div>
                      <div className="text-sm font-semibold text-charcoal">{loan.interestRate}% / mois</div>
                    </div>
                  </div>

                  {loan.status === "ACTIVE" && (
                    <div className="relative z-10">
                      <div className="flex justify-between text-[10px] font-black text-ash uppercase tracking-widest mb-2">
                        <span>Remboursement : {(loan.repaidAmount ?? 0).toLocaleString()} FCFA</span>
                        <span className="text-[#0d3d28]">{repaidPct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${repaidPct}%`, background: "#0d3d28" }} />
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                    <div className="text-[9px] font-black text-ash uppercase tracking-widest">Total dû : {loan.totalDue.toLocaleString()} FCFA</div>
                    <div className="text-[10px] font-black text-[#0d3d28] uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Gérer <ChevronLeft className="w-3 h-3 rotate-180" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && !showRepay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-warm-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b flex items-center justify-between bg-cream/50">
              <h2 className="font-black text-2xl text-[#0d3d28]">Détail du prêt</h2>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full bg-warm-white shadow-sm flex items-center justify-center text-ash hover:text-gray-600 transition-colors font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-cream">
                  <p className="text-[10px] font-black text-ash uppercase tracking-widest mb-2">Emprunteur</p>
                  <p className="font-semibold text-charcoal">{selected.borrowerMembership.user.name || selected.borrowerMembership.user.email}</p>
                </div>
                <div className="p-6 rounded-3xl bg-forest text-white">
                  <p className="text-[10px] font-black text-emerald-300/60 uppercase tracking-widest mb-2">Montant Principal</p>
                  <p className="font-black text-2xl">{selected.amount.toLocaleString()} <span className="text-xs font-normal opacity-60">FCFA</span></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Durée</p>
                  <p className="font-semibold text-charcoal">{selected.duration} mois</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Taux</p>
                  <p className="font-semibold text-charcoal">{selected.interestRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-ash uppercase tracking-widest mb-1">Total dû</p>
                  <p className="font-black text-red-600">{selected.totalDue.toLocaleString()}</p>
                </div>
              </div>

              {selected.purpose && (
                <div className="p-6 rounded-3xl bg-cream border border-stone">
                  <p className="text-[10px] font-black text-ash uppercase tracking-widest mb-2">Objet du financement</p>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">{selected.purpose}</p>
                </div>
              )}

              {selected.repayments && selected.repayments.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-4 h-4 text-[#0d3d28]" />
                    <h3 className="text-xs font-black text-[#0d3d28] uppercase tracking-widest">Historique des Remboursements</h3>
                  </div>
                  <div className="space-y-2">
                    {selected.repayments.map(r => (
                      <div key={r.id} className="flex justify-between items-center p-4 bg-warm-white border border-stone rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-forest"></div>
                          <span className="text-xs font-black text-gray-600">{new Date(r.paidAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <span className="text-sm font-semibold text-charcoal">{r.amount.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-cream/50 flex gap-4 justify-end border-t">
              {selected.status === "PENDING" && (
                <button onClick={() => { approveLoan(selected.id); setSelected(null); }}
                  className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider shadow-xl hover:scale-105 transition-all"
                  style={{ background: "#0d3d28" }}>
                  Approuver la demande
                </button>
              )}
              {selected.status === "ACTIVE" && (
                <button onClick={() => setShowRepay(true)}
                  className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider shadow-xl hover:scale-105 transition-all"
                  style={{ background: "#0d3d28" }}>
                  Rembourser
                </button>
              )}
              <button onClick={() => setSelected(null)} className="px-8 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider border border-gray-200 text-ash">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {showRepay && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-300">
          <div className="bg-warm-white rounded-2xl w-full max-w-md p-10 shadow-2xl">
            <h3 className="font-black text-2xl mb-2 text-[#0d3d28]">Remboursement</h3>
            <p className="text-xs font-medium text-ash mb-8 uppercase tracking-widest">Enregistrer un versement</p>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Montant (FCFA)</label>
                <input type="number" value={repayForm.amount} onChange={e => setRepayForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black focus:ring-4 focus:ring-[#0d3d28]/5 outline-none transition-all" placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Mode de paiement</label>
                <select value={repayForm.paymentMethod} onChange={e => setRepayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black focus:ring-4 focus:ring-[#0d3d28]/5 outline-none transition-all">
                  <option value="CASH">Espèces (Caisse)</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK">Virement bancaire</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-10">
              <button onClick={() => setShowRepay(false)} className="px-6 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider">Annuler</button>
              <button onClick={repayLoan} disabled={saving || !repayForm.amount}
                className="px-8 py-4 rounded-2xl text-xs font-medium text-white uppercase tracking-wider shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                style={{ background: "#0d3d28" }}>
                {saving ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-300">
          <div className="bg-warm-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-10 border-b flex items-center justify-between bg-cream/50">
              <h2 className="font-black text-2xl text-[#0d3d28]">Demande de prêt</h2>
              <button onClick={() => setShowCreate(false)} className="w-10 h-10 rounded-full bg-warm-white shadow-sm flex items-center justify-center text-ash hover:text-gray-600 transition-colors font-bold">×</button>
            </div>
            <div className="p-10 space-y-6">
              {activities.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-sm font-bold text-graphite">Aucune activité avec caisse disponible pour un prêt.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Activité source</label>
                      <select value={form.activityId} onChange={e => setForm(f => ({ ...f, activityId: e.target.value }))}
                        className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black outline-none">
                        {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Montant (FCFA)</label>
                      <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black outline-none" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 items-center">
                    <div>
                      <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Durée</label>
                      <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                        className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-black outline-none">
                        {[1,2,3,4,5,6,9,12].map(d => <option key={d} value={d}>{d} mois</option>)}
                      </select>
                    </div>
                    {selectedActivity && (
                      <div className="p-6 rounded-3xl bg-forest/10 border border-emerald-100">
                        <div className="text-[10px] font-black text-forest uppercase tracking-widest mb-1">Détails Taux</div>
                        <div className="text-xs font-black text-emerald-800">
                          {rate}% / mois
                          {form.amount && <div className="mt-1 text-forest">Total : {totalDue.toLocaleString()} FCFA</div>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-ash uppercase tracking-widest mb-2">Objet de la demande</label>
                    <textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                      rows={3} className="w-full bg-cream border border-stone rounded-2xl px-6 py-4 text-sm font-medium resize-none outline-none"
                      placeholder="Pourquoi avez-vous besoin de ce prêt ?" />
                  </div>
                </>
              )}
            </div>
            <div className="p-10 bg-cream/50 flex gap-4 justify-end border-t">
              <button onClick={() => setShowCreate(false)} className="px-8 py-4 rounded-2xl text-xs font-medium text-ash uppercase tracking-wider">Annuler</button>
              <button onClick={createLoan} disabled={saving || !form.amount || activities.length === 0}
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
