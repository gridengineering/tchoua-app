import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireSystemAdmin("NOTIFICATIONS", "READ");
    if (!guard.ok) return guard.response;

    // On récupère les notifications système envoyées récemment par les admins
    const notifications = await prisma.notification.findMany({
      where: { type: "SYSTEM" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[GET /api/admin/notifications]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireSystemAdmin("NOTIFICATIONS", "CREATE");
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { title, message, target, link } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
    }

    let userIds: string[] = [];

    if (target === "ALL" || !target) {
      const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
      userIds = users.map((u) => u.id);
    } else if (String(target).startsWith("ROLE:")) {
      const roleId = String(target).slice(5);
      const users = await prisma.user.findMany({ where: { systemRoleId: roleId, isActive: true }, select: { id: true } });
      userIds = users.map((u) => u.id);
    } else if (String(target).startsWith("USER:")) {
      const userId = String(target).slice(5);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (user) userIds = [user.id];
    } else {
      const memberships = await prisma.associationMembership.findMany({
        where: { associationId: String(target), status: { not: "LEFT" } },
        select: { userId: true },
      });
      userIds = [...new Set(memberships.map((m) => m.userId))];
    }

    if (!userIds.length) {
      return NextResponse.json({ error: "Aucun destinataire pour cette cible" }, { status: 400 });
    }

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type: "SYSTEM",
        link: link ?? null,
      })),
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "NOTIFICATION_SENT",
        entity: "NOTIFICATIONS",
        details: `Envoi d'une notification système : "${title}" à la cible "${target}"`,
      }
    });

    return NextResponse.json({ success: true, recipients: userIds.length });
  } catch (error) {
    console.error("[POST /api/admin/notifications]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
