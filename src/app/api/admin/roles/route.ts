import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

// GET /api/admin/roles — liste des rôles avec permissions et comptage utilisateurs
export async function GET() {
  const guard = await requireSystemAdmin("ROLES", "READ");
  if (!guard.ok) return guard.response;
  try {
    const [roles, permissions] = await Promise.all([
      prisma.systemRole.findMany({
        include: {
          permissions: true,
          _count: { select: { users: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.systemPermission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] }),
    ]);
    return NextResponse.json({ roles, permissions });
  } catch (error) {
    console.error("[GET /api/admin/roles]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/roles — créer un nouveau rôle
export async function POST(request: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "CREATE");
  if (!guard.ok) return guard.response;
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Le nom du rôle est requis" }, { status: 400 });
    }

    const role = await prisma.systemRole.create({
      data: { name: name.trim(), description: description?.trim() || null },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "ROLE_CREATE",
        entity: "SYSTEM_ROLE",
        entityId: role.id,
        details: `Création du rôle système ${role.name}`,
      },
    }).catch(() => {});

    return NextResponse.json({ role }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
