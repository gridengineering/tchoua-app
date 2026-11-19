import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeApp } from "@/lib/apps";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await prisma.platformApp.findUnique({ where: { slug } });
  if (!app || app.status !== "PUBLISHED") {
    return NextResponse.json({ error: "App introuvable." }, { status: 404 });
  }
  return NextResponse.json({
    app: normalizeApp(app, []),
    descriptionHtml: app.descriptionHtml ?? null,
    descriptionUrl: app.descriptionUrl ?? null,
    screenshots: (() => {
      try {
        const parsed = JSON.parse(app.screenshots || "[]");
        return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
      } catch {
        return [];
      }
    })(),
  });
}
