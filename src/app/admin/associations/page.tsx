"use client";

import Link from "next/link";

import { useState, useEffect, useCallback } from "react";
import { 
  Building2, Search, Filter, MoreHorizontal, 
  CheckCircle2, AlertCircle, XCircle, Clock,
  ExternalLink, Users, LayoutGrid, Info, ChevronRight,
  ShieldAlert, ShieldCheck, Mail, Phone, MapPin
} from "lucide-react";

type Association = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  isPublic: boolean;
  color: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  region: string | null;
  creator: { name: true; email: true };
  _count: { memberships: number; activities: number };
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  ACTIVE: { label: "Active", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  PENDING: { label: "En attente", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  SUSPENDED: { label: "Suspendue", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
  DISSOLVED: { label: "Dissoute", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

const TYPE_LABELS: Record<string, string> = {
  TONTINE_CLUB: "Tontine / Club",
  COOPERATIVE: "Coopérative",
  SOLIDARITY: "Solidarité / Famille",
  INVESTMENT: "Club d'Investissement",
  AGRICULTURAL: "GIC / Agricole",
  MUTUAL: "Mutuelle",
};

export default function AdminAssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAssoc, setSelectedAssoc] = useState<Association | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAssocs = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/admin/associations";
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssociations(data.associations || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchAssocs, 300);
    return () => clearTimeout(timer);
  }, [fetchAssocs]);

  const updateStatus = async (id: string, newStatus: string, reason?: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/associations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, reason }),
      });
      if (res.ok) {
        fetchAssocs();
        if (selectedAssoc?.id === id) {
          setSelectedAssoc(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Supervision des Associations</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Gérez le cycle de vie et la conformité des organisations sur la plateforme.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
            {["ALL", "ACTIVE", "PENDING", "SUSPENDED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  statusFilter === s 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s === "ALL" ? "Tous" : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Associations", value: associations.length, icon: Building2, color: "bg-blue-500" },
          { label: "Actives", value: associations.filter(a => a.status === 'ACTIVE').length, icon: ShieldCheck, color: "bg-emerald-500" },
          { label: "En attente", value: associations.filter(a => a.status === 'PENDING').length, icon: Clock, color: "bg-amber-500" },
          { label: "Suspendues", value: associations.filter(a => a.status === 'SUSPENDED').length, icon: ShieldAlert, color: "bg-orange-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg shadow-current/10`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input 
              type="text"
              placeholder="Rechercher par nom, créateur, région..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-[2rem] pl-14 pr-6 py-5 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Association</th>
                    <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type / Créateur</th>
                    <th className="text-center px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Membres</th>
                    <th className="text-center px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-6 h-20 bg-gray-50/20" />
                      </tr>
                    ))
                  ) : associations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic">
                        Aucune association trouvée
                      </td>
                    </tr>
                  ) : (
                    associations.map(assoc => (
                      <tr 
                        key={assoc.id} 
                        onClick={() => setSelectedAssoc(assoc)}
                        className={`group hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedAssoc?.id === assoc.id ? "bg-blue-50/30" : ""}`}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-black shadow-inner" style={{ background: assoc.color + '20', color: assoc.color }}>
                              {assoc.logo ? <img src={assoc.logo} className="w-full h-full object-cover rounded-2xl" /> : assoc.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{assoc.name}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{assoc.region || 'Toute régions'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="text-xs font-black text-gray-700">{TYPE_LABELS[assoc.type] || assoc.type}</div>
                          <div className="text-[10px] font-medium text-gray-400 mt-1">{assoc.creator?.name}</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black">
                            <Users className="w-3 h-3" />
                            {assoc._count?.memberships || 0}
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_CONFIG[assoc.status]?.bg} ${STATUS_CONFIG[assoc.status]?.color}`}>
                            {STATUS_CONFIG[assoc.status]?.label}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <ChevronRight className={`w-5 h-5 transition-all ${selectedAssoc?.id === assoc.id ? "translate-x-1 text-blue-600" : "text-gray-200"}`} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          {selectedAssoc ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-right duration-500 sticky top-28">
              <div className="h-24 relative" style={{ background: selectedAssoc.color }}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              </div>
              
              <div className="px-8 pb-8">
                <div className="relative -mt-12 flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-white p-1 shadow-2xl border-4 border-white">
                    <div className="w-full h-full rounded-[1.7rem] flex items-center justify-center text-3xl font-black" style={{ background: selectedAssoc.color + '20', color: selectedAssoc.color }}>
                      {selectedAssoc.logo ? <img src={selectedAssoc.logo} className="w-full h-full object-cover rounded-[1.7rem]" /> : selectedAssoc.name.charAt(0)}
                    </div>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-xl font-black text-gray-900">{selectedAssoc.name}</h2>
                  <p className="text-sm font-medium text-gray-400 mt-2 px-4 italic leading-relaxed">
                    &quot;{selectedAssoc.description || 'Aucune description fournie'}&quot;
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Activités</div>
                    <div className="text-lg font-black text-gray-900">{selectedAssoc._count?.activities || 0}</div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score Admin</div>
                    <div className="text-lg font-black text-emerald-600">A+</div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Mail className="w-4 h-4 text-gray-300" />
                    <span>{selectedAssoc.email || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Phone className="w-4 h-4 text-gray-300" />
                    <span>{selectedAssoc.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-300" />
                    <span>{selectedAssoc.region || 'Toute régions'}</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Actions Administratives</div>
                  
                  <div className="space-y-3">
                    {selectedAssoc.status === 'PENDING' && (
                      <button 
                        onClick={() => updateStatus(selectedAssoc.id, 'ACTIVE')}
                        disabled={updating === selectedAssoc.id}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white text-sm font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approuver l&apos;Association
                      </button>
                    )}

                    {selectedAssoc.status === 'ACTIVE' && (
                      <button 
                        onClick={() => updateStatus(selectedAssoc.id, 'SUSPENDED')}
                        disabled={updating === selectedAssoc.id}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-500 text-white text-sm font-black shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Suspendre l&apos;Accès
                      </button>
                    )}

                    {selectedAssoc.status === 'SUSPENDED' && (
                      <button 
                        onClick={() => updateStatus(selectedAssoc.id, 'ACTIVE')}
                        disabled={updating === selectedAssoc.id}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white text-sm font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Réactiver le Compte
                      </button>
                    )}

                    {selectedAssoc.status !== 'DISSOLVED' && (
                      <button
                        onClick={() => {
                          const reason = window.prompt("Motif de dissolution (obligatoire, consigné dans l'audit) :");
                          if (!reason || reason.trim().length < 5) return;
                          if (!confirm(`Dissoudre définitivement « ${selectedAssoc.name} » ? Cette action est irréversible.`)) return;
                          updateStatus(selectedAssoc.id, 'DISSOLVED', reason.trim());
                        }}
                        disabled={updating === selectedAssoc.id}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-200 text-red-600 text-sm font-black hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Dissoudre l&apos;association
                      </button>
                    )}

                    <Link
                      href={`/associations/${selectedAssoc.id}`}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 text-gray-600 text-sm font-black hover:bg-gray-100 transition-all"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Ouvrir l&apos;espace association
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-gray-100 h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center group">
              <div className="w-20 h-20 rounded-[1.5rem] bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-lg font-black text-gray-300 uppercase tracking-widest">Inspection</h3>
              <p className="text-xs font-medium text-gray-400 mt-3 max-w-[200px] leading-relaxed italic">
                &quot;Sélectionnez une organisation pour inspecter ses détails et modifier son statut.&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
