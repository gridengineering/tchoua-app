"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Filter, Loader2, Search, ShieldAlert, ShieldCheck, X, XCircle } from "lucide-react";
import { KycBadge } from "@/components/kyc/kyc-badge";
import { kycLevelInfo } from "@/lib/kyc";

type KycDoc = { id: string; type: string; label: string; mimeType: string; size: number; status: string };
type KycRequest = {
  id: string; requestedLevel: number; status: string; createdAt: string;
  fullName?: string | null; idType?: string | null; idNumber?: string | null;
  address?: string | null; city?: string | null; sourceOfFunds?: string | null;
  documentRef?: string | null; documents: KycDoc[];
};
type AdminUser = {
  id: string; name: string; email: string; phone?: string | null;
  kycLevel: number; kycStatus: string; kycVerifiedAt?: string | null;
  emailVerifiedAt?: string | null; phoneVerifiedAt?: string | null; whatsappVerifiedAt?: string | null;
  quarantinedAt?: string | null; quarantineReason?: string | null; createdAt: string;
  assocMemberships: Array<{ id: string; role: string; status: string; association: { id: string; name: string; trustLevel: number } }>;
  kycRequests: KycRequest[];
};

const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-900";
const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

export default function AdminKycPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [associationId, setAssociationId] = useState("");
  const [groupBy, setGroupBy] = useState<"NONE" | "ASSOCIATION" | "KYC" | "STATUS">("ASSOCIATION");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (level) params.set("kycLevel", level);
      if (status) params.set("status", status);
      if (associationId) params.set("associationId", associationId);
      const res = await fetch(`/api/admin/kyc?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setUsers(json.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [level, status, associationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const associations = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => u.assocMemberships.forEach((m) => map.set(m.association.id, m.association.name)));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle));
  }, [users, q]);

  const groups = useMemo(() => {
    const map = new Map<string, AdminUser[]>();
    for (const user of filtered) {
      let key = "Tous les membres";
      if (groupBy === "ASSOCIATION") key = user.assocMemberships[0]?.association.name ?? "Sans association";
      if (groupBy === "KYC") key = `KYC ${user.kycLevel} · ${kycLevelInfo(user.kycLevel).label}`;
      if (groupBy === "STATUS") key = user.quarantinedAt ? "En quarantaine" : user.kycStatus;
      const rows = map.get(key) ?? [];
      rows.push(user);
      map.set(key, rows);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, groupBy]);

  const review = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    const note = decision === "REJECT" ? window.prompt("Motif du refus (optionnel)") ?? undefined : undefined;
    setBusy(true); setNotice(null); setError(null);
    try {
      const res = await fetch("/api/kyc/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision, note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Validation impossible");
      setNotice(decision === "APPROVE" ? "KYC approuvé. Le niveau est désormais actif sur toutes les associations du membre." : "Demande KYC refusée.");
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setBusy(false); }
  };

  const quarantine = async (user: AdminUser) => {
    const action = user.quarantinedAt ? "RELEASE" : "QUARANTINE";
    const reason = action === "QUARANTINE" ? window.prompt("Motif de la quarantaine :") ?? undefined : undefined;
    if (action === "QUARANTINE" && !reason) return;
    const res = await fetch("/api/admin/quarantine", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "user", id: user.id, action, reason }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error ?? "Action impossible"); return; }
    setNotice(action === "QUARANTINE" ? "Membre placé en quarantaine." : "Quarantaine levée.");
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conformité KYC & membres</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tous les membres de la plateforme, filtres et regroupements type Odoo, validation des pièces et quarantaine.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> {filtered.length} membre(s) affiché(s)
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className={labelCls}>Recherche</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className={`${inputCls} w-full pl-9`} placeholder="Nom, e-mail, téléphone…" />
            </span>
          </label>
          <label>
            <span className={labelCls}>Niveau KYC</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
              <option value="">Tous</option>
              <option value="0">KYC 0</option><option value="1">KYC 1</option><option value="2">KYC 2</option><option value="3">KYC 3</option>
            </select>
          </label>
          <label>
            <span className={labelCls}>Statut</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="">Tous</option>
              <option value="PENDING">En vérification</option>
              <option value="VERIFIED">Vérifié</option>
              <option value="NONE">Non vérifié</option>
              <option value="REJECTED">Refusé</option>
              <option value="QUARANTINED">En quarantaine</option>
            </select>
          </label>
          <label>
            <span className={labelCls}>Association</span>
            <select value={associationId} onChange={(e) => setAssociationId(e.target.value)} className={inputCls}>
              <option value="">Toutes</option>
              {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label>
            <span className={labelCls}>Regrouper par</span>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} className={inputCls}>
              <option value="ASSOCIATION">Association</option>
              <option value="KYC">Niveau KYC</option>
              <option value="STATUS">Statut</option>
              <option value="NONE">Aucun</option>
            </select>
          </label>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
            <Filter className="h-3.5 w-3.5" /> Filtrer
          </button>
        </div>
      </div>

      {error ? <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4" />{error}</div> : null}
      {notice ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</div> : null}

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
      ) : (
        <div className="space-y-5">
          {groups.map(([key, rows]) => (
            <section key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">{key}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{rows.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">Membre</th>
                      <th className="px-4 py-2.5">KYC</th>
                      <th className="px-4 py-2.5">Canaux vérifiés</th>
                      <th className="px-4 py-2.5">Associations</th>
                      <th className="px-4 py-2.5">Demande</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                          {user.quarantinedAt ? <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600"><ShieldAlert className="h-3 w-3" /> Quarantaine</div> : null}
                        </td>
                        <td className="px-4 py-3"><KycBadge level={user.kycLevel} status={user.kycStatus} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            <span className={user.emailVerifiedAt ? "text-emerald-700" : "text-slate-400"}>E-mail</span>
                            <span className={user.phoneVerifiedAt ? "text-emerald-700" : "text-slate-400"}>SMS</span>
                            <span className={user.whatsappVerifiedAt ? "text-emerald-700" : "text-slate-400"}>WhatsApp</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {user.assocMemberships.length ? user.assocMemberships.map((m) => m.association.name).join(", ") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {user.kycRequests[0] ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              KYC {user.kycRequests[0].requestedLevel} à valider
                            </span>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => setSelected(user)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                              Examiner
                            </button>
                            <button onClick={() => quarantine(user)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${user.quarantinedAt ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600"}`}>
                              {user.quarantinedAt ? "Libérer" : "Quarantaine"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          {groups.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Aucun membre ne correspond aux filtres.</div> : null}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-2 sm:p-4">
          <div className="h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                <p className="text-xs text-slate-500">{selected.email}</p>
                <div className="mt-1.5"><KycBadge level={selected.kycLevel} status={selected.kycStatus} size="md" /></div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5"><span className="block text-[10px] uppercase text-slate-400">E-mail</span>{selected.emailVerifiedAt ? "Vérifié" : "Non vérifié"}</div>
                <div className="rounded-lg bg-slate-50 p-2.5"><span className="block text-[10px] uppercase text-slate-400">Téléphone</span>{selected.phoneVerifiedAt ? "Vérifié" : "Non vérifié"}</div>
              </div>
              {selected.kycRequests[0] ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">Demande KYC {selected.kycRequests[0].requestedLevel}</h3>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div><dt className="text-[10px] uppercase text-slate-400">Nom légal</dt><dd>{selected.kycRequests[0].fullName ?? "—"}</dd></div>
                    <div><dt className="text-[10px] uppercase text-slate-400">Pièce</dt><dd>{selected.kycRequests[0].idType ?? "—"} {selected.kycRequests[0].idNumber ?? ""}</dd></div>
                    <div className="col-span-2"><dt className="text-[10px] uppercase text-slate-400">Adresse</dt><dd>{selected.kycRequests[0].address ?? "—"} {selected.kycRequests[0].city ?? ""}</dd></div>
                    <div className="col-span-2"><dt className="text-[10px] uppercase text-slate-400">Origine des fonds</dt><dd>{selected.kycRequests[0].sourceOfFunds ?? "—"}</dd></div>
                  </dl>
                  {selected.kycRequests[0].documents.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pièces jointes</p>
                      {selected.kycRequests[0].documents.map((doc) => (
                        <a key={doc.id} href={`/api/kyc/documents/${doc.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-amber-50">
                          <span>{doc.label} · {doc.type}</span><span className="text-slate-400">{doc.status}</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="mt-2 text-[11px] text-slate-500">Aucune pièce jointe.</p>}
                  <div className="mt-3 flex gap-2">
                    <button disabled={busy} onClick={() => review(selected.kycRequests[0].id, "APPROVE")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /> Approuver</button>
                    <button disabled={busy} onClick={() => review(selected.kycRequests[0].id, "REJECT")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" /> Refuser</button>
                  </div>
                </div>
              ) : <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">Aucune demande KYC en attente.</p>}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Associations</h3>
                <ul className="mt-2 space-y-1.5">
                  {selected.assocMemberships.map((m) => (
                    <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"><span>{m.association.name}</span><span className="text-slate-500">{m.role} · {m.status}</span></li>
                  ))}
                  {selected.assocMemberships.length === 0 ? <li className="text-xs text-slate-400">Aucune association.</li> : null}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
