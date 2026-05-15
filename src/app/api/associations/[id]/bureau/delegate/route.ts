import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership || !["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"].includes(membership.role)) {
    return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { targetMembershipId, targetRole } = body;

  if (!targetMembershipId || !targetRole) {
    return NextResponse.json({ error: "Cible et rôle requis" }, { status: 400 });
  }

  // Verify that the target membership belongs to this association
  const targetMembership = await prisma.associationMembership.findFirst({
    where: { id: targetMembershipId, associationId: id }
  });

  if (!targetMembership) {
    return NextResponse.json({ error: "Membre introuvable dans cette association" }, { status: 404 });
  }

  try {
    const updated = await prisma.associationMembership.update({
      where: { id: targetMembershipId },
      data: { role: targetRole }
    });

    return NextResponse.json({ membership: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur" }, { status: 400 });
  }
}
