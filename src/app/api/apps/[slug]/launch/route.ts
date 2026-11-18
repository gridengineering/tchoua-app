import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { isBureauRole, parseAppJson, type AppManifest } from "@/lib/apps";
import { createAppToken } from "@/lib/apps/token";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { slug } = await params;
  const app = await prisma.platformApp.findUnique({ where: { slug } });
  if (!app || app.status !== "PUBLISHED") return NextResponse.json({ error: "App introuvable" }, { status: 404 });
  if (app.scope === "ADMIN" && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Application réservée aux administrateurs." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const associationId = searchParams.get("associationId") || null;
  if (app.scope === "ASSOCIATION") {
    if (!associationId) return NextResponse.json({ error: "associationId requis" }, { status: 400 });
    const membership = await prisma.associationMembership.findFirst({
      where: { userId: session.user.id, associationId, status: "ACTIVE" },
      select: { role: true },
    });
    if (!membership || !isBureauRole(membership.role)) {
      return NextResponse.json({ error: "Réservé au fondateur et au bureau." }, { status: 403 });
    }
  }

  const installation = await prisma.appInstallation.findFirst({
    where: app.scope === "ASSOCIATION"
      ? { appId: app.id, associationId, status: "ACTIVE" }
      : { appId: app.id, userId: session.user.id, status: "ACTIVE" },
  });
  if (!installation) return NextResponse.json({ error: "Installez l'app avant de l'ouvrir." }, { status: 403 });

  const manifest = parseAppJson<AppManifest>(app.manifest, {});
  const entryUrl = manifest.entryUrl || app.homepageUrl;
  if (!entryUrl) return NextResponse.json({ error: "Cette app n'a pas d'URL d'entrée." }, { status: 422 });

  const exp = Math.floor(Date.now() / 1000) + 60 * 30;
  const token = createAppToken({
    appId: app.id,
    slug: app.slug,
    installationId: installation.id,
    userId: session.user.id,
    associationId,
    scope: app.scope as any,
    exp,
  });

  const separator = entryUrl.includes("?") ? "&" : "?";
  return NextResponse.json({
    app: { id: app.id, slug: app.slug, name: app.name, scope: app.scope },
    installation,
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
    launchUrl: `${entryUrl}${separator}tchoua_token=${encodeURIComponent(token)}`,
  });
}
