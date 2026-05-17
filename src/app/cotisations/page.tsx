"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getPaymentMethodLabel } from "@/lib/utils";
import { Plus, X, ShoppingBasket } from "lucide-react";

export default function CotisationsPage() {
  const [contribs, setContribs] = useState<any[]>([]);
  const [tontines, setTontines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tontineId: "", amount: "", unit: "CASH", paymentMethod: "MTN_MOMO",
    reference: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/contributions").then(r => r.json()),
      fetch("/api/tontines?mine=true").then(r => r.json()),
    ]).then(([c, t]) => {
      setContribs(c.contributions || []);
      setTontines(t.tontines || []);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    setShowForm(false);
    const updated = await fetch("/api/contributions").then(r => r.json());
    setContribs(updated.contributions || []);
  };

  const totalPaid = contribs.filter(c => c.status === "PAID").reduce((s, c) => s + c.amount, 0);
  const pending = contribs.filter(c => c.status === "PENDING").length;
  const late = contribs.filter(c => c.status === "LATE").length;

  return (
    <DashboardLayout title="Cotisations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cotisations</h2>
            <p className="text-sm text-graphite">Gérez vos contributions financières et en nature</p>
          </div>
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Nouvelle cotisation</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total payé", value: formatCurrency(totalPaid), color: "text-green-600", bg: "bg-green-50" },
            { label: "En attente", value: pending, color: "text-yellow-600", bg: "bg-gold/10" },
            { label: "En retard", value: late, color: "text-red-600", bg: "bg-error/10" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-graphite mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List */}
        <Card>
          <CardHeader><CardTitle>Historique des cotisations</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-ash">Chargement...</div>
            ) : contribs.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBasket className="w-12 h-12 text-ash/60 mx-auto mb-3" />
                <p className="text-graphite mb-4">Aucune cotisation enregistrée</p>
                <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Enregistrer une cotisation</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream border-b border-stone">
                    <tr>
                      {["Tontine", "Montant", "Type", "Méthode", "Statut", "Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-graphite uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contribs.map((c: any) => (
                      <tr key={c.id} className="hover:bg-cream">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.tontine?.name || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(c.amount)}</td>
                        <td className="px-4 py-3 text-gray-600">{c.unit}</td>
                        <td className="px-4 py-3 text-gray-600">{c.paymentMethod ? getPaymentMethodLabel(c.paymentMethod) : "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-graphite">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-warm-white rounded-2xl w-full max-w-md">
            <div className="border-b border-stone px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Enregistrer une cotisation</h2>
              <button aria-label="Fermer" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-ash" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Select label="Tontine *" value={form.tontineId}
                onChange={e => setForm({...form, tontineId: e.target.value})} required
                options={[
                  { value: "", label: "Sélectionner une tontine..." },
                  ...tontines.map(t => ({ value: t.id, label: t.name }))
                ]} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Montant (FCFA) *" type="number" placeholder="10000"
                  value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                <Select label="Mode de paiement" value={form.paymentMethod}
                  onChange={e => setForm({...form, paymentMethod: e.target.value})}
                  options={[
                    { value: "MTN_MOMO", label: "MTN MoMo" },
                    { value: "ORANGE_MONEY", label: "Orange Money" },
                    { value: "WAVE", label: "Wave" },
                    { value: "EXPRESS_UNION", label: "Express Union" },
                    { value: "CASH", label: "Espèces" },
                    { value: "BANK_TRANSFER", label: "Virement" },
                  ]} />
              </div>
              <Input label="Référence de transaction" placeholder="Numéro de reçu ou référence"
                value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} />
              <Textarea label="Notes" rows={2} placeholder="Commentaires..."
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              {error && <p className="text-sm text-red-600 bg-error/10 p-3 rounded-lg">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Annuler</Button>
                <Button type="submit" className="flex-1" loading={submitting}>Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
