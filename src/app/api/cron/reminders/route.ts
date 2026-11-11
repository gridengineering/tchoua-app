import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayOffset(from: Date, target: Date): number {
  return Math.round((startOfUtcDay(target).getTime() - startOfUtcDay(from).getTime()) / DAY_MS);
}

/**
 * Rappels automatiques J-3 / J-1 / Jour J (Module 8.2).
 * Appelé par un cron système avec l'en-tête `x-cron-secret`.
 * Crée des notifications in-app pour chaque membre actif, avec déduplication journalière.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (provided !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get("dryRun") === "1";

  const now = new Date();
  const today = startOfUtcDay(now);
  const horizon = new Date(today.getTime() + 4 * DAY_MS);

  const [meetings, sessions] = await Promise.all([
    prisma.assocMeeting.findMany({
      where: { status: "PLANNED", scheduledAt: { gte: today, lt: horizon } },
      select: {
        id: true,
        title: true,
        type: true,
        scheduledAt: true,
        associationId: true,
        location: true,
        association: { select: { name: true } },
      },
    }),
    prisma.activitySession.findMany({
      where: { status: "UPCOMING", scheduledAt: { gte: today, lt: horizon } },
      select: {
        id: true,
        sessionNumber: true,
        scheduledAt: true,
        activity: {
          select: {
            id: true,
            name: true,
            associationId: true,
            association: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const planned: Array<{
    associationId: string;
    offset: number;
    title: string;
    message: string;
    link: string;
  }> = [];

  for (const m of meetings) {
    const offset = dayOffset(now, m.scheduledAt);
    if (![0, 1, 3].includes(offset)) continue;
    const label = offset === 0 ? "Aujourd'hui" : `J-${offset}`;
    planned.push({
      associationId: m.associationId,
      offset,
      title: `Rappel ${label} : ${m.title || "session"}`,
      message: `${m.association.name} — ${m.title || "Session"} le ${m.scheduledAt.toLocaleDateString("fr-FR")} à ${m.scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}${m.location ? ` (${m.location})` : ""}.`,
      link: `/associations/${m.associationId}/reunions/${m.id}`,
    });
  }

  for (const s of sessions) {
    const offset = dayOffset(now, s.scheduledAt);
    if (![0, 1, 3].includes(offset)) continue;
    const label = offset === 0 ? "Aujourd'hui" : `J-${offset}`;
    planned.push({
      associationId: s.activity.associationId,
      offset,
      title: `Rappel ${label} : session ${s.activity.name}`,
      message: `${s.activity.association.name} — session n°${s.sessionNumber} de « ${s.activity.name} » le ${s.scheduledAt.toLocaleDateString("fr-FR")}.`,
      link: `/associations/${s.activity.associationId}/activities/${s.activity.id}`,
    });
  }

  let created = 0;
  const details: Array<{ title: string; link: string; offset: number; recipients: number }> = [];

  for (const item of planned) {
    const associationId = item.associationId;
    const members = await prisma.associationMembership.findMany({
      where: { associationId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!members.length) continue;

    const already = await prisma.associationNotification.findMany({
      where: {
        associationId,
        membershipId: { in: members.map((m) => m.id) },
        title: item.title,
        link: item.link,
        createdAt: { gte: today },
      },
      select: { membershipId: true },
    });
    const done = new Set(already.map((a) => a.membershipId));
    const targets = members.filter((m) => !done.has(m.id));

    details.push({ title: item.title, link: item.link, offset: item.offset, recipients: targets.length });

    if (dryRun || !targets.length) continue;

    await prisma.associationNotification.createMany({
      data: targets.map((m) => ({
        associationId,
        membershipId: m.id,
        title: item.title,
        message: item.message,
        type: "INFO",
        link: item.link,
      })),
    });
    created += targets.length;
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    events: planned.length,
    created,
    details,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
