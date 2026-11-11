"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Users, MapPin, Clock, Coins, ListChecks, Info } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const MEETING_TYPES = [
  { value: "REGULAR", label: "Session ordinaire", quorum: 50, hint: "Cotisations, tirage, distribution du pot" },
  { value: "EXTRAORDINARY", label: "Session extraordinaire", quorum: 66, hint: "Motif urgent (décès, litige, catastrophe)" },
  { value: "BUREAU_MEETING", label: "Réunion de bureau", quorum: 66, hint: "Décisions de gestion courante" },
  { value: "AG_ORDINARY", label: "Assemblée générale", quorum: 75, hint: "Bilan moral et financier, votes" },
  { value: "AG_EXTRAORDINARY", label: "AG extraordinaire", quorum: 75, hint: "Élection, modification du règlement" },
  { value: "COMMISSION_MEETING", label: "Réunion de commission", quorum: 50, hint: "Solidarité, discipline, investissement" },
  { value: "SPEECH_CIRCLE", label: "Cercle de parole", quorum: 0, hint: "Médiation et résolution de conflits" },
];

type Member = { id: string; name: string; role: string; memberNumber?: string | null };

export default function NewMeetingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const defaultDate = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  const [form, setForm] = useState({
    type: "REGULAR",
    title: "",
    date: defaultDate.toISOString().slice(0, 10),
    time: "15:00",
    location: "",
    quorumRequired: 50,
    isRotating: false,
    hostMembershipId: "",
    collationRate: "",
    agenda: ["Appel et pointage", "Cotisations de la session", "Divers"],
  });

  useEffect(() => {
    fetch(`/api/associations/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = (data?.association?.memberships ?? [])
          .filter((m: any) => m.status !== "LEFT")
          .map((m: any) => ({
            id: m.id,
            name: m.user?.name ?? "Membre",
            role: m.role,
            memberNumber: m.memberNumber,
          }));
        setMembers(list);
        const cfg = data?.association?.meetingConfig;
        if (cfg) {
          try {
            const parsed = typeof cfg === "string" ? JSON.parse(cfg) : cfg;
            if (parsed?.collationRate) {
              setForm((f) => ({ ...f, collationRate: String(parsed.collationRate) }));
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [id]);

  const selectedType = useMemo(
    () => MEETING_TYPES.find((t) => t.value === form.type) ?? MEETING_TYPES[0],
    [form.type]
  );

  const setType = (value: string) => {
    const t = MEETING_TYPES.find((x) => x.value === value) ?? MEETING_TYPES[0];
    setForm((f) => ({ ...f, type: value, quorumRequired: t.quorum }));
  };

  const updateAgenda = (index: number, value: string) => {
    setForm((f) => ({ ...f, agenda: f.agenda.map((a, i) => (i === index ? value : a)) }));
  };

  const addAgendaItem = () => setForm((f) => ({ ...f, agenda: [...f.agenda, ""] }));
  const removeAgendaItem = (index: number) =>
    setForm((f) => ({ ...f, agenda: f.agenda.filter((_, i) => i !== index) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError("Le titre de la session est requis.");
    if (!form.date || !form.time) return setError("La date et l'heure sont requises.");

    setSaving(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      const res = await fetch(`/api/associations/${id}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          scheduledAt,
          location: form.location || null,
          quorumRequired: Number(form.quorumRequired) || 0,
          isRotating: form.isRotating,
          agenda: form.agenda.filter((a) => a.trim()).map((title) => ({ title })),
          collationRate: Number(form.collationRate) > 0 ? Number(form.collationRate) : null,
          hostMembershipId: form.hostMembershipId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Création impossible");

      const meetingId = data?.meeting?.id;
      const rate = Number(form.collationRate);
      if (meetingId && rate > 0) {
        await fetch(`/api/associations/${id}/meetings/${meetingId}/collation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "OPEN",
            rate,
            hostMembershipId: form.hostMembershipId || null,
          }),
        }).catch(() => {});
      }

      router.push(`/associations/${id}/reunions/${meetingId}`);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-stone bg-white text-sm text-charcoal outline-none focus:ring-4 focus:ring-forest/10 focus:border-forest/40 transition";

  return (
    <DashboardLayout title="Planifier une session">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/associations/${id}/reunions`}
            className="inline-flex items-center gap-2 text-sm font-medium text-graphite hover:text-forest"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux sessions
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest text-ash">
            Module 3 · Réunions
          </span>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-forest p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
              <CalendarPlus className="w-3.5 h-3.5" /> Nouvelle session
            </div>
            <h1 className="text-3xl font-black tracking-tight">Planifier une session</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-100/70">
              Le quorum, la collation et l&apos;ordre du jour sont configurés dès la convocation.
              Le pointage et les amendes seront disponibles dans la fiche de session.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Type et identité de la session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash">
                    Type de session
                  </label>
                  <select value={form.type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                    {MEETING_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-ash">{selectedType.hint}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash">
                    Titre / objet
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Ex : Session ordinaire de novembre"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ash">
                    <CalendarPlus className="w-3.5 h-3.5" /> Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ash">
                    <Clock className="w-3.5 h-3.5" /> Heure
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ash">
                    <MapPin className="w-3.5 h-3.5" /> Lieu
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Foyer, domicile de l'hôte…"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash">
                    Quorum requis (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.quorumRequired}
                    onChange={(e) => setForm((f) => ({ ...f, quorumRequired: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash">
                    Hôte de la réunion
                  </label>
                  <select
                    value={form.hostMembershipId}
                    onChange={(e) => setForm((f) => ({ ...f, hostMembershipId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Aucun hôte désigné —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.memberNumber ? ` (#${m.memberNumber})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-graphite">
                <input
                  type="checkbox"
                  checked={form.isRotating}
                  onChange={(e) => setForm((f) => ({ ...f, isRotating: e.target.checked }))}
                  className="h-4 w-4 accent-forest"
                />
                Hébergement rotatif chez les membres
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-gold" /> Collation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash">
                    Cotisation de collation / membre (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.collationRate}
                    onChange={(e) => setForm((f) => ({ ...f, collationRate: e.target.value }))}
                    placeholder="Ex : 3 000"
                    className={inputCls}
                  />
                </div>
                <div className="rounded-xl bg-cream px-4 py-3 text-sm text-graphite">
                  <p className="font-semibold text-charcoal">Reversement à l&apos;hôte</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    La caisse collecte la cotisation de chaque membre actif, puis reverse le forfait
                    à l&apos;hôte en déduisant ses propres arriérés de collation.
                  </p>
                  {Number(form.collationRate) > 0 && (
                    <p className="mt-2 text-sm font-bold text-forest">
                      Attendu : {formatCurrency(Number(form.collationRate) * Math.max(members.length, 1))}
                    </p>
                  )}
                </div>
              </div>
              {!form.hostMembershipId && Number(form.collationRate) > 0 && (
                <p className="flex items-center gap-2 text-xs font-medium text-warning">
                  <Info className="h-3.5 w-3.5" />
                  Sans hôte désigné, aucun reversement ne sera calculé.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-forest" /> Ordre du jour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.agenda.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-forest/10 text-xs font-bold text-forest">
                    {i + 1}
                  </span>
                  <input
                    value={item}
                    onChange={(e) => updateAgenda(i, e.target.value)}
                    placeholder={`Point ${i + 1}`}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(i)}
                    className="text-xs font-semibold text-error hover:underline"
                    aria-label="Retirer ce point"
                  >
                    Retirer
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                + Ajouter un point
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" loading={saving} className="sm:min-w-56">
              <Users className="h-4 w-4" /> Créer et convoquer la session
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
