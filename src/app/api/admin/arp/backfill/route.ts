import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { ensureArpProfile } from "@/lib/arp/server";

/**
 * Initialise les profils ARP manquants à partir des activités existantes.
 * Les profils créés sont ACTIVE/BACKFILL : ils n'interrompent pas l'existant
 * et restent à revoir par le bureau de chaque association.
 */
export async function POST() {
  const guard = await requireSystemAdmin("ASSOCIATIONS", "UPDATE");
  if (!guard.ok) return guard.response;

  const associations = await prisma.association.findMany({
    select: { id: true, name: true, arpProfile: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });

  const created: string[] = [];
  const existing: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const association of associations) {
    if (association.arpProfile) {
      existing.push(association.id);
      continue;
    }
    try {
      await ensureArpProfile(association.id);
      created.push(association.id);
    } catch (error) {
      failed.push({
        id: association.id,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return NextResponse.json({
    total: associations.length,
    created: created.length,
    existing: existing.length,
    failed: failed.length,
    failures: failed,
  });
}
