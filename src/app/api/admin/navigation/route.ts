import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const guard = await requireSystemAdmin();
  if (!guard.ok) return guard.response;
  const role = guard.user?.systemRoleId
    ? await prisma.systemRole.findUnique({
        where: { id: guard.user.systemRoleId },
        include: { permissions: true },
      })
    : null;
  const permissions = (role?.permissions ?? []).map((p) => `${p.resource}_${p.action}`);
  const isPrincipal =
    role?.name === "Admin Principal" ||
    role?.name === "Administrateur" ||
    (guard.user?.email ?? "").toLowerCase() === "admin@tchoua.com";
  return NextResponse.json({ roleName: role?.name ?? null, permissions, isPrincipal });
}
