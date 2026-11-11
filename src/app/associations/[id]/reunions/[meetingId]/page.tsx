"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, CheckCircle2, Clock, Coins, FileText, Gavel,
  ListChecks, MapPin, Users, Vault, XCircle, AlertTriangle, UserCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

type Meeting = {
  id: string;
  title: string | null;
  type: string;
  scheduledAt: string;
  location: string | null;
  status: string;
  quorumRequired: number | null;
  quorumReached: boolean;
  attendeeCount: number | null;
  agenda: string | null;
  notes: string | null;
  collationStatus: string;
  collationRate: number | null;
  attendances: Array<{ id: string; membershipId: string; status: AttendanceStatus; justification?: string | null }>;
  fines: Array<{ id: string; membershipId: string; reason: string; amount: number; paid: boolean }>;
};

type Member = { id: string; name: string; role: string; status: string; memberNumber?: string | null };

type CollationEntry = {
  id: string;
  membershipId: string;
  memberName: string;
  memberNumber?: string | null;
  amount: number;
  paid: boolean;
};

type CollationData = {
  rate: number;
  activeCount: number;
  expected: number;
  collected: number;
  outstanding: number;
  host: { id: string; name: string } | null;
  hostArrears: number;
  hostPayoutLimit?: number;
  hostFines: number;
  hostCollationDue: number;
  netPayout: number;
  collations: CollationEntry[];
  canManage: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  REGULAR: "Session ordinaire",
  EXTRAORDINARY: "Session extraordinaire",
  BUREAU_MEETING: "Réunion de bureau",
  AG_ORDINARY: "Assemblée générale",
  AG_EXTRAORDINARY: "AG extraordinaire",
  COMMISSION_MEETING: "Réunion de commission",
  SPEECH_CIRCLE: "Cercle de parole",
};

const FINE_LABELS: Record<string, string> = {
  ABSENT: "Absence",
  LATE: "Retard",
  INDISCIPLINE: "Indiscipline",
  MISSED_COMMISSION: "Commission manquée",
  ABSENT_AG: "AG manquée",
  EARLY_DEPARTURE: "Départ anticipé",
  OTHER: "Autre",
};

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Présent",
  LATE: "En retard",
  ABSENT: "Absent",
  EXCUSED: "Excusé",
};

