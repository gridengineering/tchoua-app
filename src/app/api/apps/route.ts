import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { requireSystemAdmin } from "@/lib/admin-auth";
import {
  APP_SCOPES,
  APP_SCOPE_LABELS,
  isAppScope,
  normalizeApp,
} from "@/lib/apps";

async function viewer(userId: string) {
  const memberships = await prisma.associationMembership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { associationId: true, role: true },
  });
  return memberships;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "MEMBER").toUpperCase();
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const associationId = searchParams.get("associationId") || "";
  const installedOnly = searchParams.get("installed") === "true";

  if (!isAppScope(scope)) return NextResponse.json({ error: "Scope invalide" }, { status: 400 });
  if (!userId && scope !== "MEMBER") {
    return NextResponse.json({ error: "Connectez-vous pour accéder à cet espace d'applications." }, { status: 401 });
  }
  if (scope === "ADMIN" && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Les apps d'administration sont réservées aux administrateurs." }, { status: 403 });
  }

  const memberships = userId ? await viewer(userId) : [];
  let associationRole: string | null = null;
  if (scope === "ASSOCIATION") {
    if (!associationId) return NextResponse.json({ error: "associationId requis" }, { status: 400 });
    const membership = memberships.find((item) => item.associationId === associationId);
    if (!membership || !["FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"].includes(membership.role)) {
      return NextResponse.json({ error: "Les apps d'association sont réservées au fondateur et au bureau." }, { status: 403 });
    }
    associationRole = membership.role;
  }

  const where: any = {
    status: "PUBLISHED",
    scope,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
    ...(category ? { category } : {}),
  };

  const apps = await prisma.platformApp.findMany({
    where,
    orderBy: [{ installCount: "desc" }, { name: "asc" }],
  });

  const installations = await prisma.appInstallation.findMany({
    where: {
      ...(scope === "ASSOCIATION" ? { associationId } : { userId: userId ?? "__anonymous__" }),
      status: "ACTIVE",
    },
    orderBy: { updatedAt: "desc" },
  });

  const filtered = installedOnly
    ? apps.filter((app) => installations.some((installation) => installation.appId === app.id))
    : apps;

  const categories = Array.from(new Set((await prisma.platformApp.findMany({
    where: { status: "PUBLISHED", scope },
    select: { category: true },
  })).map((item) => item.category)));

  return NextResponse.json({
    apps: filtered.map((app) => normalizeApp(app, installations)),
    scope,
    scopeLabel: APP_SCOPE_LABELS[scope as keyof typeof APP_SCOPE_LABELS],
    categories,
    associationRole,
    scopes: APP_SCOPES,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "").trim();
  const name = String(body.name || "").trim();
  const scope = String(body.scope || "").toUpperCase();
  if (!slug || !name || !isAppScope(scope)) {
    return NextResponse.json({ error: "slug, name et scope valides requis" }, { status: 400 });
  }
  const app = await prisma.platformApp.upsert({
    where: { slug },
    update: {
      name,
      tagline: body.tagline ?? null,
      description: body.description ?? null,
      scope,
      category: body.category || "Productivité",
      status: body.status || "PUBLISHED",
      version: body.version || "1.0.0",
      developerName: body.developerName || "Tchoua Labs",
      developerUrl: body.developerUrl ?? null,
      repositoryUrl: body.repositoryUrl ?? null,
      homepageUrl: body.homepageUrl ?? null,
      iconUrl: body.iconUrl ?? null,
      coverUrl: body.coverUrl ?? null,
      manifest: body.manifest ? JSON.stringify(body.manifest) : null,
      permissions: body.permissions ? JSON.stringify(body.permissions) : null,
      screenshots: body.screenshots ? JSON.stringify(body.screenshots) : null,
      descriptionHtml: body.descriptionHtml ?? null,
      descriptionUrl: body.descriptionUrl ?? null,
    },
    create: {
      slug,
      name,
      tagline: body.tagline ?? null,
      description: body.description ?? null,
      scope,
      category: body.category || "Productivité",
      status: body.status || "PUBLISHED",
      version: body.version || "1.0.0",
      developerName: body.developerName || "Tchoua Labs",
      developerUrl: body.developerUrl ?? null,
      repositoryUrl: body.repositoryUrl ?? null,
      homepageUrl: body.homepageUrl ?? null,
      iconUrl: body.iconUrl ?? null,
      coverUrl: body.coverUrl ?? null,
      manifest: body.manifest ? JSON.stringify(body.manifest) : null,
      permissions: body.permissions ? JSON.stringify(body.permissions) : null,
      screenshots: body.screenshots ? JSON.stringify(body.screenshots) : null,
      descriptionHtml: body.descriptionHtml ?? null,
      descriptionUrl: body.descriptionUrl ?? null,
    },
  });
  return NextResponse.json({ app: normalizeApp(app, []) }, { status: 201 });
}
