import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createElection } from "@/lib/association/governance";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "TREASURER"];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const elections = await prisma.election.findMany({
    where: { associationId: id, ...(status ? { status } : {}) },
    include: {
      candidates: { include: { membership: { include: { user: { select: { name: true, email: true } } } } } },
      _count: { select: { votes: true } },
      mandates: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ elections });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  if (!BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
  }

  const body = await req.json();
  const { title, type, startDate, endDate, quorumRequired } = body;

  if (!title || !type) {
    return NextResponse.json({ error: "title et type sont requis" }, { status: 400 });
  }

  try {
    const election = await createElection(
      {
        associationId: id,
        title,
        type,
        startDate,
        endDate,
        quorumRequired,
        createdById: session.user.id,
      },
      prisma
    );
    return NextResponse.json({ election }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
