"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import {
  History, Filter, Search, ChevronDown,
  CheckCircle, AlertTriangle, Info, ShieldAlert,
  RefreshCw, Download, User, Calendar, Loader2, AlertCircle
} from "lucide-react";

type AuditLog = {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  createdAt: string;
};

const SEVERITY_CONFIG = {
  INFO:     { label: "Info",     icon: Info,           bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-400" },
  SUCCESS:  { label: "Succès",   icon: CheckCircle,    bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-500" },
  WARNING:  { label: "Alerte",   icon: AlertTriangle,  bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400" },
  CRITICAL: { label: "Critique", icon: ShieldAlert,    bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 0) return "à l'instant";
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filtered, setFiltered] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [resourceFilter, setResourceFilter] = useState<string>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const resources = ["ALL", ...Array.from(new Set(logs.map(l => l.resource)))];

  const applyFilters = useCallback(() => {
    let data = logs;
    if (search) data = data.filter(l =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      l.userName?.toLowerCase().includes(search.toLowerCase()) ||
      l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
    );
    if (severityFilter !== "ALL") data = data.filter(l => l.severity === severityFilter);
    if (resourceFilter !== "ALL") data = data.filter(l => l.resource === resourceFilter);
    setFiltered(data);
  }, [logs, search, severityFilter, resourceFilter]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const fetchLogs = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        setError("Erreur lors de la récupération des logs");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const exportCsv = () => {
    const headers = ["Date", "Utilisateur", "Action", "Ressource", "Sévérité", "IP", "Détails"];
    const rows = filtered.map(l => [
      new Date(l.createdAt).toLocaleString("fr-FR"),
      l.userEmail || "",
      l.action,
      l.resource,
      l.severity,
      l.ipAddress || "",
      l.details || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminSectionTabs group="audit" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Journal d&apos;Audit</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Traçabilité immutable et horodatée des actions système.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-black border-2 transition-all shadow-sm ${
              autoRefresh ? "border-blue-600 bg-blue-600 text-white shadow-blue-500/20" : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "LIVE ON" : "Activer Live"}
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Actions", value: logs.length, color: "text-slate-900", bg: "bg-white", icon: History },
          { label: "Critiques", value: logs.filter(l => l.severity === "CRITICAL").length, color: "text-red-600", bg: "bg-red-50/50", icon: ShieldAlert },
          { label: "Alertes", value: logs.filter(l => l.severity === "WARNING").length, color: "text-amber-600", bg: "bg-amber-50/50", icon: AlertTriangle },
          { label: "Acteurs", value: new Set(logs.map(l => l.userEmail)).size, color: "text-blue-600", bg: "bg-blue-50/50", icon: User },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group`}>
            <stat.icon className={`absolute -right-2 -bottom-2 w-16 h-16 opacity-5 group-hover:scale-110 transition-transform ${stat.color}`} />
            <div className={`text-3xl font-black ${stat.color} relative z-10`}>{stat.value}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 relative z-10">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2.5rem] p-4 border border-gray-100 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[280px] flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4 border border-transparent focus-within:border-blue-600/20 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par action, ressource ou utilisateur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="pl-5 pr-10 py-4 rounded-2xl bg-gray-50 border border-transparent text-sm font-black text-gray-700 appearance-none outline-none focus:ring-2 focus:ring-blue-600/10 cursor-pointer"
            >
              <option value="ALL">Toutes sévérités</option>
              <option value="SUCCESS">Succès</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Alerte</option>
              <option value="CRITICAL">Critique</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={resourceFilter}
              onChange={e => setResourceFilter(e.target.value)}
              className="pl-5 pr-10 py-4 rounded-2xl bg-gray-50 border border-transparent text-sm font-black text-gray-700 appearance-none outline-none focus:ring-2 focus:ring-blue-600/10 cursor-pointer"
            >
              {resources.map(r => <option key={r} value={r}>{r === "ALL" ? "Toutes ressources" : r}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Horodatage</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acteur</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ressource</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sévérité</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 rounded-lg w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                    <div className="text-sm font-black text-gray-400">{error}</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <History className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                    <div className="text-sm font-black text-gray-400">Aucune entrée trouvée</div>
                  </td>
                </tr>
              ) : filtered.map((log) => {
                const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.INFO;
                const SevIcon = sev.icon;
                return (
                  <tr key={log.id} className={`hover:bg-gray-50/50 transition-colors group ${
                    log.severity === "CRITICAL" ? "bg-red-50/10" : ""
                  }`}>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                        <span>{formatTime(log.createdAt)}</span>
                      </div>
                      {log.ipAddress && (
                        <div className="text-[10px] text-gray-300 font-mono mt-0.5">{log.ipAddress}</div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 font-black text-white text-[10px]">
                          {log.userName?.charAt(0) || "?"}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-black text-gray-900 truncate">{log.userName || "Inconnu"}</div>
                          <div className="text-[10px] font-bold text-gray-400 truncate">{log.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <code className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-xl tracking-wider">{log.action}</code>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-xl uppercase tracking-widest">
                        {log.resource}
                      </span>
                      {log.resourceId && (
                        <div className="text-[10px] text-gray-400 font-mono mt-1 opacity-50">{log.resourceId}</div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${sev.bg} ${sev.text} border border-current/10`}>
                        <SevIcon className="w-3.5 h-3.5" />
                        {sev.label}
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-sm">
                      <div className="text-xs font-bold text-gray-600 leading-relaxed italic">&quot;{log.details}&quot;</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
