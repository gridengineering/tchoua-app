import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { normalizeApp } from "@/lib/apps";

async function appForUser(slug: string, userId: string) {
  const app = await prisma.platformApp.findUnique({ where: { slug } });
  if (!app) return null;
  const installs = await prisma.appInstallation.findMany({
    where: { appId: app.id, OR: [{ userId }, { association: { memberships: { some: { userId, status: "ACTIVE" } } } }] },
    orderBy: { updatedAt: "desc" },
  });
  return { app, installs };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { slug } = await params;
  const found = await appForUser(slug, session.user.id);
  if (!found) return NextResponse.json({ error: "App introuvable" }, { status: 404 });
  if (found.app.scope === "ADMIN" && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "App réservée aux administrateurs." }, { status: 403 });
  }
  return NextResponse.json({ app: normalizeApp(found.app, found.installs) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const app = await prisma.platformApp.findUnique({ where: { slug } });
  if (!app) return NextResponse.json({ error: "App introuvable" }, { status: 404 });
  const updated = await prisma.platformApp.update({
    where: { slug },
    data: {
      ...(body.name !== undefined && { name: String(body.name) }),
      ...(body.tagline !== undefined && { tagline: String(body.tagline) || null }),
      ...(body.description !== undefined && { description: String(body.description) || null }),
      ...(body.category !== undefined && { category: String(body.category) || "Productivité" }),
      ...(body.status !== undefined && { status: String(body.status) }),
      ...(body.version !== undefined && { version: String(body.version) }),
      ...(body.developerName !== undefined && { developerName: String(body.developerName) }),
      ...(body.repositoryUrl !== undefined && { repositoryUrl: String(body.repositoryUrl) || null }),
      ...(body.homepageUrl !== undefined && { homepageUrl: String(body.homepageUrl) || null }),
      ...(body.iconUrl !== undefined && { iconUrl: String(body.iconUrl) || null }),
      ...(body.manifest !== undefined && { manifest: JSON.stringify(body.manifest) }),
      ...(body.permissions !== undefined && { permissions: JSON.stringify(body.permissions) }),
      ...(body.screenshots !== undefined && { screenshots: JSON.stringify(body.screenshots) }),
    },
  });
  return NextResponse.json({ app: normalizeApp(updated, []) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;
  const { slug } = await params;
  const app = await prisma.platformApp.update({ where: { slug }, data: { status: "SUSPENDED" } }).catch(() => null);
  if (!app) return NextResponse.json({ error: "App introuvable" }, { status: 404 });
  return NextResponse.json({ success: true });
}
