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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  const canElect = isSuperAdmin(session) || (membership && ["PRESIDENT", "FOUNDER", "SECRETARY"].includes(membership.role));

  if (!canElect) {
    return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, startDate, endDate, type } = body;

  try {
    const election = await prisma.election.create({
      data: {
        associationId: id,
        title: title || "Élection du bureau",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
        status: "PLANNED",
        type: type || "BUREAU",
        createdById: session.user.id,
      }
    });

    return NextResponse.json({ election }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur" }, { status: 400 });
  }
}
