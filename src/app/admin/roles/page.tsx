"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Check, ChevronRight, Copy, FolderTree, Info, ListChecks,
  Loader2, Lock, Pencil, Plus, Save, ShieldCheck, Trash2, Unlock,
  UserRound, Users, X,
} from "lucide-react";
import {
  ACTION_LABELS, ADMIN_ACTIONS, ADMIN_RESOURCES, RECORD_RULE_OPERATIONS,
  RESOURCE_LABELS, permissionKey,
} from "@/lib/rbac";

type Permission = { id: string; resource: string; action: string };
type RoleGroup = {
  id: string; name: string; description: string | null; color: string;
  sortOrder: number; parentId: string | null; parent?: { id: string; name: string } | null;
  _count?: { roles: number; recordRules: number };
};
type SystemRole = {
  id: string; name: string; description: string | null; groupId: string | null;
  group?: RoleGroup | null; permissions: Permission[];
  _count?: { users: number; recordRules: number }; createdAt: string;
};
type RecordRule = {
  id: string; name: string; description: string | null; resource: string; domain: string;
  operations: string; active: boolean; roleId: string | null; groupId: string | null;
  role?: { id: string; name: string } | null; group?: { id: string; name: string; color: string } | null;
};
type AdminUser = {
  id: string; name: string; email: string; isActive: boolean;
  systemRoleId: string | null; systemRole?: { id: string; name: string } | null;
};
type Toast = { message: string; type: "success" | "error" };

