import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUPER_ADMIN_EMAIL } from "@/lib/permissions";

type AdminGuard =
  | { ok: true; session: any; user: any; roleName: string | null }
  | { ok: false; response: NextResponse };

/**
 * Garde commune de la console d'administration.
 * - session obligatoire ;
 * - rôle système obligatoire ;
 * - si un rôle possède des permissions configurées, la permission
 *   resource/action demandée doit y figurer (l'Admin Principal bypasse).
 */
export async function requireSystemAdmin(
  resource?: string,
  action?: "CREATE" | "READ" | "UPDATE" | "DELETE"
): Promise<AdminGuard> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  if (!user?.systemRoleId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès réservé aux utilisateurs système" }, { status: 403 }),
    };
  }

  const role = await prisma.systemRole.findUnique({
    where: { id: user.systemRoleId },
    include: { permissions: true },
  });

  const isPrincipal =
    (user.email ?? "").toLowerCase() === SUPER_ADMIN_EMAIL ||
    role?.name === "Admin Principal" ||
    role?.name === "Administrateur";

  if (!isPrincipal && resource && action) {
    const perms = role?.permissions ?? [];
    if (perms.length > 0 && !perms.some((p) => p.resource === resource && p.action === action)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: `Permission ${resource}_${action} requise` },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, session, user, roleName: role?.name ?? null };
}
