import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/audit — Récupère les logs d'audit
export async function GET(request: Request) {
  const guard = await requireSystemAdmin("AUDIT", "READ");
  if (!guard.ok) return guard.response;
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const resource = searchParams.get("resource");
    const limit = parseInt(searchParams.get("limit") || "100");

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(severity ? { action: { contains: severity } } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
    });

    const formatted = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name,
      userEmail: log.user?.email,
      action: log.action,
      resource: log.entity || "SYSTEM",
      resourceId: log.entityId,
      details: log.details || log.changes,
      severity: determineSeverity(log.action),
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error) {
    console.error("[GET /api/admin/audit]", error);
    // Retourner des données vides plutôt qu'une erreur
    return NextResponse.json({ logs: [] });
  }
}

function determineSeverity(action: string): "INFO" | "WARNING" | "CRITICAL" | "SUCCESS" {
  const actionUpper = action.toUpperCase();
  if (actionUpper.includes("FAILED") || actionUpper.includes("CRITICAL") || actionUpper.includes("BREACH")) return "CRITICAL";
  if (actionUpper.includes("DELETE") || actionUpper.includes("SUSPEND") || actionUpper.includes("BLOCK")) return "WARNING";
  if (actionUpper.includes("LOGIN") || actionUpper.includes("CREATE") || actionUpper.includes("APPROVE")) return "SUCCESS";
  return "INFO";
}
