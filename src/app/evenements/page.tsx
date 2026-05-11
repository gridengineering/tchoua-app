"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import {
  Calendar, Plus, MapPin, Video, Users, Clock,
  X, Loader2, CheckCircle2, XCircle, AlertCircle, ChevronDown
} from "lucide-react";

interface Attendee {
  id: string;
  status: string;
  user: { id: string; name: string; avatar?: string };
}

interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  location?: string;
  budget?: number;
  status: string;
  isVirtual: boolean;
  meetingLink?: string;
  maxAttendees?: number;
  tontine: { id: string; name: string };
  attendees: Attendee[];
  _count: { attendees: number };
}

const EVENT_TYPES = [
  { value: "REUNION", label: "Réunion", emoji: "🤝", color: "bg-info/10 text-blue-700" },
  { value: "FETE", label: "Fête", emoji: "🎉", color: "bg-yellow-100 text-yellow-700" },
  { value: "CEREMONIE", label: "Cérémonie", emoji: "🎗️", color: "bg-pink-100 text-pink-700" },
  { value: "FORMATION", label: "Formation", emoji: "📖", color: "bg-green-100 text-green-700" },
  { value: "ASSEMBLEE", label: "Assemblée", emoji: "🗳️", color: "bg-violet-100 text-violet-700" },
];

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-info/10 text-blue-700",
  ONGOING: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-error/10 text-red-700",
};

export default function EvenementsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tontines, setTontines] = useState<{ id: string; name: string }[]>([]);
  const [filter, setFilter] = useState("upcoming");
  const [form, setForm] = useState({
    tontineId: "", title: "", description: "", type: "REUNION",
    startDate: "", endDate: "", location: "", budget: "", isVirtual: false, meetingLink: "", maxAttendees: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch("/api/tontines?mine=true")
      .then((r) => r.json())
      .then((data) => setTontines(data.tontines || []));
  }, []);

  const createEvent = async () => {
    if (!form.tontineId || !form.title || !form.startDate) return;
    setCreating(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await load();
      setShowCreate(false);
      setForm({ tontineId: "", title: "", description: "", type: "REUNION", startDate: "", endDate: "", location: "", budget: "", isVirtual: false, meetingLink: "", maxAttendees: "" });
    }
    setCreating(false);
  };

  const rsvp = async (eventId: string, status: "CONFIRMED" | "DECLINED") => {
    await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const myRsvp = (event: Event) =>
    event.attendees.find((a) => a.user.id === session?.user?.id);

  const now = new Date();
  const filteredEvents = events.filter((e) => {
    const date = new Date(e.startDate);
    if (filter === "upcoming") return date >= now && e.status !== "CANCELLED";
    if (filter === "past") return date < now || e.status === "COMPLETED";
    return true;
  });

  const typeInfo = (type: string) => EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[0];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Événements & Culture</h1>
            <p className="text-graphite text-sm">Réunions, fêtes, cérémonies et formations de vos tontines</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Créer un événement
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { value: "upcoming", label: "À venir" },
            { value: "past", label: "Passés" },
            { value: "all", label: "Tous" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Events */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-warm-white rounded-xl p-12 text-center shadow-sm border border-stone">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-ash/60" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun événement</h3>
            <p className="text-graphite text-sm mb-4">Créez un événement pour rassembler votre communauté</p>
            <button onClick={() => setShowCreate(true)} className="bg-violet-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-violet-700">
              Créer un événement
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const tinfo = typeInfo(event.type);
              const userRsvp = myRsvp(event);
              const confirmed = event.attendees.filter((a) => a.status === "CONFIRMED").length;
              const isUpcoming = new Date(event.startDate) >= now;

              return (
                <div key={event.id} className="bg-warm-white rounded-xl shadow-sm border border-stone overflow-hidden">
                  <div className="flex">
                    {/* Date column */}
                    <div className="w-20 bg-gradient-to-b from-violet-500 to-indigo-600 flex flex-col items-center justify-center p-3 flex-shrink-0">
                      <div className="text-white text-xs font-medium opacity-80">
                        {new Date(event.startDate).toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}
                      </div>
                      <div className="text-white text-3xl font-bold">
                        {new Date(event.startDate).getDate()}
                      </div>
                      <div className="text-white text-xs opacity-80">
                        {new Date(event.startDate).toLocaleDateString("fr-FR", { weekday: "short" })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{tinfo.emoji}</span>
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tinfo.color}`}>{tinfo.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] || "bg-gray-100 text-gray-600"}`}>
                              {event.status}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-graphite mb-2">{event.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-graphite mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(event.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                        </span>
                        {event.isVirtual ? (
                          <span className="flex items-center gap-1 text-blue-500">
                            <Video className="w-3.5 h-3.5" /> En ligne
                          </span>
                        ) : event.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {event.location}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {confirmed} confirmé(s)
                          {event.maxAttendees && ` / ${event.maxAttendees}`}
                        </span>
                        <span className="text-violet-500">📍 {event.tontine.name}</span>
                        {event.budget && <span>💰 Budget: {formatCurrency(event.budget)}</span>}
                      </div>

                      {/* RSVP buttons */}
                      {isUpcoming && event.status !== "CANCELLED" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => rsvp(event.id, "CONFIRMED")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              userRsvp?.status === "CONFIRMED"
                                ? "bg-green-500 text-white"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Je participe
                          </button>
                          <button
                            onClick={() => rsvp(event.id, "DECLINED")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              userRsvp?.status === "DECLINED"
                                ? "bg-error text-white"
                                : "bg-error/10 text-red-700 hover:bg-error/10"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </button>
                          {event.isVirtual && event.meetingLink && (
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-info/10 text-blue-700 hover:bg-info/10"
                            >
                              <Video className="w-3.5 h-3.5" /> Rejoindre
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-warm-white rounded-2xl w-full max-w-lg p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Créer un événement</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-ash" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tontine *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.tontineId}
                  onChange={(e) => setForm({ ...form, tontineId: e.target.value })}
                >
                  <option value="">Sélectionner une tontine</option>
                  {Array.isArray(tontines) && tontines.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ex: Réunion mensuelle de mai"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'événement</label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        form.type === t.value ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isVirtual}
                  onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm text-gray-700">Événement en ligne (virtuel)</span>
              </label>
              {form.isVirtual ? (
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Lien de la réunion (Zoom, Google Meet...)"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                />
              ) : (
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Lieu de l'événement"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget (FCFA)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max participants</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Illimité"
                    value={form.maxAttendees}
                    onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <button
                onClick={createEvent}
                disabled={creating || !form.tontineId || !form.title || !form.startDate}
                className="w-full bg-violet-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Créer l'événement
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
