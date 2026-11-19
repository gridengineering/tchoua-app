import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAppScope, safeAppSlug } from "@/lib/apps";
import { authenticateDeveloper } from "@/lib/apps/developer-auth";

export async function POST(req: NextRequest) {
  const developer = await authenticateDeveloper(req);
  if (!developer) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const scope = String(body.scope || "").toUpperCase();
  const slug = safeAppSlug(String(body.slug || name));
  if (!name || !slug || !isAppScope(scope)) {
    return NextResponse.json({ error: "name, slug et scope valides requis" }, { status: 400 });
  }
  const manifest = body.manifest && typeof body.manifest === "object" ? body.manifest : {};
  if (!manifest.entryUrl) {
    return NextResponse.json({ error: "Le manifest doit contenir entryUrl." }, { status: 400 });
  }
  const existing = await prisma.platformApp.findUnique({ where: { slug } });
  if (existing && existing.developerName !== (developer.user.name || developer.user.email)) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });
  }
  const app = await prisma.platformApp.upsert({
    where: { slug },
    update: {
      name,
      tagline: body.tagline ?? null,
      description: body.description ?? null,
      scope,
      category: body.category || "Productivité",
      status: "DRAFT",
      version: String(manifest.version || "1.0.0"),
      developerName: String(body.developerName || developer.user.name || developer.user.email || "Développeur"),
      developerUrl: body.developerUrl ?? null,
      repositoryUrl: body.repositoryUrl ?? null,
      homepageUrl: body.homepageUrl ?? null,
      iconUrl: body.iconUrl ?? null,
      manifest: JSON.stringify(manifest),
      permissions: JSON.stringify(manifest.permissions || []),
      screenshots: JSON.stringify(body.screenshots || []),
      descriptionHtml: body.descriptionHtml || null,
      descriptionUrl: body.descriptionUrl || null,
    },
    create: {
      slug,
      name,
      tagline: body.tagline ?? null,
      description: body.description ?? null,
      scope,
      category: body.category || "Productivité",
      status: "DRAFT",
      version: String(manifest.version || "1.0.0"),
      developerName: String(body.developerName || developer.user.name || developer.user.email || "Développeur"),
      developerUrl: body.developerUrl ?? null,
      repositoryUrl: body.repositoryUrl ?? null,
      homepageUrl: body.homepageUrl ?? null,
      iconUrl: body.iconUrl ?? null,
      manifest: JSON.stringify(manifest),
      permissions: JSON.stringify(manifest.permissions || []),
      screenshots: JSON.stringify(body.screenshots || []),
      descriptionHtml: body.descriptionHtml || null,
      descriptionUrl: body.descriptionUrl || null,
    },
  });
  return NextResponse.json({ app, message: "App soumise en brouillon. L'administration doit la publier." }, { status: 201 });
}
