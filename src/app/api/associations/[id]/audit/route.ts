import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  // Verify membership and role
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId: id, status: { not: "LEFT" } },
  });

  const isBureau = membership && ["PRESIDENT", "FOUNDER", "SECRETARY", "TREASURER"].includes(membership.role);

  if (!isBureau && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Accès refusé. Réservé au bureau." }, { status: 403 });
  }

  const auditLog = await prisma.associationAuditLog.findMany({
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

  return NextResponse.json({ auditLog });
}
