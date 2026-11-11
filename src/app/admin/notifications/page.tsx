"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Send, Users, Building2, AlertTriangle, 
  CheckCircle2, Clock, History, Search, X,
  Megaphone, Info, RefreshCw, ShieldCheck
} from "lucide-react";

export default function AdminNotificationsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target: "ALL" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [mode, setMode] = useState<"ALL" | "ASSOCIATION" | "ROLE">("ALL");
  const [targetId, setTargetId] = useState("");
  const [associations, setAssociations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const TEMPLATES = [
    { id: "maintenance", label: "Maintenance planifiée", title: "Maintenance planifiée", message: "Une maintenance est prévue. La plateforme sera indisponible pendant quelques minutes. Merci de votre compréhension." },
    { id: "release", label: "Nouvelle version", title: "Nouvelle version disponible", message: "De nouvelles fonctionnalités sont disponibles sur Tchoua. Découvrez-les dès maintenant." },
    { id: "cotisation", label: "Rappel cotisation", title: "Rappel de cotisation", message: "Pensez à régler votre cotisation avant la prochaine session. Merci pour votre engagement." },
    { id: "security", label: "Alerte sécurité", title: "Alerte sécurité", message: "Une activité inhabituelle a été détectée. Nous vous invitons à vérifier vos paramètres de sécurité." },
  ];

  useEffect(() => {
    fetchHistory();
    fetch("/api/admin/associations").then((r) => (r.ok ? r.json() : null)).then((d) => setAssociations(d?.associations ?? [])).catch(() => {});
    fetch("/api/admin/roles").then((r) => (r.ok ? r.json() : null)).then((d) => setRoles(d?.roles ?? [])).catch(() => {});
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.notifications || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    if (mode !== "ALL" && !targetId) {
      setToast({ message: "Sélectionnez une cible", type: "error" });
      return;
    }
    setSending(true);
    try {
      const target = mode === "ALL" ? "ALL" : mode === "ROLE" ? `ROLE:${targetId}` : targetId;
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, target }),
      });
      if (res.ok) {
        setToast({ message: "Notification envoyée avec succès", type: "success" });
        setForm({ title: "", message: "", target: "ALL" });
        setMode("ALL");
        setTargetId("");
        fetchHistory();
      } else {
        setToast({ message: "Erreur lors de l'envoi", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Erreur serveur", type: "error" });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-4 px-8 py-4 rounded-[2rem] shadow-2xl text-sm font-black transition-all animate-in slide-in-from-right border border-current/10 ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Notifications Système</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Communiquez avec l&apos;ensemble de la communauté ou des groupes spécifiques.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Creation Form */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 flex flex-col h-fit">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Nouvelle Alerte</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Diffusion de masse</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Cible de diffusion</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "ALL", label: "Tous", icon: Users },
                  { key: "ASSOCIATION", label: "Association", icon: Building2 },
                  { key: "ROLE", label: "Rôle système", icon: ShieldCheck },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { setMode(item.key as any); setTargetId(""); }}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3 transition-all ${
                      mode === item.key
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
              {mode !== "ALL" && (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  {(mode === "ASSOCIATION" ? associations : roles).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Modèle de message</label>
              <select
                onChange={(e) => {
                  const tpl = TEMPLATES.find((t) => t.id === e.target.value);
                  if (tpl) setForm((f) => ({ ...f, title: tpl.title, message: tpl.message }));
                }}
                defaultValue=""
                className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="" disabled>Choisir un modèle…</option>
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Titre de l&apos;alerte</label>
              <input 
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="ex: Maintenance du Système, Mise à jour des conditions..."
                className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Message détaillé</label>
              <textarea 
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Rédigez votre message ici..."
                className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-medium resize-none focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all placeholder:text-gray-300"
              />
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                Attention : Cette action est irréversible. Toutes les cibles recevront une notification push et in-app immédiatement.
              </p>
            </div>

            <button 
              onClick={handleSend}
              disabled={sending || !form.title || !form.message || (mode !== "ALL" && !targetId)}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {sending ? "Envoi en cours..." : "Diffuser la Notification"}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Historique</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Dernières diffusions</p>
              </div>
            </div>
            <button onClick={fetchHistory} className="p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-50/50 rounded-[2rem] animate-pulse" />
              ))
            ) : history.length === 0 ? (
              <div className="py-20 text-center">
                <Bell className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Aucune notification envoyée</p>
              </div>
            ) : (
              history.map((notif, i) => (
                <div key={i} className="p-6 rounded-[2rem] border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-blue-100 hover:shadow-lg transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black text-gray-900">{notif.title}</span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-50">SYSTEM</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] font-bold text-gray-300 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Délivré
                    </div>
                    <button className="text-[10px] font-black text-gray-400 hover:text-gray-900 transition-colors">Détails</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
