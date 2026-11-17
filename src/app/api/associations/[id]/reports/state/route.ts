import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { buildAssociationState } from "@/lib/association/association-state";

const BUREAU_ROLES = new Set([
  "FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ",
  "TREASURER", "TREASURER_ADJ", "CENSOR", "AUDITOR", "SOLIDARITY_OFFICER",
]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const membership = await prisma.associationMembership.findFirst({
    where: { associationId: id, userId: session.user.id, status: { not: "LEFT" } },
    select: { id: true, role: true },
  });
  const canView = Boolean(isPlatformAdmin(session) || (membership && BUREAU_ROLES.has(membership.role)));
  if (!canView) return NextResponse.json({ error: "Rapport de situation réservé au bureau" }, { status: 403 });

  try {
    const report = await buildAssociationState(id);
    return NextResponse.json({ ...report, canViewAll: true, viewerRole: membership?.role ?? "ADMIN" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message === "ASSOCIATION_NOT_FOUND" ? "Association introuvable" : "Rapport indisponible" }, { status: 404 });
  }
}
