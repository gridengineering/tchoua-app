"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Settings, User, Wallet, Save, AlertTriangle } from "lucide-react";

export default function MyProfilePage() {
  const { id } = useParams<{ id: string }>();
  
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSubs, setEditedSubs] = useState<any[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetch(`/api/associations/${id}/my-profile`)
      .then(res => res.json())
      .then(data => {
        if (data.membership) {
          setMembership(data.membership);
          // Initialiser l'état éditable pour les souscriptions
          setEditedSubs(data.membership.activitySubs.map((sub: any) => ({
            id: sub.id,
            allocationType: sub.allocationType || "NONE",
            allocationValue: sub.allocationValue || 0,
            activityName: sub.activity.name,
            activityType: sub.activity.type,
            priority: sub.activity.participation === "MANDATORY" ? 1 : (sub.activity.type === "EPARGNE" ? 4 : 3)
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubChange = (subId: string, field: string, value: any) => {
    setEditedSubs(subs => subs.map(sub => 
      sub.id === subId ? { ...sub, [field]: value } : sub
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/associations/${id}/my-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptions: editedSubs }),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: "Paramètres de répartition sauvegardés avec succès." });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || "Erreur lors de la sauvegarde." });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout title="Chargement..."><div /></DashboardLayout>;
  if (!membership) return <DashboardLayout title="Profil"><p>Profil introuvable</p></DashboardLayout>;

  // Filtrer pour n'afficher que les activités de Priorité 4 (Optionnelle Partielle) ou celles configurables
  const configurableSubs = editedSubs.filter(sub => sub.priority === 4 || sub.activityType === "EPARGNE");

  return (
    <DashboardLayout title="Mon Profil Financier">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Résumé du Profil */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-forest text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-green-100" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{membership.user.name}</h2>
                  <p className="text-sm text-green-100/70">Score Fiabilité : {membership.reliabilityScore}%</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-sm text-green-100/70 uppercase font-semibold mb-1">Excédent Disponible</p>
                <p className="text-3xl font-bold">{formatCurrency(membership.excessBalance)}</p>
              </div>
            </CardContent>
          </Card>

          {membership.sanctions && membership.sanctions.length > 0 && (
            <Card className="border-red-200 bg-error/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-800 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" /> Dettes & Sanctions (Priorité 0)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {membership.sanctions.map((s: any) => (
                    <li key={s.id} className="flex justify-between items-center text-sm border-b border-red-100 pb-2">
                      <span className="text-red-700">{s.description || s.failureType}</span>
                      <span className="font-bold text-red-900">{formatCurrency(s.penaltyAmount)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Configuration de la répartition */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0d3d28]" />
                Clés de Répartition (Activités Optionnelles)
              </CardTitle>
              <p className="text-sm text-graphite">
                Configurez comment vos excédents de versement doivent être alloués automatiquement.
              </p>
            </CardHeader>
            <CardContent>
              {message && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-semibold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-error/10 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              {configurableSubs.length === 0 ? (
                <p className="text-sm text-graphite italic">Vous n'êtes souscrit à aucune activité optionnelle configurable (ex: Épargne).</p>
              ) : (
                <div className="space-y-6">
                  {configurableSubs.map(sub => (
                    <div key={sub.id} className="p-4 border rounded-xl bg-cream/50">
                      <h4 className="font-semibold text-gray-900 mb-3">{sub.activityName}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-graphite uppercase mb-1">Type d'allocation</label>
                          <select
                            value={sub.allocationType}
                            onChange={(e) => handleSubChange(sub.id, 'allocationType', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-warm-white focus:ring-2 focus:ring-[#0d3d28] focus:outline-none text-sm"
                          >
                            <option value="NONE">Aucune (Ne pas allouer)</option>
                            <option value="RESIDUAL">Tout le reste (Excédent total)</option>
                            <option value="FIXED">Montant Fixe</option>
                            <option value="PERCENTAGE">Pourcentage du versement (%)</option>
                          </select>
                        </div>
                        
                        {(sub.allocationType === "FIXED" || sub.allocationType === "PERCENTAGE") && (
                          <div>
                            <label className="block text-xs font-semibold text-graphite uppercase mb-1">
                              {sub.allocationType === "FIXED" ? "Montant (FCFA)" : "Pourcentage (%)"}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={sub.allocationValue || ""}
                              onChange={(e) => handleSubChange(sub.id, 'allocationValue', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border bg-warm-white focus:ring-2 focus:ring-[#0d3d28] focus:outline-none text-sm"
                              placeholder={sub.allocationType === "FIXED" ? "ex: 5000" : "ex: 10"}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-forest text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0a2f1f] transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Sauvegarde..." : "Enregistrer les clés"}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
