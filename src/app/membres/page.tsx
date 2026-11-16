"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getInitials, getLevelInfo } from "@/lib/utils";
import { Users, Search, Filter, Mail, Phone, MessageSquare, ShieldCheck, Star, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { KycBadge } from "@/components/kyc/kyc-badge";

export default function MembresPage() {
  const [tontines, setTontines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [refEmails, setRefEmails] = useState(["", "", "", "", ""]);
  const [refStatus, setRefStatus] = useState<{ msg: string; score?: number } | null>(null);
  const [refLoading, setRefLoading] = useState(false);

  const sendDiscoveryInvite = async (channel: "EMAIL" | "WHATSAPP") => {
    const emails = refEmails.map((e) => e.trim()).filter(Boolean);
    if (channel === "EMAIL" && emails.length === 0) {
      setRefStatus({ msg: "Veuillez saisir au moins un email (max 5)." });
      return;
    }
    setRefLoading(true);
    setRefStatus(null);
    try {
      const res = await fetch("/api/referrals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefStatus({ msg: data.error || "Erreur lors de l'envoi." });
      } else {
        setRefStatus({
          msg: `+${data.pointsAwarded} points Gamification ! Score total : ${data.newScore} pts`,
          score: data.newScore,
        });
        if (channel === "EMAIL") setRefEmails(["", "", "", "", ""]);
        if (channel === "WHATSAPP" && data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      setRefStatus({ msg: "Erreur réseau." });
    } finally {
      setRefLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/tontines?mine=true")
      .then(r => r.json())
      .then(async d => {
        const tontineList = d.tontines || [];
        const tontineData = await Promise.all(
          tontineList.map((t: any) =>
            fetch(`/api/tontines/${t.id}`)
              .then(r => r.json())
              .then(td => ({ ...t, members: td.tontine?.memberships || [] }))
          )
        );
        setTontines(tontineData);
        setLoading(false);
      });
  }, []);

  const allMembers = useMemo(() => {
    const members: any[] = [];
    const seen = new Set<string>();
    tontines.forEach(t => {
      t.members?.forEach((m: any) => {
        if (!seen.has(m.user.id)) {
          seen.add(m.user.id);
          members.push({ ...m.user, role: m.role, tontineName: t.name });
        }
      });
    });
    return members;
  }, [tontines]);

  const filteredMembers = allMembers.filter(m =>
    (roleFilter === "ALL" || m.role === roleFilter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.tontineName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout title="Communauté & Réseau">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Votre Réseau de Confiance</h1>
              <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
                Retrouvez tous les membres de vos différentes tontines et associations. 
                Collaborez, échangez et renforcez les liens au sein de votre communauté.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-xl text-center">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Membres Connectés</div>
                <div className="text-3xl font-black">{allMembers.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Faire découvrir Tchoua & gagner des points</h2>
              <p className="text-xs text-slate-500">
                Invitez jusqu&apos;à 5 personnes par email ou partagez votre lien sur WhatsApp (Web & Mobile) pour gagner des points Gamification.
              </p>
            </div>
            <button
              type="button"
              disabled={refLoading}
              onClick={() => sendDiscoveryInvite("WHATSAPP")}
              className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Partager sur WhatsApp (+15 pts)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {refEmails.map((val, idx) => (
              <input
                key={idx}
                type="email"
                placeholder={`Email ${idx + 1}`}
                value={val}
                onChange={(e) => {
                  const next = [...refEmails];
                  next[idx] = e.target.value;
                  setRefEmails(next);
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={refLoading}
              onClick={() => sendDiscoveryInvite("EMAIL")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {refLoading ? "Envoi..." : "Envoyer les invitations (+10 pts / ami)"}
            </button>
            {refStatus && (
              <span className="text-xs font-semibold text-emerald-700">{refStatus.msg}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
            <input 
              type="text" 
              placeholder="Rechercher un membre par nom ou association..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-warm-white border border-stone rounded-2xl outline-none text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-600/5 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-full w-full appearance-none rounded-2xl border border-stone bg-warm-white py-4 pl-11 pr-10 text-xs font-semibold uppercase tracking-wide text-graphite outline-none"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="PRESIDENT">Président</option>
              <option value="TREASURER">Trésorier</option>
              <option value="SECRETARY">Secrétaire</option>
              <option value="MEMBER">Membre</option>
            </select>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-warm-white rounded-xl p-8 border border-stone shadow-sm animate-pulse h-64" />
            ))
          ) : filteredMembers.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-warm-white rounded-2xl border border-stone">
              <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-black text-ash/60 uppercase tracking-widest">Aucun membre trouvé</p>
            </div>
          ) : (
            filteredMembers.map((m: any) => {
              const level = getLevelInfo(m.level || "NOVICE");
              return (
                <div key={m.id} className="bg-warm-white rounded-xl p-6 border border-stone shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-500/20">
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal group-hover:text-info transition-colors">{m.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] text-xs font-medium text-ash uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          m.role === "PRESIDENT" ? "bg-violet-100 text-violet-700" :
                          m.role === "TREASURER" ? "bg-forest/10 text-forest" :
                          "bg-gray-100 text-graphite"
                        }`}>
                          {m.role}
                        </span>
                        <span className="text-[10px] text-ash font-bold truncate max-w-[100px]">@{m.tontineName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                    <div className="bg-cream rounded-2xl p-3 text-center">
                      <div className="text-[8px] font-black text-ash uppercase tracking-widest mb-1">Score Reput.</div>
                      <div className="text-sm font-semibold text-charcoal">{m.score || 0} pts</div>
                    </div>
                    <div className="bg-cream rounded-2xl p-3 text-center">
                      <div className="text-[8px] font-black text-ash uppercase tracking-widest mb-1">Niveau</div>
                      <div className="text-sm font-black text-info">{level.icon} {level.label}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 relative z-10">
                    <Link
                      href={`/chat?to=${m.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-blue-600 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Link>
                    <Link href={`/chat`} className="w-12 flex items-center justify-center rounded-xl bg-cream text-ash hover:bg-gray-100 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
