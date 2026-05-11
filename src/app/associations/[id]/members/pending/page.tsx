"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PendingApprovalsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = () => {
    setLoading(true);
    fetch(`/api/associations/${id}/members?status=PENDING`)
      .then(res => res.json())
      .then(data => {
        if (data.members) setMembers(data.members);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, [id]);

  const handleAction = async (membershipId: string, status: "ACTIVE" | "REJECTED") => {
    setActionLoading(membershipId);
    try {
      const res = await fetch(`/api/associations/${id}/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Retirer de la liste
        setMembers(members.filter(m => m.id !== membershipId));
      } else {
        alert("Erreur lors de la validation");
      }
    } catch (err) {
      alert("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout title="Approbations en attente">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/associations/${id}/members`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#0d3d28]"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'annuaire
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-graphite">Chargement...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 bg-warm-white rounded-xl border border-dashed border-gray-300">
            <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Tout est à jour !</h3>
            <p className="text-graphite mt-1">Aucune demande d'adhésion en attente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(m => {
              const family = m.user.familyInfo ? JSON.parse(m.user.familyInfo) : {};
              const sponsorName = members.find(mem => mem.id === m.sponsorId)?.user?.name || "Aucun"; // Note: this might not find the sponsor if they are ACTIVE and we only fetched PENDING. A real app would fetch sponsor details from the backend.

              return (
                <Card key={m.id} className="overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="p-5 border-b bg-cream/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
                        {m.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{m.user.name}</h3>
                        <p className="text-xs text-graphite">{m.user.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-xs font-semibold text-ash uppercase">Téléphone</span>
                        <span className="text-gray-900">{m.user.phone || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-ash uppercase">Ville</span>
                        <span className="text-gray-900">{m.user.location || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-ash uppercase">Profession</span>
                        <span className="text-gray-900">{m.user.profession || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-ash uppercase text-gold flex items-center gap-1">
                          <Users className="w-3 h-3" /> Parrain
                        </span>
                        <span className="text-gray-900 font-medium">
                          {m.sponsorId ? "Vérification requise" : "Non spécifié"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-cream p-3 rounded-lg border text-xs">
                      <span className="block font-semibold text-graphite uppercase mb-2">Informations Familiales</span>
                      <ul className="space-y-1 text-gray-700">
                        <li><span className="text-ash">Conjointe:</span> {family.firstSpouseName || "-"}</li>
                        <li><span className="text-ash">Enfants:</span> {family.childrenCount || "0"}</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-3 pt-2 mt-auto">
                      <button
                        onClick={() => handleAction(m.id, "REJECTED")}
                        disabled={actionLoading === m.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-error/10 text-sm font-semibold transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Rejeter
                      </button>
                      <button
                        onClick={() => handleAction(m.id, "ACTIVE")}
                        disabled={actionLoading === m.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-semibold transition disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Approuver
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
