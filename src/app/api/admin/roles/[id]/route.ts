import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

// PATCH /api/admin/roles/[id] — renommer / décrire un rôle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSystemAdmin("ROLES", "UPDATE");
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;

    const role = await prisma.systemRole.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
    if (role.name === "Admin Principal" && name && name !== role.name) {
      return NextResponse.json({ error: "Le rôle Admin Principal ne peut pas être renommé" }, { status: 403 });
    }
    if (!name && description === undefined) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    const updated = await prisma.systemRole.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
      },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "ROLE_UPDATE",
        entity: "SYSTEM_ROLE",
        entityId: id,
        details: `Mise à jour du rôle ${updated.name}`,
      },
    }).catch(() => {});

    return NextResponse.json({ role: updated });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/roles/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSystemAdmin("ROLES", "DELETE");
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    // Empêcher la suppression du rôle Admin Principal
    const role = await prisma.systemRole.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
    if (role.name === "Admin Principal") {
      return NextResponse.json({ error: "Le rôle Admin Principal ne peut pas être supprimé" }, { status: 403 });
    }

    // Dissocier les utilisateurs avant suppression
    await prisma.user.updateMany({
      where: { systemRoleId: id },
      data: { systemRoleId: null },
    });

    await prisma.systemRole.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "ROLE_DELETE",
        entity: "SYSTEM_ROLE",
        entityId: id,
        details: `Suppression du rôle ${role.name}`,
      },
    }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/roles/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
