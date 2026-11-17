"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarCheck, CheckCircle2, FileText, Loader2, Mail, MapPin, Play, Send, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type Member = { id: string; memberNumber?: string | null; role: string; user: { name: string; email?: string | null } };
type AgendaItem = { id?: string; order: number; title: string; content?: string | null; decision?: string | null; presenterId?: string | null; durationMin?: number | null };
type Meeting = any;

const label = (s?: string) => ({ PLANNED: "Planifiée", HELD: "Tenue", CLOSED: "Clôturée", CANCELLED: "Annulée" } as Record<string, string>)[s ?? ""] ?? s ?? "—";
const money = (n: number, c = "XAF") => `${Number(n ?? 0).toLocaleString("fr-FR")} ${c}`;

export default function MeetingSessionPage() {
  const { id, meetingId } = useParams<{ id: string; meetingId: string }>();
  const [meeting, setMeeting] = useState<Meeting>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [template, setTemplate] = useState<string[]>([]);
  const [financial, setFinancial] = useState<any>(null);
  const [finFilters, setFinFilters] = useState({ membershipId: "", activityId: "", account: "ALL" });
  const [rotation, setRotation] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [openForm, setOpenForm] = useState({ presidentId: "", secretaryId: "", censorId: "", modality: "", onlineUrl: "", location: "", loadTemplate: true });
  const [reschedule, setReschedule] = useState({ scheduledAt: "", location: "", modality: "", onlineUrl: "" });
  const [nextMeeting, setNextMeeting] = useState({ scheduledAt: "", location: "", modality: "PHYSICAL", onlineUrl: "" });
  const [minutesHtml, setMinutesHtml] = useState("");
  const [rotationPick, setRotationPick] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [meetRes, agendaRes, rotationRes] = await Promise.all([
        fetch(`/api/associations/${id}/meetings?meetingId=${meetingId}`, { cache: "no-store" }),
        fetch(`/api/associations/${id}/meetings/${meetingId}/agenda`, { cache: "no-store" }),
        fetch(`/api/associations/${id}/meetings/rotation`, { cache: "no-store" }),
      ]);
      const meet = await meetRes.json();
      if (!meetRes.ok) throw new Error(meet.error || "Session introuvable");
      setMeeting(meet.meeting);
      const ag = await agendaRes.json();
      if (agendaRes.ok) { setAgenda(ag.items ?? []); setTemplate(ag.template ?? []); setCanEdit(Boolean(ag.canEdit)); }
      const rot = await rotationRes.json();
      if (rotationRes.ok) { setRotation(rot); setMembers(rot.members ?? []); }
      if (meet.meeting?.openedAt) {
        const finRes = await fetch(`/api/associations/${id}/meetings/${meetingId}/financial`, { cache: "no-store" });
        if (finRes.ok) setFinancial(await finRes.json());
      }
      setOpenForm((f) => ({
        ...f,
        presidentId: meet.meeting?.sessionPresidentId ?? f.presidentId,
        secretaryId: meet.meeting?.sessionSecretaryId ?? f.secretaryId,
        censorId: meet.meeting?.sessionCensorId ?? f.censorId,
        modality: meet.meeting?.modality ?? f.modality,
        onlineUrl: meet.meeting?.onlineUrl ?? f.onlineUrl,
        location: meet.meeting?.location ?? f.location,
      }));
      setReschedule({ scheduledAt: meet.meeting?.scheduledAt?.slice(0, 16) ?? "", location: meet.meeting?.location ?? "", modality: meet.meeting?.modality ?? "PHYSICAL", onlineUrl: meet.meeting?.onlineUrl ?? "" });
      setMinutesHtml(meet.meeting?.minutesHtml ?? "");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [id, meetingId]);

  useEffect(() => { if (id && meetingId) void load(); }, [id, meetingId, load]);
  useEffect(() => {
    if (!id || !meetingId || !meeting?.openedAt) return;
    const p = new URLSearchParams();
    if (finFilters.membershipId) p.set("membershipId", finFilters.membershipId);
    if (finFilters.activityId) p.set("activityId", finFilters.activityId);
    if (finFilters.account) p.set("account", finFilters.account);
    fetch(`/api/associations/${id}/meetings/${meetingId}/financial?${p.toString()}`, { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then(setFinancial).catch(() => {});
  }, [id, meetingId, meeting?.openedAt, finFilters]);

  const post = async (url: string, body: any, success: string) => {
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Opération impossible");
      setMessage(success);
      await load();
      return data;
    } catch (e: any) { setError(e.message); return null; } finally { setSaving(false); }
  };

  const openSession = () => post(`/api/associations/${id}/meetings/${meetingId}/open`, { roles: { presidentId: openForm.presidentId, secretaryId: openForm.secretaryId, censorId: openForm.censorId }, modality: openForm.modality, onlineUrl: openForm.onlineUrl, location: openForm.location, loadTemplate: openForm.loadTemplate }, "Session ouverte. Les présences sont initialisées.");
  const saveAgenda = () => post(`/api/associations/${id}/meetings/${meetingId}/agenda`, { items: agenda }, "Ordre du jour enregistré.");
  const loadTemplate = () => post(`/api/associations/${id}/meetings/${meetingId}/agenda`, { loadTemplate: true }, "Modèle d'ordre du jour chargé.");
  const rescheduleSession = () => post(`/api/associations/${id}/meetings/${meetingId}/reschedule`, { ...reschedule, scheduledAt: reschedule.scheduledAt ? new Date(reschedule.scheduledAt).toISOString() : "" }, "Date / lieu de la session mis à jour.");
  const saveAttendance = (membershipId: string, status: string) => post(`/api/associations/${id}/meetings`, { meetingId, membershipId, attendanceStatus: status }, "Présence mise à jour.");
  const saveAgendaItem = (item: AgendaItem) => {
    if (!item.id) return saveAgenda();
    return fetch(`/api/associations/${id}/meetings/${meetingId}/agenda`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: item.id, content: item.content, decision: item.decision, title: item.title }) }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setMessage("Point enregistré et notifié au groupe."); }).catch((e) => setError(e.message));
  };
  const closeSession = async () => {
    const data = await post(`/api/associations/${id}/meetings/${meetingId}/close`, { minutesHtml, nextMeeting: nextMeeting.scheduledAt ? { ...nextMeeting, scheduledAt: new Date(nextMeeting.scheduledAt).toISOString() } : undefined }, "Session clôturée. Relevé et compte rendu déposés dans la discussion.");
    if (data) setMessage("Session clôturée. Les deux PDF sont disponibles ci-dessous et dans le groupe.");
  };
  const sendMinutes = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/associations/${id}/meetings/${meetingId}/minutes/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi impossible");
      setMessage(`Compte rendu envoyé à ${data.sent} membre(s) à e-mail confirmé.`);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const addRotation = async () => {
    if (!rotationPick) return;
    const items = [...(rotation?.rotation ?? []).map((x: any) => ({ membershipId: x.membershipId, address: x.address })), { membershipId: rotationPick }];
    await post(`/api/associations/${id}/meetings/rotation`, { items, mode: "replace" }, "Ordre de réception enregistré.");
    setRotationPick("");
  };

  const presentCount = useMemo(() => (meeting?.attendances ?? []).filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length, [meeting]);
  const memberName = (membershipId?: string | null) => members.find((m) => m.id === membershipId)?.user.name ?? "—";
  const closed = Boolean(meeting?.closedAt);

  if (loading && !meeting) return <DashboardLayout title="Session de réunion"><div className="flex h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div></DashboardLayout>;
  if (!meeting) return <DashboardLayout title="Session de réunion"><div className="rounded-xl bg-red-50 p-5 text-sm text-red-700">{error || "Session introuvable"}</div></DashboardLayout>;

  return (
    <DashboardLayout title={`Session — ${meeting.title ?? "Réunion"}`}>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/associations/${id}/reunions/${meetingId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0d3d28]"><ArrowLeft className="h-4 w-4" /> Retour à la réunion</Link>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-stone/50 px-3 py-1 font-bold">{label(meeting.status)}</span>
            <span className="rounded-full bg-[#0d3d28]/10 px-3 py-1 font-bold text-[#0d3d28]">{meeting.modality}</span>
            <Link href={`/associations/${id}/meetings/${meetingId}/caisse`} className="rounded-lg border border-stone bg-white px-3 py-2 font-bold">Caisse</Link>
          </div>
        </div>

        {message && <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</div>}
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-[#0d3d28] p-5 text-white md:col-span-2"><p className="text-xs font-bold uppercase tracking-widest text-white/60">Session</p><p className="mt-2 text-xl font-black">{meeting.title ?? "Réunion"}</p><p className="mt-1 text-sm text-white/75">{new Date(meeting.scheduledAt).toLocaleString("fr-FR")}</p><p className="mt-1 text-xs text-white/60"><MapPin className="mr-1 inline h-3 w-3" />{meeting.location ?? meeting.onlineUrl ?? "Lieu à préciser"}</p></div>
          <div className="rounded-2xl border border-stone bg-white p-5"><p className="text-xs font-bold uppercase tracking-widest text-ash">Présents</p><p className="mt-2 text-2xl font-black">{presentCount}/{meeting.attendances?.length ?? 0}</p><p className="text-xs text-ash">Quorum : {meeting.quorumReached ? "atteint" : "non atteint"}</p></div>
          <div className="rounded-2xl border border-stone bg-white p-5"><p className="text-xs font-bold uppercase tracking-widest text-ash">Rôles de séance</p><p className="mt-2 text-sm font-bold">{memberName(meeting.sessionPresidentId)}</p><p className="text-xs text-ash">Président · {memberName(meeting.sessionSecretaryId)} secrétaire</p></div>
        </div>

        {!meeting.openedAt && !closed && <div className="rounded-2xl border border-stone bg-white p-5">
          <h2 className="text-lg font-bold">Ouvrir la session</h2><p className="mb-4 text-xs text-ash">Désignez les rôles, vérifiez la modalité et chargez le modèle d&apos;ordre du jour.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <select value={openForm.presidentId} onChange={(e) => setOpenForm({ ...openForm, presidentId: e.target.value })} className="rounded-xl border border-stone px-3 py-2 text-sm"><option value="">Président de séance…</option>{members.map((m) => <option key={m.id} value={m.id}>{m.user.name}</option>)}</select>
            <select value={openForm.secretaryId} onChange={(e) => setOpenForm({ ...openForm, secretaryId: e.target.value })} className="rounded-xl border border-stone px-3 py-2 text-sm"><option value="">Secrétaire…</option>{members.map((m) => <option key={m.id} value={m.id}>{m.user.name}</option>)}</select>
            <select value={openForm.censorId} onChange={(e) => setOpenForm({ ...openForm, censorId: e.target.value })} className="rounded-xl border border-stone px-3 py-2 text-sm"><option value="">Censeur…</option>{members.map((m) => <option key={m.id} value={m.id}>{m.user.name}</option>)}</select>
            <select value={openForm.modality} onChange={(e) => setOpenForm({ ...openForm, modality: e.target.value })} className="rounded-xl border border-stone px-3 py-2 text-sm"><option value="PHYSICAL">Lieu fixe</option><option value="ONLINE">En ligne</option><option value="ROTATING">Rotative chez les membres</option></select>
            <input value={openForm.location} onChange={(e) => setOpenForm({ ...openForm, location: e.target.value })} placeholder="Lieu / adresse" className="rounded-xl border border-stone px-3 py-2 text-sm" />
            <input value={openForm.onlineUrl} onChange={(e) => setOpenForm({ ...openForm, onlineUrl: e.target.value })} placeholder="Lien visio (si en ligne)" className="rounded-xl border border-stone px-3 py-2 text-sm" />
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={openForm.loadTemplate} onChange={(e) => setOpenForm({ ...openForm, loadTemplate: e.target.checked })} /> Charger le modèle d&apos;ordre du jour des paramètres</label>
          <button onClick={openSession} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0d3d28] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Play className="h-4 w-4" /> Ouvrir la session</button>
        </div>}

        {!meeting.openedAt && !closed && <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-stone bg-white p-5"><h2 className="font-bold">Reporter / modifier la prochaine session</h2><p className="mb-3 text-xs text-ash">Le bureau peut modifier la date, l&apos;heure et le lieu avant l&apos;ouverture.</p><div className="grid gap-2 sm:grid-cols-2"><input type="datetime-local" value={reschedule.scheduledAt} onChange={(e) => setReschedule({ ...reschedule, scheduledAt: e.target.value })} className="rounded-xl border border-stone px-3 py-2 text-sm" /><input value={reschedule.location} onChange={(e) => setReschedule({ ...reschedule, location: e.target.value })} placeholder="Lieu" className="rounded-xl border border-stone px-3 py-2 text-sm" /></div><button onClick={rescheduleSession} disabled={saving} className="mt-3 rounded-xl bg-[#8a6410] px-4 py-2 text-xs font-bold text-white">Enregistrer le report</button></div>
          <div className="rounded-2xl border border-stone bg-white p-5"><h2 className="font-bold">Ordre de réception rotatif</h2><p className="mb-2 text-xs text-ash">Prochain hôte proposé : {rotation?.next ? memberName(rotation.next.membershipId) : "aucun ordre enregistré"}</p><div className="max-h-32 space-y-1 overflow-y-auto text-xs">{(rotation?.rotation ?? []).map((r: any) => <div key={r.id} className="flex justify-between rounded-lg bg-stone/30 px-2 py-1"><span>{r.position}. {r.name}</span><span>{r.status}</span></div>)}</div>{canEdit && <div className="mt-2 flex gap-2"><select value={rotationPick} onChange={(e) => setRotationPick(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-stone px-2 py-1.5 text-xs"><option value="">Ajouter un hôte…</option>{members.map((m) => <option key={m.id} value={m.id}>{m.user.name}</option>)}</select><button onClick={addRotation} className="rounded-lg bg-[#0d3d28] px-3 py-1.5 text-xs font-bold text-white">Ajouter</button></div>}</div>
        </div>}

        {!meeting.openedAt && !closed && agenda.length > 0 && <div className="rounded-2xl border border-stone bg-white p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Ordre du jour prévisionnel</h2>{canEdit && <button onClick={loadTemplate} className="text-xs font-bold text-[#0d3d28] underline">Recharger le modèle</button>}</div>{agenda.map((a) => <div key={a.order} className="border-t border-stone/60 py-2 text-sm"><span className="font-bold">{a.order}. {a.title}</span></div>)}</div>}

        {meeting.openedAt && !closed && <>
          <div className="rounded-2xl border border-stone bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5" /> Présences</h2><button onClick={() => { void load(); }} className="text-xs font-bold text-[#0d3d28]">Actualiser</button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-b border-stone text-ash"><tr><th className="p-2">Membre</th><th className="p-2">Rôle</th><th className="p-2">Arrivée</th><th className="p-2">Statut</th></tr></thead><tbody>{(meeting.attendances ?? []).map((a: any) => <tr key={a.id} className="border-b border-stone/50"><td className="p-2 font-semibold">{a.membership?.user?.name}</td><td className="p-2">{a.membership?.role}</td><td className="p-2">{a.arrivedAt ? new Date(a.arrivedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"}</td><td className="p-2"><select value={a.status} onChange={(e) => saveAttendance(a.membershipId, e.target.value)} className="rounded-lg border border-stone px-2 py-1 text-xs"><option value="PRESENT">Présent</option><option value="LATE">Retard</option><option value="ABSENT">Absent</option><option value="EXCUSED">Excusé</option></select></td></tr>)}</tbody></table></div>
          </div>

          <div className="rounded-2xl border border-stone bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-bold"><CalendarCheck className="h-5 w-5" /> Ordre du jour & délibérations</h2><button onClick={loadTemplate} className="text-xs font-bold text-[#0d3d28] underline">Charger le modèle</button></div>
            <div className="space-y-3">{agenda.map((a, idx) => <div key={a.id ?? idx} className="rounded-xl border border-stone/70 p-3"><div className="mb-2 flex items-center gap-2"><span className="rounded bg-[#0d3d28]/10 px-2 py-0.5 text-xs font-black text-[#0d3d28]">{a.order}</span><input value={a.title} onChange={(e) => setAgenda(agenda.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} className="min-w-0 flex-1 border-0 text-sm font-bold outline-none" /></div><textarea value={a.content ?? ""} onChange={(e) => setAgenda(agenda.map((x, i) => i === idx ? { ...x, content: e.target.value } : x))} onBlur={() => saveAgendaItem(a)} rows={3} placeholder="Délibérations, décisions, votes…" className="w-full rounded-lg border border-stone px-3 py-2 text-sm" />{a.decision != null && <input value={a.decision ?? ""} onChange={(e) => setAgenda(agenda.map((x, i) => i === idx ? { ...x, decision: e.target.value } : x))} placeholder="Décision associée" className="mt-2 w-full rounded-lg border border-stone px-3 py-2 text-xs" />}</div>)}</div>
            <div className="mt-3 flex gap-2"><button onClick={saveAgenda} disabled={saving} className="rounded-xl bg-[#0d3d28] px-4 py-2 text-xs font-bold text-white">Enregistrer l&apos;ordre du jour</button><button onClick={() => setAgenda([...agenda, { order: agenda.length + 1, title: "Nouveau point", content: "" }])} className="rounded-xl border border-stone px-4 py-2 text-xs font-bold">Ajouter un point</button></div>
          </div>

          {financial && <div className="rounded-2xl border border-stone bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5" /> Relevé financier de session</h2><div className="mt-3 grid gap-2 sm:grid-cols-3">
              {financial.canManage && <select value={finFilters.membershipId} onChange={(e) => setFinFilters({ ...finFilters, membershipId: e.target.value })} className="rounded-lg border border-stone px-2 py-2 text-xs"><option value="">Tous les membres</option>{(financial.members ?? []).map((m: any) => <option key={m.id} value={m.id}>{m.user.name}</option>)}</select>}
              <select value={finFilters.activityId} onChange={(e) => setFinFilters({ ...finFilters, activityId: e.target.value })} className="rounded-lg border border-stone px-2 py-2 text-xs"><option value="">Toutes les activités</option>{(financial.activities ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <select value={finFilters.account} onChange={(e) => setFinFilters({ ...finFilters, account: e.target.value })} className="rounded-lg border border-stone px-2 py-2 text-xs"><option value="ALL">Tous les comptes</option><option value="CASH">Espèces</option><option value="MOBILE_MONEY">Mobile Money</option><option value="BANK">Banque</option><option value="ACTIVITY">Activité / AVOIR</option></select>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4"><div className="rounded-xl bg-stone/30 p-3"><p className="text-xs text-ash">Total</p><p className="font-black">{money(financial.summary?.totalCollected)}</p></div><div className="rounded-xl bg-stone/30 p-3"><p className="text-xs text-ash">Espèces</p><p className="font-black">{money(financial.summary?.cash)}</p></div><div className="rounded-xl bg-stone/30 p-3"><p className="text-xs text-ash">Mobile Money</p><p className="font-black">{money(financial.summary?.mobile)}</p></div><div className="rounded-xl bg-stone/30 p-3"><p className="text-xs text-ash">Banque</p><p className="font-black">{money(financial.summary?.bank)}</p></div></div><div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><a target="_blank" href={`/api/associations/${id}/meetings/${meetingId}/minutes/pdf?type=statement`} className="rounded-lg border border-stone px-3 py-2">Relevé PDF</a><a target="_blank" href={`/api/associations/${id}/meetings/${meetingId}/minutes/pdf?type=minutes`} className="rounded-lg border border-stone px-3 py-2">Compte rendu PDF</a></div></div>}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Clôturer la session</h2><p className="mb-3 text-xs text-amber-800">La clôture génère et dépose le relevé et le compte rendu PDF dans la discussion du groupe.</p><textarea value={minutesHtml} onChange={(e) => setMinutesHtml(e.target.value)} rows={4} placeholder="Observations / synthèse du bureau (optionnel)" className="mb-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" /><div className="grid gap-2 sm:grid-cols-3"><input type="datetime-local" value={nextMeeting.scheduledAt} onChange={(e) => setNextMeeting({ ...nextMeeting, scheduledAt: e.target.value })} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" /><input value={nextMeeting.location} onChange={(e) => setNextMeeting({ ...nextMeeting, location: e.target.value })} placeholder="Lieu de la prochaine" className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" /><select value={nextMeeting.modality} onChange={(e) => setNextMeeting({ ...nextMeeting, modality: e.target.value })} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"><option value="PHYSICAL">Lieu fixe</option><option value="ONLINE">En ligne</option><option value="ROTATING">Rotative</option></select></div><button onClick={closeSession} disabled={saving} className="mt-3 rounded-xl bg-[#8a6410] px-5 py-2.5 text-sm font-bold text-white">Clôturer et publier les PDF</button></div>
        </>}

        {closed && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="flex items-center gap-2 text-lg font-bold text-emerald-900"><CheckCircle2 className="h-5 w-5" /> Session clôturée</h2><p className="text-sm text-emerald-800">Clôturée le {new Date(meeting.closedAt).toLocaleString("fr-FR")}.</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><a target="_blank" href={`/api/associations/${id}/meetings/${meetingId}/minutes/pdf?type=minutes`} className="rounded-lg bg-white px-3 py-2 text-[#0d3d28]">Compte rendu PDF</a><a target="_blank" href={`/api/associations/${id}/meetings/${meetingId}/minutes/pdf?type=statement`} className="rounded-lg bg-white px-3 py-2 text-[#0d3d28]">Relevé PDF</a><button onClick={sendMinutes} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-[#0d3d28] px-3 py-2 text-white"><Mail className="h-3.5 w-3.5" /> Envoyer aux e-mails confirmés</button></div></div>}

        {meeting.agendaItems?.length > 0 && !meeting.openedAt && <div className="rounded-2xl border border-stone bg-white p-5"><h2 className="font-bold">Ordre du jour chargé</h2>{meeting.agendaItems.map((a: any) => <p key={a.id} className="border-t border-stone/50 py-2 text-sm">{a.order}. {a.title}</p>)}</div>}
      </div>
    </DashboardLayout>
  );
}
