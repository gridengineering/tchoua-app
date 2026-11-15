import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";

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
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity") ?? undefined;
  const action = searchParams.get("action") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const association = await prisma.association.findUnique({
    where: { id },
    select: { id: true, isPublic: true },
  });

  if (!association) {
    return NextResponse.json(
      { error: "Association introuvable" },
      { status: 404 }
    );
  }

  const membership = await getMembership(session.user.id, id);
  const isAdmin = isPlatformAdmin(session);

  if (!association.isPublic && !membership && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const canViewLogs =
    isAdmin ||
    (membership &&
      [
        "PRESIDENT",
        "FOUNDER",
        "SECRETARY",
        "TREASURER",
        "AUDITOR",
      ].includes(membership.role));

  if (!canViewLogs) {
    return NextResponse.json(
      { error: "Permission insuffisante pour consulter les logs" },
      { status: 403 }
    );
  }

  const where: any = { associationId: id };
  if (entity) where.entity = entity;
  if (action) where.action = action;

  const [logs, total] = await prisma.$transaction([
    prisma.associationAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.associationAuditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, limit, offset });
}
