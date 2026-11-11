import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import {
  DEFAULT_PLATFORM_SETTINGS,
  getPlatformSettings,
  getPlatformSettingsMeta,
  savePlatformSettings,
} from "@/lib/platform-settings";

export async function GET() {
  const guard = await requireSystemAdmin("SETTINGS", "READ");
  if (!guard.ok) return guard.response;

  try {
    const [settings, meta] = await Promise.all([
      getPlatformSettings(),
      getPlatformSettingsMeta(),
    ]);
    return NextResponse.json({ settings, meta, defaults: DEFAULT_PLATFORM_SETTINGS });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function persist(body: any) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;

  try {
    const action = typeof body?.action === "string" ? body.action.toUpperCase() : "SAVE";

    if (action === "RESET") {
      const settings = await savePlatformSettings(DEFAULT_PLATFORM_SETTINGS as any, guard.user.id);
      await prisma.auditLog.create({
        data: {
          userId: guard.user.id,
          action: "SETTINGS_RESET",
          entity: "SETTINGS",
          details: "Réinitialisation des paramètres de la plateforme",
        },
      });
      return NextResponse.json({ settings, reset: true });
    }

    const patch = body?.settings && typeof body.settings === "object" ? body.settings : body;
    if (!patch || typeof patch !== "object") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const settings = await savePlatformSettings(patch, guard.user.id);

    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "SETTINGS_UPDATE",
        entity: "SETTINGS",
        details: `Mise à jour des paramètres plateforme : ${Object.keys(patch).join(", ")}`,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[POST /api/admin/settings]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return persist(body);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return persist(body);
}
