import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const tontine = await prisma.tontine.findUnique({
    where: { id },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, avatar: true, score: true, level: true, kycLevel: true, kycStatus: true } } },
      },
      sessions: { orderBy: { sessionNumber: "asc" } },
      contributions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
      loans: {
        where: { status: { in: ["PENDING", "APPROVED", "DISBURSED", "REPAYING"] } },
        include: { borrower: { select: { name: true } } },
      },
      _count: { select: { memberships: { where: { status: "ACTIVE" } }, sessions: true } },
    },
  });

  if (!tontine) return NextResponse.json({ error: "Tontine introuvable" }, { status: 404 });

  const membership = tontine.memberships.find((m) => m.userId === session.user.id);
  if (!membership && !tontine.isPublic) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({ tontine, myRole: membership?.role });
}
