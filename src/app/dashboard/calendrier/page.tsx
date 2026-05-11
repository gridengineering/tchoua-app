"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Filter, MapPin, Loader2, ArrowUpRight, ArrowDownRight, X
} from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  type: "MEETING" | "SESSION";
  associationId: string;
  associationName: string;
  location?: string;
  expectedExpense: number;
  expectedIncome: number;
};

type AssociationOption = {
  id: string;
  name: string;
};

export default function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [associations, setAssociations] = useState<AssociationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssoc, setSelectedAssoc] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => { fetchEvents(); }, [selectedAssoc]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/calendar", window.location.origin);
      if (selectedAssoc !== "ALL") url.searchParams.set("associationId", selectedAssoc);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setAssociations(data.associations || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const monthStart = startOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
  const startDayOffset = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const selectedDayEvents = selectedDate ? events.filter(e => isSameDay(new Date(e.start), selectedDate)) : [];

  return (
    <DashboardLayout title="Calendrier Financier">
      <div className="flex gap-6">

        {/* ── LEFT: Calendar ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4 overflow-y-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-warm-white p-5 rounded-2xl shadow-sm border border-stone">
            <div>
              <h1 className="text-xl font-semibold text-charcoal flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#165E39]" /> Calendrier Financier
              </h1>
              <p className="text-graphite font-medium text-sm">Réunions & flux financiers consolidés</p>
            </div>
            <div className="flex items-center gap-2 bg-cream px-3 py-2 rounded-xl border border-gray-200">
              <Filter className="w-4 h-4 text-ash flex-shrink-0" />
              <select value={selectedAssoc} onChange={e => setSelectedAssoc(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-gray-700 text-sm">
                <option value="ALL">Toutes les associations</option>
                {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Month nav + Grid */}
          <div className="bg-warm-white rounded-2xl shadow-sm border border-stone overflow-hidden">
            <div className="px-5 py-4 border-b border-stone flex justify-between items-center">
              <h2 className="text-lg font-black text-[#165E39] capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(addMonths(currentDate, -1))}
                  className="p-2 bg-cream border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 bg-cream border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-stone">
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
                <div key={d} className="py-3 text-center text-[10px] font-black text-ash uppercase tracking-widest">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#165E39]" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-gray-100">
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`b${i}`} className="bg-cream min-h-[80px]" />
                ))}
                {daysInMonth.map(day => {
                  const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
                  const expense = dayEvents.reduce((s, e) => s + e.expectedExpense, 0);
                  const income = dayEvents.reduce((s, e) => s + e.expectedIncome, 0);
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div key={day.toString()}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`min-h-[80px] bg-warm-white p-2 cursor-pointer hover:bg-[#165E39]/5 transition-colors ${isSelected ? "ring-2 ring-inset ring-[#165E39]" : ""}`}
                    >
                      <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-[#165E39] text-white" : "text-gray-700"}`}>
                        {format(day, 'd')}
                      </span>
                      {income > 0 && (
                        <div className="text-[10px] font-bold text-forest bg-forest/10 px-1 py-0.5 rounded mb-0.5 flex items-center gap-0.5">
                          <ArrowDownRight className="w-2.5 h-2.5" />{income.toLocaleString()}
                        </div>
                      )}
                      {expense > 0 && (
                        <div className="text-[10px] font-bold text-red-600 bg-error/10 px-1 py-0.5 rounded mb-0.5 flex items-center gap-0.5">
                          <ArrowUpRight className="w-2.5 h-2.5" />{expense.toLocaleString()}
                        </div>
                      )}
                      <div className="flex gap-0.5 flex-wrap mt-1">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${e.type === 'MEETING' ? 'bg-info' : 'bg-[#E38513]'}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-graphite px-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-info inline-block" />Réunion</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E38513] inline-block" />Session</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-forest inline-block" />Recette</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Dépense</span>
          </div>
        </div>

        {/* ── RIGHT: Detail Panel (intégré) ─────────────────────────────── */}
        <div className="w-72 flex-shrink-0">
          {selectedDate ? (
            <div className="bg-warm-white rounded-2xl shadow-sm border border-stone sticky top-0 flex flex-col">
              <div className="p-4 border-b border-stone flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-xs font-medium text-ash uppercase tracking-wider text-[#E38513] mb-0.5">Détails</p>
                  <h3 className="font-semibold text-charcoal text-sm capitalize">
                    {format(selectedDate, 'EEEE d MMM', { locale: fr })}
                  </h3>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <X className="w-4 h-4 text-graphite" />
                </button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)]">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-8 text-ash font-bold text-sm">Aucun événement ce jour.</div>
                ) : (
                  selectedDayEvents.map(evt => (
                    <div key={evt.id} className="p-3 rounded-xl border border-stone bg-cream space-y-2">
                      <span className="text-[9px] text-xs font-medium text-ash uppercase tracking-wider text-[#E38513] block">
                        {evt.associationName}
                      </span>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{evt.title}</h4>
                        <span className="text-[10px] font-black bg-warm-white border border-stone px-1.5 py-1 rounded-lg shadow-sm text-gray-600 flex-shrink-0">
                          {format(new Date(evt.start), 'HH:mm')}
                        </span>
                      </div>
                      {evt.location && (
                        <div className="flex items-center gap-1 text-xs text-graphite font-medium">
                          <MapPin className="w-3 h-3" />{evt.location}
                        </div>
                      )}
                      {(evt.expectedExpense > 0 || evt.expectedIncome > 0) && (
                        <div className="pt-2 border-t border-gray-200 flex gap-2">
                          {evt.expectedExpense > 0 && (
                            <div className="flex-1 bg-error/10 p-2 rounded-lg text-center">
                              <div className="text-[9px] font-bold text-red-400 uppercase">À cotiser</div>
                              <div className="font-black text-red-600 text-xs">{evt.expectedExpense.toLocaleString()} F</div>
                            </div>
                          )}
                          {evt.expectedIncome > 0 && (
                            <div className="flex-1 bg-forest/10 p-2 rounded-lg text-center">
                              <div className="text-[9px] font-bold text-emerald-400 uppercase">À recevoir</div>
                              <div className="font-black text-forest text-xs">{evt.expectedIncome.toLocaleString()} F</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-warm-white rounded-2xl shadow-sm border border-stone flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
              <CalendarIcon className="w-12 h-12 text-gray-200 mb-4" />
              <p className="font-bold text-ash text-sm leading-relaxed">
                Cliquez sur un jour du calendrier pour afficher les événements ici.
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
