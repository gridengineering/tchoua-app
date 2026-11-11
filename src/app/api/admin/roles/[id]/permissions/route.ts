import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

// PUT /api/admin/roles/[id]/permissions — mettre à jour les permissions d'un rôle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSystemAdmin("ROLES", "UPDATE");
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { permissions } = body as { permissions: string[] }; // ["USERS_READ", "TRANSACTIONS_CREATE", ...]

    // Empêcher modification des permissions Admin Principal
    const role = await prisma.systemRole.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
    if (role.name === "Admin Principal") {
      return NextResponse.json({ error: "Les permissions du rôle Admin Principal ne peuvent pas être modifiées" }, { status: 403 });
    }

    // Convertir les clés "RESOURCE_ACTION" en objets
    const parsed = permissions
      .map(p => {
        const parts = p.split("_");
        if (parts.length < 2) return null;
        const action = parts[parts.length - 1];
        const resource = parts.slice(0, -1).join("_");
        return { resource, action };
      })
      .filter(Boolean) as { resource: string; action: string }[];

    // Trouver ou créer les permissions correspondantes
    const permissionIds: string[] = [];
    for (const { resource, action } of parsed) {
      const perm = await prisma.systemPermission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });
      permissionIds.push(perm.id);
    }

    // Mettre à jour le rôle
    const updated = await prisma.systemRole.update({
      where: { id },
      data: {
        permissions: {
          set: permissionIds.map(pid => ({ id: pid })),
        },
      },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    return NextResponse.json({ role: updated });
  } catch (error) {
    console.error("[PUT /api/admin/roles/[id]/permissions]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
