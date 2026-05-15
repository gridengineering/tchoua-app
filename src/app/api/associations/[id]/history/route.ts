import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  // Verify membership
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId: id, status: { not: "LEFT" } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Accès refusé. Réservé aux membres." }, { status: 403 });
  }

  const history = await prisma.associationAuditLog.findMany({
    where: {
      associationId: id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return NextResponse.json({ history });
}
