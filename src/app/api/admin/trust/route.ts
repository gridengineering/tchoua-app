import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { computeAllAssociationTrust, computeAssociationTrust, TRUST_LEVELS } from "@/lib/trust";

export async function GET(request: NextRequest) {
  const guard = await requireSystemAdmin("ASSOCIATIONS", "READ");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const quarantined = searchParams.get("quarantined");

  const associations = await prisma.association.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(quarantined === "1" ? { quarantinedAt: { not: null } } : {}),
    },
    select: {
      id: true, name: true, type: true, status: true, region: true, createdAt: true,
      trustScore: true, trustLevel: true, trustBreakdown: true, trustComputedAt: true,
      quarantinedAt: true, quarantineReason: true,
      _count: { select: { memberships: { where: { status: "ACTIVE" } }, activities: true, documents: true } },
    },
    orderBy: [{ trustScore: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ associations, levels: TRUST_LEVELS });
}

export async function POST(request: NextRequest) {
  const guard = await requireSystemAdmin("ASSOCIATIONS", "UPDATE");
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const associationId = body.associationId ? String(body.associationId) : null;

  try {
    if (associationId) {
      const breakdown = await computeAssociationTrust(associationId);
      await prisma.auditLog.create({
        data: {
          userId: guard.user.id,
          action: "TRUST_RECOMPUTE",
          entity: "ASSOCIATIONS",
          entityId: associationId,
          details: `Score de confiance recalculé : ${breakdown.score}/100 (${breakdown.label})`,
        },
      });
      return NextResponse.json({ breakdown });
    }

    const results = await computeAllAssociationTrust();
    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "TRUST_RECOMPUTE_ALL",
        entity: "ASSOCIATIONS",
        details: `Recalcul global du score de confiance de ${results.length} association(s)`,
      },
    });
    return NextResponse.json({ count: results.length, results });
  } catch (error) {
    console.error("[TRUST]", error);
    return NextResponse.json({ error: "Calcul de confiance impossible" }, { status: 500 });
  }
}
