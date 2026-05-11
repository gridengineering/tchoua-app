"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { RotateCcw, Plus, ChevronLeft, MapPin, Calendar, Clock, Users, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type MeetingStatus = "SCHEDULED" | "HELD" | "CANCELLED";

interface AssocMeetingT {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  status: MeetingStatus;
  _count?: { attendances: number };
}

export default function ReunionsPage() {
  const params = useParams<{ id: string }>();
  const assocId = params.id;
  const router = useRouter();

  const [meetings, setMeetings] = useState<AssocMeetingT[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/associations/${assocId}/meetings`);
    if (res.ok) {
      const data = await res.json();
      setMeetings(data.meetings ?? []);
    }
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const sortedMeetings = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardLayout title="Sessions & Réunions">
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-gold">Gouvernance & Rencontres</span>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight">Sessions & Réunions</h1>
              <p className="text-emerald-100/60 font-medium leading-relaxed max-w-xl">
                Suivez le calendrier des rencontres, consultez les ordres du jour et 
                accédez aux rapports des sessions passées de votre association.
              </p>
            </div>
            <button className="bg-warm-white text-[#0d3d28] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap self-start md:self-center">
              <Plus className="w-4 h-4" /> Planifier une session
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-warm-white rounded-3xl border border-stone animate-pulse" />
            ))}
          </div>
        ) : sortedMeetings.length === 0 ? (
          <div className="py-32 text-center bg-warm-white rounded-2xl border-4 border-dashed border-gray-50">
            <RotateCcw className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-ash/60 uppercase tracking-widest">Aucune session planifiée</h3>
            <p className="text-sm font-medium text-ash mt-2">Le calendrier est vide pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedMeetings.map(m => {
              const date = new Date(m.date);
              const isPast = date < new Date();
              
              return (
                <div key={m.id} className="bg-warm-white rounded-2xl p-8 border border-stone shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-3xl bg-[#f7f3eb] flex flex-col items-center justify-center border border-stone">
                        <span className="text-[10px] font-black text-gold uppercase tracking-widest leading-none mb-1">{date.toLocaleDateString("fr-FR", { month: "short" })}</span>
                        <span className="text-2xl font-black text-[#0d3d28] leading-none">{date.getDate()}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-charcoal mb-1 group-hover:text-[#0d3d28] transition-colors">{m.title}</h3>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] text-xs font-medium text-ash uppercase tracking-wider ${
                          m.status === 'HELD' ? 'bg-forest/10 text-forest' : 
                          m.status === 'CANCELLED' ? 'bg-error/10 text-red-600' : 
                          'bg-info/10 text-info'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            m.status === 'HELD' ? 'bg-forest' : 
                            m.status === 'CANCELLED' ? 'bg-error' : 
                            'bg-info'
                          }`}></div>
                          {m.status === 'HELD' ? 'Terminée' : m.status === 'CANCELLED' ? 'Annulée' : 'Planifiée'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 relative z-10">
                    <div className="flex items-center gap-3 text-sm text-graphite font-medium">
                      <Clock className="w-4 h-4 text-gold" />
                      <span>{date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-graphite font-medium">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="truncate">{m.location || "Lieu non défini"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-graphite font-medium">
                      <Users className="w-4 h-4 text-gold" />
                      <span>{m._count?.attendances || 0} Participants</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                    <button 
                      onClick={() => router.push(`/associations/${assocId}/reunions/${m.id}`)}
                      className="text-[10px] font-black text-[#0d3d28] uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                    >
                      Détails de la session <ArrowRight className="w-4 h-4" />
                    </button>
                    {m.status === 'HELD' && (
                      <div className="flex items-center gap-1 text-forest">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider">Rapport disponible</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
