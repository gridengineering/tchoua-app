import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  const isAdmin = isSuperAdmin(session);
  const isPresident = membership && ["PRESIDENT", "FOUNDER", "TREASURER"].includes(membership.role);

  if (!isAdmin && !isPresident) {
    return NextResponse.json(
      { error: "Président, fondateur ou trésorier requis" },
      { status: 403 }
    );
  }

  try {
    const association = await prisma.association.findUnique({
      where: { id },
      include: {
        children: {
          select: { id: true, name: true, type: true, status: true }
        }
      }
    });

    if (!association) {
      return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
    }

    const childrenIds = association.children.map(c => c.id);

    // Si c'est une relation MOTHER->CHILD
    const relations = await prisma.associationRelation.findMany({
      where: { sourceId: id, type: "CHILD" },
      select: { targetId: true }
    });

    const relatedIds = [...new Set([...childrenIds, ...relations.map(r => r.targetId)])];

    // Simulate generation of consolidated report data
    const reportData = {
      mother: { id: association.id, name: association.name },
      childrenCount: relatedIds.length,
      children: relatedIds,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ consolidatedReport: reportData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur de génération du rapport" },
      { status: 400 }
    );
  }
}
