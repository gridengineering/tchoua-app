import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  agendaTemplate,
  isMeetingBureau,
  parseMeetingConfig,
  postMeetingMessage,
} from "@/lib/association/meetings";

async function context(associationId: string, meetingId: string, userId: string) {
  const me = await prisma.associationMembership.findFirst({
    where: { associationId, userId, status: { not: "LEFT" } },
    select: { id: true, role: true },
  });
  if (!me) return { error: NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 }) };
  const meeting = await prisma.assocMeeting.findFirst({
    where: { id: meetingId, associationId },
    include: { association: { select: { meetingConfig: true } } },
  });
  if (!meeting) return { error: NextResponse.json({ error: "Session introuvable" }, { status: 404 }) };
  return { me, meeting };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, meetingId } = await params;
  const ctx = await context(id, meetingId, session.user.id);
  if (ctx.error) return ctx.error;
  const items = await prisma.assocMeetingAgendaItem.findMany({ where: { meetingId }, orderBy: { order: "asc" } });
  return NextResponse.json({
    items,
    template: agendaTemplate(parseMeetingConfig(ctx.meeting.association.meetingConfig)),
    canEdit: isMeetingBureau(ctx.me.role) && !ctx.meeting.closedAt,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, meetingId } = await params;
  const ctx = await context(id, meetingId, session.user.id);
  if (ctx.error) return ctx.error;
  if (!isMeetingBureau(ctx.me.role)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  if (ctx.meeting.closedAt) return NextResponse.json({ error: "Session clôturée" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const template = agendaTemplate(parseMeetingConfig(ctx.meeting.association.meetingConfig));
  const source = body.loadTemplate ? template.map((title) => ({ title })) : Array.isArray(body.items) ? body.items : [];
  const items = source
    .map((item: any, index: number) => ({
      title: String(item?.title ?? "").trim(),
      presenterId: item?.presenterId ? String(item.presenterId) : null,
      durationMin: item?.durationMin != null ? Math.max(0, Number(item.durationMin)) : null,
      content: item?.content != null ? String(item.content).slice(0, 20000) : null,
      decision: item?.decision != null ? String(item.decision).slice(0, 5000) : null,
      order: index + 1,
    }))
    .filter((item: any) => item.title);
  if (!items.length) return NextResponse.json({ error: "Ajoutez au moins un point à l'ordre du jour." }, { status: 400 });

  const saved = await prisma.$transaction(async (tx) => {
    await tx.assocMeetingAgendaItem.deleteMany({ where: { meetingId } });
    await tx.assocMeetingAgendaItem.createMany({ data: items.map((item: any) => ({ ...item, meetingId })) });
    return tx.assocMeetingAgendaItem.findMany({ where: { meetingId }, orderBy: { order: "asc" } });
  });
  await postMeetingMessage({ associationId: id, membershipId: ctx.me.id, content: `📋 Ordre du jour mis à jour (${saved.length} point${saved.length > 1 ? "s" : ""}) : ${saved.map((x) => x.title).join(" · ").slice(0, 1500)}` }).catch(() => {});
  return NextResponse.json({ items: saved }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; meetingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, meetingId } = await params;
  const ctx = await context(id, meetingId, session.user.id);
  if (ctx.error) return ctx.error;
  if (!isMeetingBureau(ctx.me.role)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  if (ctx.meeting.closedAt) return NextResponse.json({ error: "Session clôturée" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const itemId = String(body.itemId ?? body.id ?? "");
  if (!itemId) return NextResponse.json({ error: "itemId requis" }, { status: 400 });
  const existing = await prisma.assocMeetingAgendaItem.findFirst({ where: { id: itemId, meetingId } });
  if (!existing) return NextResponse.json({ error: "Point introuvable" }, { status: 404 });
  const data: any = {};
  if (body.title !== undefined) data.title = String(body.title).slice(0, 500);
  if (body.content !== undefined) data.content = body.content ? String(body.content).slice(0, 20000) : null;
  if (body.decision !== undefined) data.decision = body.decision ? String(body.decision).slice(0, 5000) : null;
  if (body.presenterId !== undefined) data.presenterId = body.presenterId || null;
  if (body.durationMin !== undefined) data.durationMin = body.durationMin === null ? null : Math.max(0, Number(body.durationMin));
  const item = await prisma.assocMeetingAgendaItem.update({ where: { id: itemId }, data });
  if (body.content !== undefined || body.decision !== undefined || body.title !== undefined) {
    const excerpt = String(item.content ?? item.decision ?? "").replace(/\s+/g, " ").slice(0, 700);
    await postMeetingMessage({
      associationId: id,
      membershipId: ctx.me.id,
      content: `📝 ${item.title}${excerpt ? ` — ${excerpt}` : " (mis à jour)"}`,
    }).catch(() => {});
  }
  return NextResponse.json({ item });
}
