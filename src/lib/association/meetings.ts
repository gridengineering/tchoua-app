import { prisma } from "@/lib/prisma";
import {
  getNextSessions,
  migrateConfig,
  parseFrequencyConfig,
  type FrequencyConfig,
} from "@/lib/frequency";

export const MEETING_BUREAU_ROLES = [
  "FOUNDER",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
  "SOLIDARITY_OFFICER",
  "AUDITOR",
];

export function isMeetingBureau(role?: string | null): boolean {
  return MEETING_BUREAU_ROLES.includes(String(role ?? ""));
}

export function parseMeetingConfig(value?: string | null): any {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const DEFAULT_AGENDA_TEMPLATE = [
  "Appel et vérification du quorum",
  "Lecture et adoption du procès-verbal précédent",
  "Situation financière de l'association",
  "Point sur les activités et engagements",
  "Décisions et résolutions",
  "Prochaine session : lieu, date et heure",
];

export function agendaTemplate(meetingConfig: any): string[] {
  const hasExplicit = meetingConfig?.agendaTemplate !== undefined || meetingConfig?.agendaModel !== undefined;
  if (!hasExplicit) return DEFAULT_AGENDA_TEMPLATE;
  const raw = meetingConfig?.agendaTemplate ?? meetingConfig?.agendaModel ?? [];
  if (Array.isArray(raw)) {
    return raw.map((x) => (typeof x === "string" ? x : x?.title)).filter(Boolean).map(String);
  }
  if (typeof raw === "string") return raw.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

/**
 * Fréquence de proposition des sessions ordinaires.
 * - `sessionsEnabled=false` ou `sessionMode=NONE` : aucune proposition.
 * - `sessionRule` (NTH_WEEKDAY, FIRST_AFTER, …) est prioritaire.
 * - sinon on reprend le jour de la semaine du meetingConfig.
 */
export function meetingFrequency(meetingConfig: any): FrequencyConfig | null {
  if (!meetingConfig || meetingConfig.sessionsEnabled === false || meetingConfig.sessionMode === "NONE") return null;
  const hour = Number(meetingConfig.hour ?? 15);
  const startTime = `${String(Math.max(0, Math.min(23, hour))).padStart(2, "0")}:00`;
  // La fréquence des réunions est portée par l'association (FrequencyPicker).
  const rawFrequency = meetingConfig.frequencyConfig;
  if (rawFrequency) {
    const config = typeof rawFrequency === "string"
      ? parseFrequencyConfig(rawFrequency)
      : migrateConfig(rawFrequency as FrequencyConfig);
    return { ...config, startTime: config.startTime ?? startTime } as FrequencyConfig;
  }
  const every = meetingConfig.frequency === "QUARTERLY" ? 3 : 1;
  const rule = meetingConfig.sessionRule;
  if (rule && typeof rule === "object" && rule.kind) {
    return { mode: "MONTHLY", every, rule, startTime } as FrequencyConfig;
  }
  const dow = Number(meetingConfig.dayOfWeek);
  if (!Number.isFinite(dow)) return null;
  return {
    mode: "MONTHLY",
    every,
    rule: { kind: "NTH_WEEKDAY", position: 1, weekday: dow },
    startTime,
  } as FrequencyConfig;
}

export function suggestNextSession(meetingConfig: any, from = new Date()): Date | null {
  const frequency = meetingFrequency(meetingConfig);
  if (!frequency) return null;
  try {
    const date = getNextSessions(frequency, 1, { from })[0];
    if (!date) return null;
    const hour = Number(meetingConfig.hour ?? 15);
    date.setHours(Number.isFinite(hour) ? Math.max(0, Math.min(23, hour)) : 15, 0, 0, 0);
    return date;
  } catch {
    return null;
  }
}

export async function currentRotation(associationId: string) {
  const latest = await prisma.hostingRotation.findFirst({
    where: { associationId },
    orderBy: [{ cycle: "desc" }, { position: "desc" }],
    select: { cycle: true },
  });
  let cycle = latest?.cycle ?? 1;
  let list = await prisma.hostingRotation.findMany({
    where: { associationId, cycle },
    orderBy: { position: "asc" },
    include: { membership: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  // Une tournée terminée redémarre automatiquement un nouveau cycle, en conservant l'ordre.
  if (list.length > 0 && !list.some((x) => x.status === "PENDING")) {
    const nextCycle = cycle + 1;
    await prisma.hostingRotation.createMany({
      data: list.map((r) => ({
        associationId,
        membershipId: r.membershipId,
        position: r.position,
        cycle: nextCycle,
        address: r.address,
        notes: r.notes,
        status: "PENDING",
      })),
      skipDuplicates: true,
    }).catch(() => null);
    cycle = nextCycle;
    list = await prisma.hostingRotation.findMany({
      where: { associationId, cycle },
      orderBy: { position: "asc" },
      include: { membership: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
  }
  return { cycle, list, next: list.find((x) => x.status === "PENDING") ?? null };
}

export function publicRotation(list: any[]) {
  return list.map((r) => ({
    id: r.id,
    membershipId: r.membershipId,
    name: r.membership?.user?.name ?? "Membre",
    position: r.position,
    cycle: r.cycle,
    address: r.address,
    status: r.status,
    hostedMeetingId: r.hostedMeetingId,
  }));
}

export async function postMeetingMessage(params: {
  associationId: string;
  membershipId: string;
  content: string;
  type?: "SYSTEM" | "DOCUMENT";
  mediaUrl?: string | null;
  channel?: string;
}) {
  return prisma.assocMessage.create({
    data: {
      associationId: params.associationId,
      membershipId: params.membershipId,
      content: params.content.slice(0, 8000),
      type: params.type ?? "SYSTEM",
      mediaUrl: params.mediaUrl ?? null,
      channel: params.channel ?? "GENERAL",
    },
  });
}

export function meetingDateLabel(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function meetingStatusLabel(status: string) {
  return ({ PLANNED: "Planifiée", HELD: "Tenue", CLOSED: "Clôturée", CANCELLED: "Annulée" } as Record<string, string>)[status] ?? status;
}
