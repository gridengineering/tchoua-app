"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Users, Search, UserPlus, Filter, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function MembersDirectoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch(`/api/associations/${id}/members${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.members) setMembers(data.members);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, statusFilter]);

  const filteredMembers = members.filter(m => 
    m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Annuaire des Membres">
      <div className="space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 w-full max-w-md bg-warm-white px-3 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-[#0d3d28]">
            <Search className="w-5 h-5 text-ash" />
            <input 
              type="text"
              placeholder="Rechercher par nom ou email..."
              className="bg-transparent border-none focus:outline-none w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-warm-white px-3 py-2 rounded-lg border text-sm">
              <Filter className="w-4 h-4 text-graphite" />
              <select 
                className="bg-transparent focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="ACTIVE">Actifs</option>
                <option value="PENDING">En attente</option>
                <option value="SUSPENDED">Suspendus</option>
                <option value="LEFT">Partis</option>
              </select>
            </div>
            
            <Link 
              href={`/associations/${id}/members/pending`}
              className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-200 transition"
            >
              <ShieldAlert className="w-4 h-4" />
              Approbations
            </Link>

            <button className="flex items-center gap-2 bg-forest text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a2f1f] transition">
              <UserPlus className="w-4 h-4" />
              Inviter
            </button>
          </div>
        </div>

        {/* Directory List */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-cream text-gray-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Membre</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-center">Score Fiabilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-warm-white">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-graphite">Chargement de l'annuaire...</td></tr>
                ) : filteredMembers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-graphite">Aucun membre trouvé.</td></tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-cream transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-[#0d3d28] font-bold">
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{m.user.name}</div>
                            <div className="text-xs text-graphite">Adhésion : {new Date(m.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{m.user.phone || "-"}</div>
                        <div className="text-graphite text-xs">{m.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {m.status === 'ACTIVE' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Actif</span>}
                        {m.status === 'PENDING' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">En attente</span>}
                        {m.status === 'SUSPENDED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-red-800">Suspendu</span>}
                        {m.status === 'LEFT' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-graphite">Parti</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-bold ${m.reliabilityScore >= 80 ? 'text-green-600' : m.reliabilityScore >= 50 ? 'text-gold' : 'text-red-600'}`}>
                            {m.reliabilityScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}
