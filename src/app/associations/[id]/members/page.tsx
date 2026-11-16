"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Users, Search, UserPlus, Filter, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { KycBadge } from "@/components/kyc/kyc-badge";

export default function MembersDirectoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [inviteOpen, setInviteOpen] = useState(searchParams.get("invite") === "1");
  const [inviteTab, setInviteTab] = useState<"single" | "import" | "discover">("single");
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    country: "",
    city: "",
    phone: "",
    email: "",
    language: "fr",
  });
  const [submitting, setSubmitting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<any>(null);
  const [inviteError, setInviteError] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [referralEmails, setReferralEmails] = useState(["", "", "", "", ""]);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [referralResult, setReferralResult] = useState<any>(null);

  const reloadMembers = () => {
    fetch(`/api/associations/${id}/members${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.members) setMembers(data.members);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    reloadMembers();
  }, [id, statusFilter]);

  useEffect(() => {
    if (inviteOpen && !referralInfo) {
      fetch("/api/referrals/invite")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setReferralInfo(d); })
        .catch(() => {});
    }
  }, [inviteOpen, referralInfo]);

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteFeedback(null);
    if (!form.phone.trim() && !form.email.trim()) {
      setInviteError("Le numéro mobile ou l'email est obligatoire.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/associations/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Erreur lors de l'ajout du membre");
      } else {
        setInviteFeedback(data);
        setForm({ lastName: "", firstName: "", country: "", city: "", phone: "", email: "", language: "fr" });
        reloadMembers();
      }
    } catch {
      setInviteError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setInviteError("Sélectionnez un fichier CSV, Excel (CSV) ou vCard (.vcf).");
      return;
    }
    setInviteError("");
    setImportResult(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await fetch(`/api/associations/${id}/members/import`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Erreur lors de l'import");
      } else {
        setImportResult(data);
        reloadMembers();
      }
    } catch {
      setInviteError("Erreur réseau lors de l'import");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReferrals = async (channel: "EMAIL" | "WHATSAPP") => {
    setInviteError("");
    setReferralResult(null);
    const emails = referralEmails.map((e) => e.trim()).filter(Boolean);
    if (channel === "EMAIL" && emails.length === 0) {
      setInviteError("Saisissez au moins une adresse email (jusqu'à 5).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/referrals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Erreur lors de l'envoi");
      } else {
        setReferralResult(data);
        if (channel === "EMAIL") setReferralEmails(["", "", "", "", ""]);
        if (channel === "WHATSAPP" && data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      setInviteError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/associations/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setJoinCode(d?.association?.joinCode ?? ""))
      .catch(() => {});
  }, [id]);

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

            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 bg-forest text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a2f1f] transition"
            >
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
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-gray-900">{m.user.name}</span>
                              <KycBadge level={m.user.kycLevel} status={m.user.kycStatus} />
                            </div>
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

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Ajouter ou inviter un membre</h2>
              <button onClick={() => setInviteOpen(false)} className="text-sm text-slate-500 hover:text-slate-700">✕</button>
            </div>

            <div className="mt-4 flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setInviteTab("single"); setInviteError(""); }}
                className={`rounded-lg px-3 py-1.5 ${inviteTab === "single" ? "bg-forest text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Ajout libre
              </button>
              <button
                type="button"
                onClick={() => { setInviteTab("import"); setInviteError(""); }}
                className={`rounded-lg px-3 py-1.5 ${inviteTab === "import" ? "bg-forest text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Import CSV / Excel / Contacts
              </button>
              <button
                type="button"
                onClick={() => { setInviteTab("discover"); setInviteError(""); }}
                className={`rounded-lg px-3 py-1.5 ${inviteTab === "discover" ? "bg-forest text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Code & Parrainage (+Pts)
              </button>
            </div>

            {inviteError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {inviteError}
              </div>
            )}

            {inviteTab === "single" && (
              <form onSubmit={handleSingleInvite} className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Réservé au bureau/fondateur. Mobile ou email obligatoire (unique sur toute la plateforme).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Pays"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Ville"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile (ex: +2376...)"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="fr">Langue : Français</option>
                  <option value="en">Langue : English</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-forest py-2.5 text-sm font-semibold text-white hover:bg-[#0a2f1f] disabled:opacity-50"
                >
                  {submitting ? "Envoi en cours..." : "Ajouter et envoyer l'invitation"}
                </button>

                {inviteFeedback && (
                  <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    <div className="font-semibold">
                      {inviteFeedback.status === "ALREADY_MEMBER"
                        ? "Cette personne est déjà membre de l'association."
                        : inviteFeedback.existingAccount
                        ? "Compte existant détecté : invitation envoyée pour rejoindre l'association."
                        : "Nouveau membre invité (passera à KYC1 dès confirmation)."}
                    </div>
                    {inviteFeedback.emailSent && <div>Email HTML professionnel envoyé.</div>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {inviteFeedback.whatsappUrl && (
                        <a
                          href={inviteFeedback.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-green-600 px-3 py-1.5 font-semibold text-white"
                        >
                          Envoyer via WhatsApp
                        </a>
                      )}
                      {inviteFeedback.smsUrl && (
                        <a
                          href={inviteFeedback.smsUrl}
                          className="rounded-lg bg-slate-700 px-3 py-1.5 font-semibold text-white"
                        >
                          Envoyer par SMS
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </form>
            )}

            {inviteTab === "import" && (
              <form onSubmit={handleImportSubmit} className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Importez un fichier CSV (export Excel UTF-8 : nom, prenom, pays, ville, mobile, email, langue) ou un fichier Contacts vCard (.vcf).
                </p>
                <input
                  type="file"
                  accept=".csv,.vcf,.txt"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={submitting || !importFile}
                  className="w-full rounded-xl bg-forest py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Import en cours..." : "Importer et inviter les membres"}
                </button>
                {importResult && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 space-y-1">
                    <div className="font-semibold">Import terminé : {importResult.totalProcessed} ligne(s) traitée(s)</div>
                    <div>Invités : {importResult.invited} | Déjà membres : {importResult.alreadyMembers} | Erreurs : {importResult.errors}</div>
                  </div>
                )}
              </form>
            )}

            {inviteTab === "discover" && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Code d&apos;adhésion de l&apos;association :</p>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="flex-1 text-center font-mono text-lg font-bold tracking-[0.25em] text-slate-900">
                      {joinCode || "—"}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(joinCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      disabled={!joinCode}
                      className="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {copied ? "Copié" : "Copier"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-800">
                    Faire découvrir Tchoua & gagner des points Gamification (+10 pts / email, +15 pts WhatsApp)
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {referralEmails.map((val, idx) => (
                      <input
                        key={idx}
                        type="email"
                        placeholder={`Email ami ${idx + 1} (optionnel)`}
                        value={val}
                        onChange={(e) => {
                          const next = [...referralEmails];
                          next[idx] = e.target.value;
                          setReferralEmails(next);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSendReferrals("EMAIL")}
                      className="flex-1 rounded-xl bg-forest py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Envoyer (max 5 emails)
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSendReferrals("WHATSAPP")}
                      className="flex-1 rounded-xl border border-green-300 bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
                    >
                      Partager sur WhatsApp
                    </button>
                  </div>
                  {referralResult && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                      +{referralResult.pointsAwarded} points gagnés ! Nouveau score : {referralResult.newScore} pts.
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setInviteOpen(false)} className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600">
              Fermer
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
