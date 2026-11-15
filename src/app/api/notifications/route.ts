import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 50), 100);
  const unreadOnly = new URL(req.url).searchParams.get("unreadOnly") === "true";
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" }, take: limit,
    }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
  if (ids.length === 0) {
    await prisma.notification.updateMany({ where: { userId: session.user.id }, data: { isRead: true } });
  } else {
    await prisma.notification.updateMany({ where: { userId: session.user.id, id: { in: ids } }, data: { isRead: true } });
  }
  return NextResponse.json({ ok: true });
}