export default function MeetingDetailPage() {
  const { id, meetingId } = useParams<{ id: string; meetingId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<"presences" | "amendes" | "collation" | "agenda">("presences");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [collation, setCollation] = useState<CollationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fineForm, setFineForm] = useState({ membershipId: "", reason: "INDISCIPLINE", amount: "500", notes: "" });
  const [collationRate, setCollationRate] = useState("");
  const [hostId, setHostId] = useState("");

  const load = useCallback(async () => {
    const [mRes, collRes, assocRes] = await Promise.all([
      fetch(`/api/associations/${id}/meetings?meetingId=${meetingId}`),
      fetch(`/api/associations/${id}/meetings/${meetingId}/collation`),
      fetch(`/api/associations/${id}`),
    ]);
    const mData = mRes.ok ? await mRes.json() : null;
    const cData = collRes.ok ? await collRes.json() : null;
    const aData = assocRes.ok ? await assocRes.json() : null;

    if (mData?.meeting) setMeeting(mData.meeting);
    if (cData && !cData.error) {
      setCollation(cData);
      setCollationRate((r) => r || String(cData.rate || ""));
      setHostId((h) => h || cData.host?.id || "");
    }
    if (aData?.association?.memberships) {
      setMembers(
        aData.association.memberships
          .filter((m: any) => m.status !== "LEFT")
          .map((m: any) => ({
            id: m.id,
            name: m.user?.name ?? "Membre",
            role: m.role,
            status: m.status,
            memberNumber: m.memberNumber,
          }))
      );
    }
    setLoading(false);
  }, [id, meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeMembers = useMemo(() => members.filter((m) => m.status === "ACTIVE"), [members]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    meeting?.attendances?.forEach((a) => map.set(a.membershipId, a.status));
    return map;
  }, [meeting]);

  const presentCount = useMemo(
    () => [...attendanceMap.values()].filter((s) => s === "PRESENT" || s === "LATE").length,
    [attendanceMap]
  );
  const quorumPct = activeMembers.length > 0 ? Math.round((presentCount / activeMembers.length) * 100) : 0;

  const post = async (url: string, body: any, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action impossible");
      await load();
      return data;
    } catch (err: any) {
      setError(err?.message || "Erreur");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const patch = async (url: string, body: any, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Action impossible");
      await load();
      return data;
    } catch (err: any) {
      setError(err?.message || "Erreur");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const markAttendance = (membershipId: string, status: AttendanceStatus) =>
    patch(`/api/associations/${id}/meetings`, { meetingId, membershipId, attendanceStatus: status }, `att-${membershipId}`);

  const addFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fineForm.membershipId || Number(fineForm.amount) <= 0) {
      setError("Sélectionnez un membre et un montant valide.");
      return;
    }
    await post(
      `/api/associations/${id}/meetings/${meetingId}/fines`,
      { ...fineForm, amount: Number(fineForm.amount) },
      "fine-add"
    );
    setFineForm((f) => ({ ...f, notes: "" }));
  };

  const closeMeeting = async () => {
    if (!confirm("Clôturer la session ? Le pointage et les amendes resteront consultables.")) return;
    await patch(`/api/associations/${id}/meetings`, { meetingId, status: "HELD" }, "close");
  };

  if (loading) {
    return (
      <DashboardLayout title="Session">
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-warm-white" />
          <div className="h-64 animate-pulse rounded-2xl bg-warm-white" />
        </div>
      </DashboardLayout>
    );
  }

  if (!meeting) {
    return (
      <DashboardLayout title="Session introuvable">
        <div className="rounded-2xl border border-stone bg-warm-white p-12 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-error/50" />
          <h2 className="text-xl font-bold text-charcoal">Session introuvable</h2>
          <p className="mt-2 text-sm text-ash">Cette session n&apos;existe pas ou a été supprimée.</p>
          <Button className="mt-6" onClick={() => router.push(`/associations/${id}/reunions`)}>
            Retour aux sessions
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const agenda: Array<{ title: string; duration?: number; presenter?: string }> = (() => {
    if (!meeting.agenda) return [];
    try {
      const parsed = JSON.parse(meeting.agenda);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const unpaidFines = (meeting.fines ?? []).filter((f) => !f.paid);

  return (
    <DashboardLayout title={meeting.title || "Session"}>
      <div className="space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/associations/${id}/reunions`}
            className="inline-flex items-center gap-2 text-sm font-medium text-graphite hover:text-forest"
          >
            <ArrowLeft className="w-4 h-4" /> Sessions & réunions
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href={`/associations/${id}/meetings/${meetingId}/caisse`}>
              <Button variant="outline" size="sm">
                <Vault className="h-4 w-4" /> Ouvrir la caisse
              </Button>
            </Link>
            <Link href={`/associations/${id}/rapports`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4" /> Rapports
              </Button>
            </Link>
            {meeting.status !== "HELD" && (
              <Button size="sm" onClick={closeMeeting} loading={busy === "close"}>
                <CheckCircle2 className="h-4 w-4" /> Clôturer la session
              </Button>
            )}
          </div>
        </div>

        {/* En-tête */}
        <div className="relative overflow-hidden rounded-2xl bg-forest p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                <CalendarDays className="h-3.5 w-3.5" /> {TYPE_LABELS[meeting.type] ?? meeting.type}
              </div>
              <h1 className="text-3xl font-black tracking-tight">{meeting.title || "Session"}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-emerald-100/80">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gold" /> {formatDate(meeting.scheduledAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold" /> {meeting.location || "Lieu à préciser"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gold" /> {presentCount}/{activeMembers.length} présents
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={meeting.status === "HELD" ? "COMPLETED" : meeting.status} />
              <Badge variant={meeting.quorumReached ? "success" : "warning"}>
                Quorum {quorumPct}% / {meeting.quorumRequired ?? 0}%
              </Badge>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Présents", value: `${presentCount}`, icon: UserCheck, tone: "text-success" },
            { label: "Absents", value: `${activeMembers.length - presentCount}`, icon: XCircle, tone: "text-error" },
            {
              label: "Collation collectée",
              value: formatCurrency(collation?.collected ?? 0),
              icon: Coins,
              tone: "text-gold",
            },
            {
              label: "Amendes impayées",
              value: formatCurrency(unpaidFines.reduce((s, f) => s + f.amount, 0)),
              icon: AlertTriangle,
              tone: "text-warning",
            },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <k.icon className={`h-5 w-5 ${k.tone}`} />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ash">{k.label}</div>
                  <div className="text-lg font-bold text-charcoal">{k.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-stone bg-warm-white p-2">
          {[
            { key: "presences", label: "Pointage", icon: UserCheck },
            { key: "amendes", label: "Amendes", icon: Gavel },
            { key: "collation", label: "Collation", icon: Coins },
            { key: "agenda", label: "Ordre du jour", icon: ListChecks },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.key ? "bg-forest text-white shadow-sm" : "text-graphite hover:bg-cream"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "presences" && (
          <Card>
            <CardHeader>
              <CardTitle>Pointage des membres</CardTitle>
              <p className="mt-1 text-xs text-ash">
                Retard : amende automatique au-delà du seuil configuré. Absence : amende progressive.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone/60">
                {activeMembers.map((m) => {
                  const status = attendanceMap.get(m.id);
                  return (
                    <div key={m.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-charcoal">
                          {m.name}
                          {m.memberNumber ? (
                            <span className="ml-2 text-xs font-normal text-ash">#{m.memberNumber}</span>
                          ) : null}
                        </div>
                        <div className="text-xs text-ash">{m.role}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as AttendanceStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => markAttendance(m.id, s)}
                            disabled={busy === `att-${m.id}` || meeting.status === "HELD"}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              status === s
                                ? s === "PRESENT"
                                  ? "bg-success text-white"
                                  : s === "LATE"
                                  ? "bg-warning text-white"
                                  : s === "ABSENT"
                                  ? "bg-error text-white"
                                  : "bg-info text-white"
                                : "bg-cream text-graphite hover:bg-stone/60"
                            }`}
                          >
                            {ATTENDANCE_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {activeMembers.length === 0 && (
                  <p className="px-5 py-10 text-center text-sm text-ash">Aucun membre actif.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "amendes" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Amendes de la session</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-stone/60">
                  {(meeting.fines ?? []).map((f) => {
                    const member = members.find((m) => m.id === f.membershipId);
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div>
                          <div className="text-sm font-semibold text-charcoal">{member?.name ?? "Membre"}</div>
                          <div className="text-xs text-ash">
                            {FINE_LABELS[f.reason] ?? f.reason} · {formatCurrency(f.amount)}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            patch(
                              `/api/associations/${id}/meetings/${meetingId}/fines`,
                              { fineId: f.id, paid: !f.paid },
                              `fine-${f.id}`
                            )
                          }
                          disabled={busy === `fine-${f.id}`}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            f.paid ? "bg-success/10 text-success" : "bg-warning/10 text-warning hover:bg-warning/20"
                          }`}
                        >
                          {f.paid ? "Payée" : "Marquer payée"}
                        </button>
                      </div>
                    );
                  })}
                  {(meeting.fines ?? []).length === 0 && (
                    <p className="px-5 py-10 text-center text-sm text-ash">Aucune amende pour cette session.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Infliger une amende</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addFine} className="space-y-3">
                  <select
                    value={fineForm.membershipId}
                    onChange={(e) => setFineForm((f) => ({ ...f, membershipId: e.target.value }))}
                    className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="">— Membre —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={fineForm.reason}
                    onChange={(e) => setFineForm((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                  >
                    {Object.entries(FINE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={fineForm.amount}
                    onChange={(e) => setFineForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="Montant (FCFA)"
                    className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                    required
                  />
                  <input
                    value={fineForm.notes}
                    onChange={(e) => setFineForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Motif détaillé (optionnel)"
                    className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                  />
                  <Button type="submit" className="w-full" loading={busy === "fine-add"}>
                    Enregistrer l&apos;amende
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "collation" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Collecte de collation</CardTitle>
                {collation && (
                  <Badge variant={collation.rate > 0 ? "forest" : "default"}>
                    {collation.rate > 0 ? `${formatCurrency(collation.rate)} / membre` : "Non ouverte"}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-stone/60">
                  {(collation?.collations ?? []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <div>
                        <div className="text-sm font-medium text-charcoal">{c.memberName}</div>
                        <div className="text-xs text-ash">{formatCurrency(c.amount)}</div>
                      </div>
                      <button
                        onClick={() =>
                          post(
                            `/api/associations/${id}/meetings/${meetingId}/collation`,
                            { action: "TOGGLE", membershipId: c.membershipId, paid: !c.paid },
                            `coll-${c.membershipId}`
                          )
                        }
                        disabled={busy === `coll-${c.membershipId}` || meeting.collationStatus === "CLOSED"}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          c.paid ? "bg-success/10 text-success" : "bg-cream text-graphite hover:bg-stone/60"
                        }`}
                      >
                        {c.paid ? "Encaissé" : "Marquer encaissé"}
                      </button>
                    </div>
                  ))}
                  {(collation?.collations ?? []).length === 0 && (
                    <p className="px-5 py-10 text-center text-sm text-ash">
                      La collecte n&apos;est pas encore ouverte.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ouvrir / paramétrer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={collationRate}
                    onChange={(e) => setCollationRate(e.target.value)}
                    placeholder="Cotisation par membre"
                    className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                  />
                  <select
                    value={hostId}
                    onChange={(e) => setHostId(e.target.value)}
                    className="w-full rounded-xl border border-stone bg-white px-3 py-2 text-sm"
                  >
                    <option value="">— Hôte —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    className="w-full"
                    loading={busy === "coll-open"}
                    disabled={Number(collationRate) <= 0}
                    onClick={() =>
                      post(
                        `/api/associations/${id}/meetings/${meetingId}/collation`,
                        { action: "OPEN", rate: Number(collationRate), hostMembershipId: hostId || null },
                        "coll-open"
                      )
                    }
                  >
                    {meeting.collationStatus === "NONE" ? "Ouvrir la collecte" : "Mettre à jour"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reversement à l&apos;hôte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ash">Collecté</span>
                    <span className="font-semibold">{formatCurrency(collation?.collected ?? 0)}</span>
                  </div>
                  {collation?.hostPayoutLimit ? (
                    <div className="flex justify-between">
                      <span className="text-ash">Forfait hôte</span>
                      <span className="font-semibold">{formatCurrency(collation.hostPayoutLimit)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-ash">Arriérés de l&apos;hôte</span>
                    <span className="font-semibold text-warning">
                      −{formatCurrency(collation?.hostArrears ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone/60 pt-2">
                    <span className="font-semibold text-charcoal">Net à reverser</span>
                    <span className="text-lg font-black text-forest">
                      {formatCurrency(collation?.netPayout ?? 0)}
                    </span>
                  </div>
                  {meeting.collationStatus !== "CLOSED" && (
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      loading={busy === "coll-close"}
                      onClick={() =>
                        post(
                          `/api/associations/${id}/meetings/${meetingId}/collation`,
                          { action: "CLOSE" },
                          "coll-close"
                        )
                      }
                    >
                      Clôturer la collation
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === "agenda" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ordre du jour</CardTitle>
              </CardHeader>
              <CardContent>
                {agenda.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ash">Aucun point à l&apos;ordre du jour.</p>
                ) : (
                  <ol className="space-y-3">
                    {agenda.map((a, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-forest/10 text-xs font-bold text-forest">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-charcoal">{a.title}</p>
                          {(a.duration || a.presenter) && (
                            <p className="text-xs text-ash">
                              {a.duration ? `${a.duration} min` : ""} {a.presenter ? `· ${a.presenter}` : ""}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ash">Type</span>
                  <span className="font-medium">{TYPE_LABELS[meeting.type] ?? meeting.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ash">Date</span>
                  <span className="font-medium">{formatDate(meeting.scheduledAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ash">Quorum</span>
                  <span className="font-medium">
                    {quorumPct}% / {meeting.quorumRequired ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ash">Statut</span>
                  <StatusBadge status={meeting.status === "HELD" ? "COMPLETED" : meeting.status} />
                </div>
                {meeting.notes && (
                  <div className="border-t border-stone/60 pt-3 text-xs text-ash">{meeting.notes}</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
