import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireSystemAdmin("DASHBOARD", "READ");
    if (!guard.ok) return guard.response;

    const [
      systemUsersCount,
      activeAssociationsCount,
      totalMembersCount,
      recentLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { systemRoleId: { not: null } } }),
      prisma.association.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

    // Mock transactions for now
    const transactionsValue = "0 FCFA";

    return NextResponse.json({
      stats: [
        { label: "Utilisateurs Système", value: systemUsersCount.toString(), change: "+0", isUp: true },
        { label: "Associations Actives", value: activeAssociationsCount.toString(), change: "+0", isUp: true },
        { label: "Membres Totaux", value: totalMembersCount.toString(), change: "+0", isUp: true },
        { label: "Transactions (24h)", value: transactionsValue, change: "0%", isUp: true },
      ],
      recentLogs: recentLogs.map(log => ({
        id: log.id,
        user: log.user?.email || "Système",
        action: log.action,
        target: log.entity || "N/A",
        date: formatRelativeTime(log.createdAt),
        type: determineType(log.action)
      }))
    });
  } catch (error) {
    console.error("[GET /api/admin/dashboard/stats]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function formatRelativeTime(date: Date) {
  const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diff < 60) return `Il y a ${diff}s`;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString();
}

function determineType(action: string) {
  const a = action.toUpperCase();
  if (a.includes("CREATE") || a.includes("LOGIN")) return "success";
  if (a.includes("DELETE") || a.includes("BLOCK")) return "warning";
  return "info";
}
