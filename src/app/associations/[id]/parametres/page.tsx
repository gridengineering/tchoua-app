"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Plus, Shield, Trash2, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PERMISSIONS, ALL_PERMISSIONS, type Permission } from "@/lib/permissions";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "SOLIDARITY_OFFICER"];

type CustomRole = { id: string; name: string; color: string; permissions: string };

function parsePerms(json: string): Permission[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((p): p is Permission => p in PERMISSIONS) : [];
  } catch {
    return [];
  }
}

export default function AssociationSecurityPage() {
  const { id } = useParams<{ id: string }>();
  const [association, setAssociation] = useState<{ id: string; name: string } | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/associations/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setAssociation(d.association); setMyRole(d.myRole); })
      .finally(() => setLoading(false));
  }, [id]);

  const dissolve = async () => {
    if (!confirm("Dissoudre définitivement l'association ? Cette action est irréversible.")) return;
    const r = await fetch(`/api/associations/${id}`, { method: "DELETE" });
    if (r.ok) window.location.href = "/associations";
    else alert("Erreur lors de la dissolution");
  };

  const isBureau = Boolean(myRole && BUREAU_ROLES.includes(myRole));

  if (loading) {
    return <DashboardLayout title="Sécurité & rôles"><div className="p-8 text-center text-sm text-gray-500">Chargement…</div></DashboardLayout>;
  }

  if (!isBureau) {
    return (
      <DashboardLayout title="Sécurité & rôles">
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-amber-500" />
          <p className="font-semibold text-amber-900">Accès réservé au bureau</p>
          <Link href={`/associations/${id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d3d28]"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Sécurité & rôles — ${association?.name ?? ""}`}>
      <div className="mx-auto max-w-4xl space-y-5">
        <Link href={`/associations/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#0d3d28]">
          <ArrowLeft className="h-4 w-4" /> Retour à l&apos;association
        </Link>
        <div className="rounded-2xl border border-stone bg-white p-5">
          <h1 className="text-xl font-bold text-charcoal">Sécurité, rôles et zone sensible</h1>
          <p className="mt-1 text-sm text-gray-600">
            L&apos;identité, les contacts, le bureau, l&apos;adhésion, les réunions et le règlement se configurent
            désormais dans <Link href={`/associations/${id}/modifier`} className="font-semibold text-[#0d3d28] underline">Configurer l&apos;association</Link>.
            Cette page ne conserve que les rôles personnalisés et la dissolution.
          </p>
        </div>

        <CustomRolesSection associationId={id} />
        {(myRole === "PRESIDENT" || myRole === "FOUNDER") && (
          <section className="overflow-hidden rounded-xl border-2 border-red-200 bg-white">
            <div className="border-b border-red-200 bg-red-50 px-5 py-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-red-700"><AlertTriangle className="h-4 w-4" /> Zone de danger</h2>
              <p className="mt-0.5 text-xs text-red-600">Réservé au président ou au fondateur.</p>
            </div>
            <div className="p-5">
              <button onClick={dissolve} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                <Trash2 className="h-4 w-4" /> Dissoudre l&apos;association
              </button>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function CustomRolesSection({ associationId }: { associationId: string }) {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [editing, setEditing] = useState<CustomRole | "new" | null>(null);

  const reload = useCallback(() => {
    fetch(`/api/associations/${associationId}/roles`)
      .then((r) => r.json())
      .then((d) => setRoles(d.roles ?? []));
  }, [associationId]);

  useEffect(() => { reload(); }, [reload]);

  const remove = async (roleId: string) => {
    if (!confirm("Supprimer ce rôle ? Les membres concernés seront détachés.")) return;
    await fetch(`/api/associations/${associationId}/roles/${roleId}`, { method: "DELETE" });
    reload();
  };

  return (
    <section className="overflow-hidden rounded-xl border border-stone bg-white">
      <div className="flex items-center justify-between border-b border-stone px-5 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-charcoal"><Shield className="h-4 w-4" /> Rôles personnalisés</h2>
          <p className="mt-0.5 text-xs text-gray-500">Permissions cumulatives avec le rôle de base du membre.</p>
        </div>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white">
          <Plus className="h-3.5 w-3.5" /> Nouveau rôle
        </button>
      </div>
      <div className="space-y-2 p-5">
        {roles.length === 0 && <p className="text-sm italic text-gray-400">Aucun rôle personnalisé.</p>}
        {roles.map((role) => (
          <div key={role.id} className="flex items-start justify-between gap-3 rounded-lg border border-stone p-3">
            <div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: role.color }} /><span className="text-sm font-semibold">{role.name}</span></div>
              <p className="mt-1 text-xs text-gray-500">{parsePerms(role.permissions).length} permission(s)</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setEditing(role)} className="rounded border border-stone px-2 py-1 text-xs">Éditer</button>
              <button onClick={() => remove(role.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      {editing && <RoleEditor associationId={associationId} role={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </section>
  );
}

function RoleEditor({ associationId, role, onClose, onSaved }: { associationId: string; role: CustomRole | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(role?.name ?? "");
  const [color, setColor] = useState(role?.color ?? "#0d3d28");
  const [perms, setPerms] = useState<Permission[]>(role ? parsePerms(role.permissions) : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim()) return setError("Nom requis");
    setSaving(true); setError("");
    const url = role ? `/api/associations/${associationId}/roles/${role.id}` : `/api/associations/${associationId}/roles`;
    const res = await fetch(url, { method: role ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), color, permissions: perms }) });
    setSaving(false);
    if (res.ok) onSaved();
    else setError((await res.json().catch(() => ({}))).error ?? "Erreur");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone px-5 py-3"><h3 className="font-bold">{role ? "Éditer le rôle" : "Nouveau rôle"}</h3><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-[1fr_70px] gap-3">
            <input className="rounded-lg border border-stone px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du rôle" />
            <input type="color" className="h-10 w-full rounded-lg border border-stone" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-stone p-3">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-start gap-2 rounded p-1 text-sm hover:bg-cream">
                <input type="checkbox" className="mt-0.5 accent-[#0d3d28]" checked={perms.includes(perm)} onChange={() => setPerms((cur) => cur.includes(perm) ? cur.filter((p) => p !== perm) : [...cur, perm])} />
                <span>{PERMISSIONS[perm]} <span className="text-xs text-gray-400">{perm}</span></span>
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-stone px-5 py-3">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm">Annuler</button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-forest px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}
