import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ensureAssociationLogo } from "@/lib/association/default-logo";

export async function POST() {
  const guard = await requireSystemAdmin("ASSOCIATIONS", "UPDATE");
  if (!guard.ok) return guard.response;
  const associations = await prisma.association.findMany({ select: { id: true, name: true, color: true, logo: true } });
  let generated = 0;
  const failed: string[] = [];
  for (const association of associations) {
    if (association.logo) continue;
    try {
      await ensureAssociationLogo(association);
      generated += 1;
    } catch {
      failed.push(association.id);
    }
  }
  return NextResponse.json({ total: associations.length, generated, skipped: associations.length - generated - failed.length, failed });
}
