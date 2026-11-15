import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, ALL_PERMISSIONS, isPlatformAdmin } from "@/lib/permissions";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  }

  const roles = await prisma.associationCustomRole.findMany({
    where: { associationId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);

  if (!hasPermission(session, membership, "MANAGE_ROLES")) {
    return NextResponse.json({ error: "Permission MANAGE_ROLES requise" }, { status: 403 });
  }

  const body = await req.json();
  const { name, color = "#0d3d28", permissions = [] } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const cleanPerms = (Array.isArray(permissions) ? permissions : [])
    .filter((p) => typeof p === "string" && (ALL_PERMISSIONS as string[]).includes(p));

  try {
    const role = await prisma.associationCustomRole.create({
      data: {
        associationId: id,
        name: name.trim(),
        color,
        permissions: JSON.stringify(cleanPerms),
      },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
