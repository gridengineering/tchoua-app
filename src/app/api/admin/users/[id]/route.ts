import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import bcrypt from "bcryptjs";

// PATCH /api/admin/users/[id] — Mettre à jour un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireSystemAdmin("USERS", "UPDATE");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const { systemRoleId, isActive, name, phone, password } = body;

    if (id === guard.user.id && isActive === false) {
      return NextResponse.json({ error: "Vous ne pouvez pas désactiver votre propre compte" }, { status: 400 });
    }

    let hashedPassword: string | undefined;
    if (password) {
      const settings = await getPlatformSettings();
      if (String(password).length < settings.security.passwordMinLength) {
        return NextResponse.json(
          { error: `Le mot de passe doit contenir au moins ${settings.security.passwordMinLength} caractères` },
          { status: 400 }
        );
      }
      hashedPassword = await bcrypt.hash(String(password), 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(systemRoleId !== undefined && { systemRoleId: systemRoleId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "USER_UPDATE",
        entity: "USER",
        entityId: id,
        details: `Mise à jour de l'utilisateur ${user.email}. Actif: ${isActive}, Rôle: ${systemRoleId ?? "inchangé"}${hashedPassword ? ", mot de passe réinitialisé" : ""}`,
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Supprimer l'accès système (ou l'utilisateur)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireSystemAdmin("USERS", "DELETE");
    if (!guard.ok) return guard.response;

    const { id } = await params;

    if (id === guard.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas révoquer votre propre accès" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if ((target?.email ?? "").toLowerCase() === "admin@tchoua.com") {
      return NextResponse.json({ error: "Le compte administrateur principal est protégé" }, { status: 400 });
    }

    // On ne supprime pas forcément l'utilisateur de la base, mais on lui retire son rôle système
    const user = await prisma.user.update({
      where: { id },
      data: { systemRoleId: null, isActive: false },
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "USER_REVOKE",
        entity: "USER",
        entityId: id,
        details: `Révocation de l'accès système pour ${user.email}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
