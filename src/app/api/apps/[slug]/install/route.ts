import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { isBureauRole } from "@/lib/apps";

async function membershipFor(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: "ACTIVE" },
    select: { id: true, role: true },
  });
}

async function resolve(req: NextRequest, slug: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  const app = await prisma.platformApp.findUnique({ where: { slug } });
  if (!app || app.status !== "PUBLISHED") return { error: NextResponse.json({ error: "App introuvable" }, { status: 404 }) };

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const associationId = String(body.associationId || new URL(req.url).searchParams.get("associationId") || "") || null;

  if (app.scope === "ADMIN" && !isPlatformAdmin(session)) {
    return { error: NextResponse.json({ error: "Application réservée aux administrateurs." }, { status: 403 }) };
  }
  if (app.scope === "ASSOCIATION") {
    if (!associationId) return { error: NextResponse.json({ error: "associationId requis" }, { status: 400 }) };
    const membership = await membershipFor(session.user.id, associationId);
    if (!membership || !isBureauRole(membership.role)) {
      return { error: NextResponse.json({ error: "Réservé au fondateur et aux membres du bureau." }, { status: 403 }) };
    }
  }
  return { session, app, associationId };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolve(req, slug);
  if ("error" in resolved) return resolved.error;
  const { session, app, associationId } = resolved;
  const target = app.scope === "ASSOCIATION"
    ? { associationId }
    : { userId: session.user.id as string, associationId: null };
  const existing = await prisma.appInstallation.findFirst({
    where: { appId: app.id, ...target },
  });
  const installation = existing
    ? await prisma.appInstallation.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", version: app.version },
      })
    : await prisma.appInstallation.create({
        data: { appId: app.id, ...target, status: "ACTIVE", version: app.version },
      });
  if (!existing) {
    await prisma.platformApp.update({ where: { id: app.id }, data: { installCount: { increment: 1 } } }).catch(() => null);
  }
  return NextResponse.json({ installation, updated: Boolean(existing) }, { status: existing ? 200 : 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolve(req, slug);
  if ("error" in resolved) return resolved.error;
  const { session, app, associationId } = resolved;
  const where = app.scope === "ASSOCIATION"
    ? { appId: app.id, associationId }
    : { appId: app.id, userId: session.user.id as string };
  const deleted = await prisma.appInstallation.deleteMany({ where });
  if (deleted.count > 0) {
    await prisma.platformApp.update({
      where: { id: app.id },
      data: { installCount: { decrement: deleted.count } },
    }).catch(() => null);
  }
  return NextResponse.json({ success: true, deleted: deleted.count });
}
