import { NextResponse } from "next/server";
import { getPlatformSettings, toPublicSettings } from "@/lib/platform-settings";

/**
 * Paramètres publics de la plateforme (branding, maintenance, fonctionnalités).
 * Aucune donnée sensible n'est exposée.
 */
export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({ settings: toPublicSettings(settings) });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