const ACTIONS = ADMIN_ACTIONS;
const RESOURCES = Array.from(new Set([...ADMIN_RESOURCES, "KYC", "ARP"])).sort();
const TEMPLATES = [
  { id: "NONE", label: "Aucun accès — configurer la matrice" },
  { id: "READ_ONLY", label: "Lecture seule — tous les modules" },
  { id: "AUDITOR", label: "Auditeur — lecture et audit" },
  { id: "OPERATOR", label: "Gestionnaire — opérations courantes" },
];

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Opération impossible");
  return data;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [groups, setGroups] = useState<RoleGroup[]>([]);
  const [rules, setRules] = useState<RecordRule[]>([]);
  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [tab, setTab] = useState<"permissions" | "rules" | "users">("permissions");
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", description: "", groupId: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", groupId: "", template: "NONE" });
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ id: "", name: "", description: "", color: "#6366f1", parentId: "" });
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({ id: "", name: "", description: "", resource: "ASSOCIATIONS", domain: "[]", operations: ["READ"] as string[], targetType: "ROLE", targetId: "", active: true });
  const [roleUsers, setRoleUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const selected = roles.find((role) => role.id === selectedId) ?? null;
  const selectedGroup = selected?.group ?? groups.find((group) => group.id === selected?.groupId) ?? null;

  const notify = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/api/admin/roles");
      const nextRoles: SystemRole[] = data.roles ?? [];
      setRoles(nextRoles);
      setGroups(data.groups ?? []);
      setRules(data.recordRules ?? []);
      setCatalog(data.permissions ?? []);
      setSelectedId((current) => current && nextRoles.some((role) => role.id === current) ? current : nextRoles[0]?.id ?? null);
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!selected) return;
    setEditingPermissions(new Set(selected.permissions.map((permission) => permissionKey(permission.resource, permission.action))));
    setInfoForm({ name: selected.name, description: selected.description ?? "", groupId: selected.groupId ?? "" });
    setEditingInfo(false);
  }, [selectedId, selected?.permissions, selected?.name, selected?.description, selected?.groupId]);

  useEffect(() => {
    if (tab !== "users" || !selected) return;
    setUsersLoading(true);
    api(`/api/admin/users?roleId=${encodeURIComponent(selected.id)}`)
      .then((data) => setRoleUsers(data.users ?? []))
      .catch((error) => notify(error.message, "error"))
      .finally(() => setUsersLoading(false));
  }, [tab, selected?.id]);

  const resourceList = useMemo(() => {
    const extra = catalog.map((permission) => permission.resource);
    return Array.from(new Set([...RESOURCES, ...extra])).sort();
  }, [catalog]);

  const filteredRoles = useMemo(() => roles.filter((role) => {
    const matchesSearch = !search.trim() || `${role.name} ${role.description ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !groupFilter || (groupFilter === "__none__" ? !role.groupId : role.groupId === groupFilter);
    return matchesSearch && matchesGroup;
  }), [roles, search, groupFilter]);

  const selectRole = (role: SystemRole) => {
    setSelectedId(role.id);
    setEditingInfo(false);
    setTab("permissions");
  };

  const createRole = async () => {
    if (!newRole.name.trim()) return notify("Le nom du rôle est obligatoire.", "error");
    setSaving(true);
    try {
      const data = await api("/api/admin/roles", {
        method: "POST",
        body: JSON.stringify({ ...newRole, name: newRole.name.trim() }),
      });
      const created: SystemRole = data.role;
      setRoles((prev) => [...prev, created]);
      setSelectedId(created.id);
      setCreateOpen(false);
      setNewRole({ name: "", description: "", groupId: "", template: "NONE" });
      notify("Rôle créé. Configurez maintenant ses droits d'accès.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const saveInfo = async () => {
    if (!selected) return;
    if (!infoForm.name.trim()) return notify("Le nom du rôle est obligatoire.", "error");
    setSaving(true);
    try {
      const data = await api(`/api/admin/roles/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...infoForm, name: infoForm.name.trim() }),
      });
      setRoles((prev) => prev.map((role) => role.id === selected.id ? data.role : role));
      setEditingInfo(false);
      notify("Informations du rôle mises à jour.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: SystemRole) => {
    if (role.name === "Admin Principal") return notify("Le rôle Admin Principal est protégé.", "error");
    if (!confirm(`Supprimer le rôle « ${role.name} » ? Les utilisateurs associés perdront leur rôle.`)) return;
    setSaving(true);
    try {
      await api(`/api/admin/roles/${role.id}`, { method: "DELETE" });
      setRoles((prev) => prev.filter((item) => item.id !== role.id));
      if (selectedId === role.id) setSelectedId(null);
      notify("Rôle supprimé.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const cloneRole = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await api("/api/admin/roles", {
        method: "POST",
        body: JSON.stringify({
          name: `${selected.name} (copie)`,
          description: selected.description,
          groupId: selected.groupId,
          permissionKeys: selected.permissions.map((permission) => permissionKey(permission.resource, permission.action)),
        }),
      });
      setRoles((prev) => [...prev, data.role]);
      setSelectedId(data.role.id);
      notify("Rôle dupliqué.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    if (selected?.name === "Admin Principal") return;
    const key = permissionKey(resource, action);
    setEditingPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleResource = (resource: string) => {
    if (selected?.name === "Admin Principal") return;
    const keys = ACTIONS.map((action) => permissionKey(resource, action));
    const all = keys.every((key) => editingPermissions.has(key));
    setEditingPermissions((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => all ? next.delete(key) : next.add(key));
      return next;
    });
  };

  const permissionsChanged = selected
    ? [...editingPermissions].sort().join("|") !== selected.permissions.map((permission) => permissionKey(permission.resource, permission.action)).sort().join("|")
    : false;

  const savePermissions = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await api(`/api/admin/roles/${selected.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions: [...editingPermissions] }),
      });
      setRoles((prev) => prev.map((role) => role.id === selected.id ? data.role : role));
      notify("Droits d'accès enregistrés.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const openGroupForm = (group?: RoleGroup) => {
    setGroupForm(group ? {
      id: group.id, name: group.name, description: group.description ?? "",
      color: group.color || "#6366f1", parentId: group.parentId ?? "",
    } : { id: "", name: "", description: "", color: "#6366f1", parentId: "" });
  };

  const saveGroup = async () => {
    if (!groupForm.name.trim()) return notify("Le nom du groupe est obligatoire.", "error");
    setSaving(true);
    try {
      await api("/api/admin/role-groups", {
        method: groupForm.id ? "PATCH" : "POST",
        body: JSON.stringify({
          id: groupForm.id || undefined,
          name: groupForm.name.trim(),
          description: groupForm.description,
          color: groupForm.color,
          parentId: groupForm.parentId || null,
        }),
      });
      setGroupForm({ id: "", name: "", description: "", color: "#6366f1", parentId: "" });
      await fetchAll();
      notify("Groupe enregistré.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (group: RoleGroup) => {
    if (!confirm(`Supprimer le groupe « ${group.name} » ? Les rôles seront conservés sans groupe.`)) return;
    setSaving(true);
    try {
      await api(`/api/admin/role-groups?id=${encodeURIComponent(group.id)}`, { method: "DELETE" });
      await fetchAll();
      notify("Groupe supprimé.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const openRuleForm = (rule?: RecordRule) => {
    setRuleForm(rule ? {
      id: rule.id, name: rule.name, description: rule.description ?? "", resource: rule.resource,
      domain: rule.domain || "[]", operations: rule.operations.split(",").filter(Boolean),
      targetType: rule.roleId ? "ROLE" : rule.groupId ? "GROUP" : "GLOBAL",
      targetId: rule.roleId ?? rule.groupId ?? "", active: rule.active,
    } : {
      id: "", name: "", description: "", resource: "ASSOCIATIONS", domain: "[]",
      operations: ["READ"], targetType: selected ? "ROLE" : "GLOBAL",
      targetId: selected?.id ?? "", active: true,
    });
    setRuleOpen(true);
  };

  const saveRule = async () => {
    if (!ruleForm.name.trim()) return notify("Le nom de la règle est obligatoire.", "error");
    try {
      const parsed = JSON.parse(ruleForm.domain || "[]");
      if (!Array.isArray(parsed)) throw new Error("Le domaine doit être une liste JSON.");
    } catch {
      return notify("Le domaine doit être un JSON valide, par exemple [[\"status\",\"=\",\"ACTIVE\"]].", "error");
    }
    setSaving(true);
    try {
      const target = ruleForm.targetType === "ROLE"
        ? { roleId: ruleForm.targetId || selected?.id, groupId: null }
        : ruleForm.targetType === "GROUP"
          ? { roleId: null, groupId: ruleForm.targetId }
          : { roleId: null, groupId: null };
      if (ruleForm.targetType !== "GLOBAL" && !target.roleId && !target.groupId) {
        throw new Error("Sélectionnez le rôle ou le groupe cible.");
      }
      await api("/api/admin/record-rules", {
        method: ruleForm.id ? "PATCH" : "POST",
        body: JSON.stringify({
          id: ruleForm.id || undefined,
          name: ruleForm.name.trim(),
          description: ruleForm.description,
          resource: ruleForm.resource,
          domain: ruleForm.domain,
          operations: ruleForm.operations,
          active: ruleForm.active,
          ...target,
        }),
      });
      setRuleOpen(false);
      await fetchAll();
      notify("Règle d'enregistrement enregistrée.");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (rule: RecordRule) => {
    if (!confirm(`Supprimer la règle « ${rule.name} » ?`)) return;
    try {
      await api(`/api/admin/record-rules?id=${encodeURIComponent(rule.id)}`, { method: "DELETE" });
      await fetchAll();
      notify("Règle supprimée.");
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const unassignUser = async (user: AdminUser) => {
    if (!confirm(`Retirer le rôle de ${user.name} ?`)) return;
    try {
      await api(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ systemRoleId: null }) });
      setRoleUsers((prev) => prev.filter((item) => item.id !== user.id));
      await fetchAll();
      notify("Utilisateur retiré du rôle.");
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const visibleRules = rules.filter((rule) => !selected || !rule.roleId && !rule.groupId || rule.roleId === selected.id || (selected.groupId && rule.groupId === selected.groupId));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {toast && (
        <div className={`fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-2xl ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Rôles &amp; permissions</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Droits d&apos;accès, groupes et règles d&apos;enregistrement inspirés du modèle Odoo.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Nouveau rôle
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
        <p><strong>Modèle RBAC.</strong> Un rôle reçoit des droits par ressource (lire, créer, modifier, supprimer). Les groupes classent les rôles et peuvent porter des règles d&apos;enregistrement qui filtrent les données visibles. L&apos;Admin Principal reste immutable.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <aside className="space-y-3 xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex gap-2">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un rôle…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:bg-white" />
              <button onClick={() => setGroupOpen(true)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50" title="Gérer les groupes">
                <FolderTree className="h-4 w-4" /> {groups.length}
              </button>
            </div>
            <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none">
              <option value="">Tous les groupes</option>
              <option value="__none__">Sans groupe</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            {loading ? <div className="flex justify-center rounded-2xl border border-slate-100 bg-white py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
              : filteredRoles.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs font-semibold text-slate-400">Aucun rôle ne correspond à votre recherche.</div>
                : filteredRoles.map((role) => (
                  <div key={role.id} onClick={() => selectRole(role)} className={`cursor-pointer rounded-2xl border bg-white p-4 transition ${selectedId === role.id ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-indigo-200"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${selectedId === role.id ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-500"}`}>
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black text-slate-900">{role.name}</p>
                          {role.name === "Admin Principal" && <Lock className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{role.description || "Sans description"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {role._count?.users ?? 0} utilisateur(s)</span>
                          <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> {role.permissions.length} droit(s)</span>
                          {role.group && <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${role.group.color}18`, color: role.group.color }}>{role.group.name}</span>}
                        </div>
                      </div>
                      <ChevronRight className={`mt-1 h-4 w-4 flex-shrink-0 ${selectedId === role.id ? "text-indigo-500" : "text-slate-300"}`} />
                    </div>
                  </div>
                ))}
          </div>
        </aside>

        <section className="min-w-0 xl:col-span-8">
          {!selected ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
              <ShieldCheck className="mb-4 h-14 w-14 text-slate-200" />
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-400">Sélectionnez un rôle</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-400">Choisissez un rôle à gauche ou créez-en un nouveau pour configurer ses droits, ses règles et ses utilisateurs.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                {editingInfo ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom du rôle</label>
                    <input value={infoForm.name} onChange={(event) => setInfoForm((prev) => ({ ...prev, name: event.target.value }))} disabled={selected.name === "Admin Principal"} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-bold text-slate-900 outline-none focus:border-indigo-300 disabled:bg-slate-50" />
                    <input value={infoForm.description} onChange={(event) => setInfoForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-300" />
                    <div className="flex flex-wrap gap-2">
                      <select value={infoForm.groupId} onChange={(event) => setInfoForm((prev) => ({ ...prev, groupId: event.target.value }))} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none">
                        <option value="">Sans groupe</option>
                        {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                      </select>
                      <button onClick={saveInfo} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Enregistrer</button>
                      <button onClick={() => setEditingInfo(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-2xl font-black tracking-tight text-slate-900">{selected.name}</h2>
                        {selected.group && <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide" style={{ backgroundColor: `${selected.group.color}18`, color: selected.group.color }}>{selected.group.name}</span>}
                        {selected.name === "Admin Principal" && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">Protégé</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{selected.description || "Aucune description."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setEditingInfo(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Modifier</button>
                      <button onClick={cloneRole} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" /> Dupliquer</button>
                      {selected.name !== "Admin Principal" && <button onClick={() => deleteRole(selected)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5 pt-2">
                {([
                  ["permissions", "Droits d'accès", Lock],
                  ["rules", `Règles d'enregistrement (${visibleRules.length})`, ListChecks],
                  ["users", `Utilisateurs (${selected._count?.users ?? 0})`, Users],
                ] as const).map(([key, label, Icon]) => (
                  <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-xs font-black transition ${tab === key ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-700"}`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              {tab === "permissions" && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                    <p className="text-xs text-slate-500">Cochez les opérations autorisées par ressource. Les modifications sont appliquées à tous les écrans et API protégés par ce rôle.</p>
                    {selected.name !== "Admin Principal" && permissionsChanged && <button onClick={savePermissions} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" /> Appliquer</button>}
                  </div>
                  {selected.name === "Admin Principal" && <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs font-semibold text-amber-800"><Lock className="h-4 w-4" /> Les droits de l&apos;Admin Principal sont protégés et ne peuvent pas être modifiés.</div>}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="bg-white text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-5 py-4 text-left">Ressource</th>
                          {ACTIONS.map((action) => <th key={action} className="px-3 py-4 text-center">{ACTION_LABELS[action]}</th>)}
                          <th className="px-3 py-4 text-center">Tout</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resourceList.map((resource) => {
                          const all = ACTIONS.every((action) => editingPermissions.has(permissionKey(resource, action)));
                          const some = ACTIONS.some((action) => editingPermissions.has(permissionKey(resource, action)));
                          return (
                            <tr key={resource} className="hover:bg-indigo-50/20">
                              <td className="px-5 py-3">
                                <p className="text-xs font-black text-slate-800">{RESOURCE_LABELS[resource] ?? resource}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{resource}</p>
                              </td>
                              {ACTIONS.map((action) => {
                                const active = editingPermissions.has(permissionKey(resource, action));
                                return (
                                  <td key={action} className="px-3 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => togglePermission(resource, action)}
                                      disabled={selected.name === "Admin Principal"}
                                      aria-label={`${resource} ${action}`}
                                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-300 hover:border-slate-300"} disabled:cursor-not-allowed`}
                                    >
                                      {active ? <Check className="h-4 w-4" /> : <X className="h-3.5 w-3.5" />}
                                    </button>
                                  </td>
                                );
                              })}
                              <td className="px-3 py-3 text-center">
                                <button type="button" onClick={() => toggleResource(resource)} disabled={selected.name === "Admin Principal"} className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg ${all ? "bg-slate-900 text-white" : some ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-300"} disabled:cursor-not-allowed`}>
                                  {all ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "rules" && (
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="inline-flex items-center gap-2 text-sm font-black text-slate-900"><ListChecks className="h-4 w-4 text-indigo-600" /> Règles d&apos;enregistrement</h3>
                      <p className="mt-1 text-xs text-slate-500">Elles limitent les enregistrements visibles ou modifiables. Les règles globales sont cumulatives, les règles du rôle et de son groupe sont alternatives.</p>
                    </div>
                    <button onClick={() => openRuleForm()} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white"><Plus className="h-3.5 w-3.5" /> Nouvelle règle</button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {visibleRules.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">Aucune règle pour ce rôle ou son groupe.</div> : visibleRules.map((rule) => (
                      <div key={rule.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-slate-900">{rule.name}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${rule.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{rule.active ? "Active" : "Inactive"}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{rule.resource} · {rule.operations} · {rule.role?.name ? `Rôle ${rule.role.name}` : rule.group?.name ? `Groupe ${rule.group.name}` : "Global"}</p>
                            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-2 text-[11px] text-emerald-300">{rule.domain}</pre>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openRuleForm(rule)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" title="Modifier"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => deleteRule(rule)} className="rounded-lg p-2 text-red-300 hover:bg-red-50 hover:text-red-600" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "users" && (
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h3 className="text-sm font-black text-slate-900">Utilisateurs avec ce rôle</h3><p className="mt-1 text-xs text-slate-500">Un utilisateur ne peut avoir qu&apos;un rôle système dans cette version.</p></div>
                    <a href="/admin/users" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Gérer les utilisateurs</a>
                  </div>
                  <div className="mt-4 space-y-2">
                    {usersLoading ? <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div> : roleUsers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">Aucun utilisateur associé.</div> : roleUsers.map((user) => (
                      <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><UserRound className="h-4 w-4" /></div>
                          <div><p className="text-sm font-bold text-slate-800">{user.name}</p><p className="text-xs text-slate-400">{user.email} · {user.isActive ? "Actif" : "Inactif"}</p></div>
                        </div>
                        <button onClick={() => unassignUser(user)} className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Retirer le rôle</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-black text-slate-900">Nouveau rôle</h2><p className="mt-1 text-sm text-slate-500">Créez le rôle puis ajustez sa matrice de droits.</p></div>
              <button onClick={() => setCreateOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Nom du rôle *</label>
              <input autoFocus value={newRole.name} onChange={(event) => setNewRole((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ex. Auditeur financier" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-indigo-400" />
              <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Description</label>
              <textarea value={newRole.description} onChange={(event) => setNewRole((prev) => ({ ...prev, description: event.target.value }))} rows={3} placeholder="Responsabilité et périmètre du rôle…" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-400" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Groupe</label><select value={newRole.groupId} onChange={(event) => setNewRole((prev) => ({ ...prev, groupId: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"><option value="">Sans groupe</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
                <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Droits initiaux</label><select value={newRole.template} onChange={(event) => setNewRole((prev) => ({ ...prev, template: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none">{TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}</select></div>
              </div>
              <p className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-700">Le rôle est créé immédiatement. S&apos;il n&apos;a aucun droit, il ne pourra pas accéder à la console tant que la matrice n&apos;a pas été configurée.</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Annuler</button>
              <button onClick={createRole} disabled={saving || !newRole.name.trim()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Créer le rôle</button>
            </div>
          </div>
        </div>
      )}

      {groupOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setGroupOpen(false); }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">Groupes de rôles</h2><p className="mt-1 text-sm text-slate-500">Organisez les rôles par fonction, comme les groupes Odoo.</p></div><button onClick={() => setGroupOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{groupForm.id ? "Modifier le groupe" : "Créer un groupe"}</p>
                <input value={groupForm.name} onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nom du groupe *" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
                <textarea value={groupForm.description} onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" rows={2} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">Couleur<input type="color" value={groupForm.color} onChange={(event) => setGroupForm((prev) => ({ ...prev, color: event.target.value }))} className="h-6 w-8 border-0 bg-transparent" /></label>
                  <select value={groupForm.parentId} onChange={(event) => setGroupForm((prev) => ({ ...prev, parentId: event.target.value }))} className="rounded-xl border border-slate-200 px-2 py-2 text-xs outline-none"><option value="">Groupe racine</option>{groups.filter((group) => group.id !== groupForm.id).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
                </div>
                <div className="flex gap-2"><button onClick={saveGroup} disabled={saving || !groupForm.name.trim()} className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-black text-white disabled:opacity-50">{groupForm.id ? "Enregistrer" : "Créer"}</button>{groupForm.id && <button onClick={() => openGroupForm()} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600">Annuler</button>}</div>
              </div>
              <div className="space-y-2">
                {groups.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">Aucun groupe.</div> : groups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="flex items-center gap-2 truncate text-sm font-bold text-slate-800"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />{group.name}</p><p className="mt-1 text-[11px] text-slate-400">{group._count?.roles ?? 0} rôle(s) · {group.parent?.name ? `sous ${group.parent.name}` : "racine"}</p></div>
                      <div className="flex gap-1"><button onClick={() => openGroupForm(group)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => deleteGroup(group)} className="rounded-lg p-1.5 text-red-300 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div>
                    </div>
                    <button onClick={() => { setGroupFilter(group.id); setGroupOpen(false); }} className="mt-2 text-[10px] font-black uppercase tracking-wide text-indigo-600">Filtrer les rôles</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {ruleOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setRuleOpen(false); }}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">{ruleForm.id ? "Modifier la règle" : "Nouvelle règle d'enregistrement"}</h2><p className="mt-1 text-sm text-slate-500">Filtrez les enregistrements que ce rôle peut voir ou modifier.</p></div><button onClick={() => setRuleOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Nom *</label><input value={ruleForm.name} onChange={(event) => setRuleForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ex. Associations du Cameroun" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" /></div>
                <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Ressource</label><select value={ruleForm.resource} onChange={(event) => setRuleForm((prev) => ({ ...prev, resource: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none">{resourceList.map((resource) => <option key={resource} value={resource}>{RESOURCE_LABELS[resource] ?? resource}</option>)}</select></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Cible</label><select value={ruleForm.targetType} onChange={(event) => setRuleForm((prev) => ({ ...prev, targetType: event.target.value, targetId: event.target.value === "ROLE" ? (selected?.id ?? "") : event.target.value === "GROUP" ? (selectedGroup?.id ?? "") : "" }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"><option value="ROLE">Rôle actuel</option><option value="GROUP">Groupe</option><option value="GLOBAL">Global (tous)</option></select></div>
                {ruleForm.targetType === "GROUP" && <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Groupe</label><select value={ruleForm.targetId} onChange={(event) => setRuleForm((prev) => ({ ...prev, targetId: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none">{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>}
                {ruleForm.targetType === "ROLE" && <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Rôle</label><select value={ruleForm.targetId} onChange={(event) => setRuleForm((prev) => ({ ...prev, targetId: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none">{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div>}
              </div>
              <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Domaine JSON (Odoo)</label><textarea value={ruleForm.domain} onChange={(event) => setRuleForm((prev) => ({ ...prev, domain: event.target.value }))} rows={4} spellCheck={false} className="w-full rounded-xl border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-xs text-emerald-300 outline-none focus:border-indigo-400" /><p className="mt-1 text-[11px] text-slate-400">Exemples : <code>[["status","=","ACTIVE"]]</code>, <code>[["country","=","CM"]]</code>, <code>[]</code> (tous).</p></div>
              <div><label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Opérations</label><div className="flex flex-wrap gap-3">{RECORD_RULE_OPERATIONS.map((operation) => <label key={operation} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"><input type="checkbox" checked={ruleForm.operations.includes(operation)} onChange={(event) => setRuleForm((prev) => ({ ...prev, operations: event.target.checked ? [...prev.operations, operation] : prev.operations.filter((item) => item !== operation) }))} />{operation}</label>)}</div></div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={ruleForm.active} onChange={(event) => setRuleForm((prev) => ({ ...prev, active: event.target.checked }))} /> Règle active</label>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setRuleOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Annuler</button><button onClick={saveRule} disabled={saving || !ruleForm.name.trim()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Enregistrer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
