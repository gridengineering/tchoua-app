"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, Plus, Trash2, Save, X, Check,
  ChevronRight, Lock, Unlock, Users, AlertCircle, Info, Loader2
} from "lucide-react";

type Permission = {
  id: string;
  resource: string;
  action: string;
};

type SystemRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
  _count?: { users: number };
  createdAt: string;
};

const RESOURCES = ["USERS", "ASSOCIATIONS", "TRANSACTIONS", "TEMPLATES", "AUDIT", "SETTINGS", "ROLES", "NOTIFICATIONS", "WALLETS", "FINANCE", "DASHBOARD"];
const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"];
const RESOURCE_LABELS: Record<string, string> = {
  USERS: "Utilisateurs",
  ASSOCIATIONS: "Associations",
  TRANSACTIONS: "Transactions",
  TEMPLATES: "Modèles",
  AUDIT: "Audit & Logs",
  SETTINGS: "Paramètres",
  ROLES: "Rôles & Permissions",
  NOTIFICATIONS: "Notifications",
  WALLETS: "Wallets",
  FINANCE: "Audit financier",
  DASHBOARD: "Tableau de bord",
};
const ACTION_LABELS: Record<string, string> = {
  CREATE: "Créer",
  READ: "Lire",
  UPDATE: "Modifier",
  DELETE: "Supprimer",
};
const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-emerald-600",
  READ: "text-blue-600",
  UPDATE: "text-amber-600",
  DELETE: "text-red-600",
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", description: "" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch {
      showToast("Erreur lors du chargement des rôles", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectRole = (role: SystemRole) => {
    setSelectedRole(role);
    setEditingPermissions(new Set(role.permissions.map(p => `${p.resource}_${p.action}`)));
    setIsCreating(false);
    setEditingInfo(false);
    setInfoForm({ name: role.name, description: role.description ?? "" });
  };

  const saveRoleInfo = async () => {
    if (!selectedRole) return;
    if (!infoForm.name.trim()) return showToast("Le nom du rôle est requis", "error");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Mise à jour impossible");
      setSelectedRole(data.role);
      setRoles((prev) => prev.map((r) => (r.id === data.role.id ? data.role : r)));
      setEditingInfo(false);
      showToast("Rôle mis à jour", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    const key = `${resource}_${action}`;
    const next = new Set(editingPermissions);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setEditingPermissions(next);
  };

  const toggleAllForResource = (resource: string) => {
    const keys = ACTIONS.map(a => `${resource}_${a}`);
    const allActive = keys.every(k => editingPermissions.has(k));
    const next = new Set(editingPermissions);
    if (allActive) keys.forEach(k => next.delete(k));
    else keys.forEach(k => next.add(k));
    setEditingPermissions(next);
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: Array.from(editingPermissions) }),
      });
      if (res.ok) {
        showToast("Permissions mises à jour avec succès", "success");
        fetchRoles();
      } else {
        const err = await res.json();
        showToast(err.error || "Erreur lors de la sauvegarde", "error");
      }
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    if (!newRole.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });
      if (res.ok) {
        showToast("Rôle créé avec succès", "success");
        setIsCreating(false);
        setNewRole({ name: "", description: "" });
        fetchRoles();
      } else {
        const err = await res.json();
        showToast(err.error || "Erreur lors de la création", "error");
      }
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!confirm("Supprimer ce rôle ? Les utilisateurs associés perdront leurs droits.")) return;
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Rôle supprimé", "success");
        if (selectedRole?.id === roleId) setSelectedRole(null);
        fetchRoles();
      } else {
        showToast("Erreur lors de la suppression", "error");
      }
    } catch {
      showToast("Erreur serveur", "error");
    }
  };

  const hasChanged = selectedRole
    ? JSON.stringify(Array.from(editingPermissions).sort()) !==
      JSON.stringify(selectedRole.permissions.map(p => `${p.resource}_${p.action}`).sort())
    : false;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl text-sm font-black transition-all animate-in slide-in-from-right border border-current/10 ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Rôles &amp; Permissions</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Gérez les droits d&apos;accès système via un modèle RBAC granulaire.</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setSelectedRole(null); }}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white text-sm font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouveau Rôle
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-blue-50 border border-blue-100 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="text-sm font-black text-blue-900 uppercase tracking-wider">RBAC System — Role-Based Access Control</div>
          <p className="text-xs text-blue-700/70 mt-1 font-medium leading-relaxed">
            Chaque rôle définit une matrice de permissions sur les ressources de la plateforme. 
            Le rôle <strong className="text-blue-900 font-black">Admin Principal</strong> est immutable pour garantir l&apos;intégrité du système.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Role List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create Role Form */}
          {isCreating && (
            <div className="bg-white rounded-[2rem] border-2 border-blue-600/20 p-6 space-y-4 animate-in slide-in-from-top duration-300">
              <div className="text-xs font-black text-blue-600 uppercase tracking-widest">Nouveau Rôle</div>
              <input
                type="text"
                placeholder="Nom (ex: Auditeur Financier)"
                value={newRole.name}
                onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all"
              />
              <textarea
                placeholder="Description du rôle..."
                value={newRole.description}
                onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-5 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all"
              />
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={createRole} 
                  disabled={saving || !newRole.name.trim()} 
                  className="flex-1 py-4 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-blue-500/10"
                >
                  {saving ? "Création..." : "Créer le rôle"}
                </button>
                <button onClick={() => setIsCreating(false)} className="px-5 py-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Role Cards */}
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-28 animate-pulse border border-gray-50" />
            ))
          ) : roles.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-100 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Aucun rôle défini</p>
            </div>
          ) : (
            roles.map(role => (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={`w-full text-left bg-white rounded-[2rem] p-6 border-2 transition-all group relative overflow-hidden ${
                  selectedRole?.id === role.id
                    ? "border-blue-600 shadow-xl shadow-blue-600/5 ring-4 ring-blue-600/5"
                    : "border-gray-100 hover:border-blue-100 hover:shadow-lg"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      selectedRole?.id === role.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                    }`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-black text-gray-900 truncate">{role.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">{role.description || "Aucune description"}</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 mt-1 flex-shrink-0 transition-all ${selectedRole?.id === role.id ? "rotate-90 text-blue-600" : "text-gray-200 group-hover:text-blue-200"}`} />
                </div>
                <div className="flex items-center gap-4 mt-6 pt-5 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Users className="w-3.5 h-3.5" />
                    <span>{role._count?.users ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{role.permissions.length}</span>
                  </div>
                  {role.name !== "Admin Principal" && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteRole(role.id); }}
                      className="ml-auto p-2 rounded-xl text-red-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Permission Matrix */}
        <div className="lg:col-span-3 h-fit sticky top-28">
          {selectedRole ? (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="min-w-0 flex-1">
                  {editingInfo ? (
                    <div className="space-y-2">
                      <input
                        value={infoForm.name}
                        onChange={(e) => setInfoForm((f) => ({ ...f, name: e.target.value }))}
                        disabled={selectedRole.name === "Admin Principal"}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-bold text-slate-900 outline-none focus:border-indigo-300 disabled:bg-slate-50"
                      />
                      <input
                        value={infoForm.description}
                        onChange={(e) => setInfoForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Description du rôle"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-300"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveRoleInfo} disabled={saving} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                          Enregistrer
                        </button>
                        <button onClick={() => setEditingInfo(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedRole.name}</h2>
                        {selectedRole.name === "Admin Principal" && (
                          <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm shadow-amber-500/5">Rôle Système</span>
                        )}
                        <button
                          onClick={() => setEditingInfo(true)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Modifier
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-400 mt-1 italic">&quot;{selectedRole.description}&quot;</p>
                    </>
                  )}
                </div>
                {hasChanged && selectedRole.name !== "Admin Principal" && (
                  <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "..." : "Appliquer"}
                  </button>
                )}
              </div>

              {/* Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ressource Système</th>
                      {ACTIONS.map(action => (
                        <th key={action} className="px-4 py-5 text-center">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${ACTION_COLORS[action]}`}>
                            {ACTION_LABELS[action]}
                          </span>
                        </th>
                      ))}
                      <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50">Full Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {RESOURCES.map((resource, i) => {
                      const allActive = ACTIONS.every(a => editingPermissions.has(`${resource}_${a}`));
                      const someActive = ACTIONS.some(a => editingPermissions.has(`${resource}_${a}`));
                      const isLocked = selectedRole.name === "Admin Principal";
                      
                      return (
                        <tr key={resource} className="hover:bg-gray-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="font-black text-sm text-gray-800">{RESOURCE_LABELS[resource]}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter opacity-50">{resource}</div>
                          </td>
                          {ACTIONS.map(action => {
                            const key = `${resource}_${action}`;
                            const active = editingPermissions.has(key);
                            return (
                              <td key={action} className="px-4 py-6 text-center">
                                <button
                                  disabled={isLocked}
                                  onClick={() => togglePermission(resource, action)}
                                  className={`w-10 h-10 rounded-[1rem] mx-auto flex items-center justify-center transition-all ${
                                    active
                                      ? "shadow-md scale-110"
                                      : "opacity-20 hover:opacity-100 hover:bg-gray-100"
                                  } ${isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"}`}
                                  style={active ? {
                                    background: action === "CREATE" ? "#d1fae5" : action === "READ" ? "#dbeafe" : action === "UPDATE" ? "#fef3c7" : "#fee2e2",
                                    color: action === "CREATE" ? "#065f46" : action === "READ" ? "#1e40af" : action === "UPDATE" ? "#92400e" : "#991b1b"
                                  } : { background: "#f8fafc" }}
                                >
                                  {active
                                    ? <Check className="w-5 h-5 stroke-[3]" />
                                    : <X className="w-4 h-4 text-gray-400" />
                                  }
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-6 py-6 text-center bg-gray-50/30 group-hover:bg-blue-50/20 transition-colors">
                            <button
                              disabled={isLocked}
                              onClick={() => toggleAllForResource(resource)}
                              className={`w-10 h-10 rounded-[1rem] mx-auto flex items-center justify-center transition-all ${
                                allActive
                                  ? "bg-slate-900 text-white shadow-lg shadow-black/20"
                                  : someActive
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-300 opacity-50"
                              } ${!isLocked ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed"}`}
                            >
                              {allActive
                                ? <Unlock className="w-5 h-5 stroke-[2.5]" />
                                : <Lock className="w-4 h-4 stroke-[2.5]" />
                              }
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedRole.name === "Admin Principal" && (
                <div className="p-8 bg-amber-50/50 border-t border-amber-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-amber-900">Architecture de Sécurité Native</div>
                    <p className="text-xs font-medium text-amber-700/70 mt-1 leading-relaxed">
                      Les droits de l&apos;Admin Principal sont câblés en dur pour assurer la disponibilité du système. 
                      Aucune modification manuelle n&apos;est permise sur ce profil.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border-4 border-dashed border-gray-100 h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center group">
              <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">Contrôle d&apos;Accès</h3>
              <p className="text-sm font-medium text-gray-400 mt-3 max-w-xs leading-relaxed italic">
                &quot;Sélectionnez un rôle pour configurer sa matrice de permissions RBAC.&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
