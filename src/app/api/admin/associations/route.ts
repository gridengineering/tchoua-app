import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireSystemAdmin("ASSOCIATIONS", "READ");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const associations = await prisma.association.findMany({
      where,
      include: {
        creator: {
          select: { name: true, email: true }
        },
        _count: {
          select: { memberships: true, activities: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ associations });
  } catch (error) {
    console.error("[GET /api/admin/associations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireSystemAdmin("ASSOCIATIONS", "UPDATE");
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { id, status, reason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID et statut requis" }, { status: 400 });
    }

    const allowed = ["ACTIVE", "SUSPENDED", "DISSOLVED", "PENDING", "DRAFT"];
    if (!allowed.includes(String(status))) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    if (status === "DISSOLVED" && !reason) {
      return NextResponse.json({ error: "Motif de dissolution requis" }, { status: 400 });
    }

    const association = await prisma.association.update({
      where: { id },
      data: {
        status,
        ...(status === "DISSOLVED"
          ? { dissolvedAt: new Date(), dissolutionReason: reason }
          : status === "ACTIVE"
          ? { activatedAt: new Date() }
          : {}),
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "ASSOC_STATUS_UPDATE",
        entity: "ASSOCIATIONS",
        entityId: id,
        details: `Changement de statut de l'association "${association.name}" vers ${status}${reason ? ` — motif : ${reason}` : ""}`,
      }
    });

    return NextResponse.json({ association });
  } catch (error) {
    console.error("[PATCH /api/admin/associations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
