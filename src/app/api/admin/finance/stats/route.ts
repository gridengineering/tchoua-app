import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireSystemAdmin("FINANCE", "READ");
    if (!guard.ok) return guard.response;

    // En théorie, ici on ferait des agrégations complexes sur les transactions réelles.
    // Pour l'instant, on va simuler des KPIs basés sur les données existantes.

    const [
      totalAssocs,
      totalMembers,
      totalContributions, // Dummy aggregation for demo
      totalLoans, // Dummy aggregation
    ] = await Promise.all([
      prisma.association.count(),
      prisma.user.count({ where: { assocMemberships: { some: {} } } }),
      prisma.$queryRaw`SELECT SUM(amount) as total FROM contributions WHERE status = 'PAID'` as Promise<any[]>,
      prisma.$queryRaw`SELECT SUM(amount) as total FROM loans WHERE status = 'ACTIVE'` as Promise<any[]>,
    ]);

    // Format results
    const stats = {
      totalVolume: (totalContributions[0]?.total || 0) + (totalLoans[0]?.total || 0),
      totalContributions: totalContributions[0]?.total || 0,
      totalLoans: totalLoans[0]?.total || 0,
      platformRevenue: (totalContributions[0]?.total || 0) * 0.01, // 1% commission simulate
      activeAssociations: totalAssocs,
      activeMembers: totalMembers,
      monthlyGrowth: 12.5,
      // Répartition par type
      distribution: [
        { name: "Tontines", value: 65, color: "#10b981" },
        { name: "MFI / Crédits", value: 20, color: "#3b82f6" },
        { name: "Social / Aide", value: 15, color: "#f59e0b" },
      ]
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[GET /api/admin/finance/stats]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
