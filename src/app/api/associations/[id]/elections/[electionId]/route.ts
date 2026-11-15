import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openElection, closeElection } from "@/lib/association/governance";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "TREASURER"];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; electionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, electionId } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const election = await prisma.election.findFirst({
    where: { id: electionId, associationId: id },
    include: {
      candidates: {
        include: { membership: { include: { user: { select: { name: true, email: true } } } }, votes: true },
      },
      votes: { include: { membership: { include: { user: { select: { name: true } } } } } },
      mandates: true,
    },
  });

  if (!election) return NextResponse.json({ error: "Élection introuvable" }, { status: 404 });

  return NextResponse.json({ election });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; electionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, electionId } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  if (!BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body;

  const election = await prisma.election.findFirst({
    where: { id: electionId, associationId: id },
  });
  if (!election) return NextResponse.json({ error: "Élection introuvable" }, { status: 404 });

  try {
    if (status === "OPEN") {
      if (election.status !== "DRAFT") {
        return NextResponse.json({ error: "Transition impossible" }, { status: 400 });
      }
      const updated = await openElection(electionId, prisma);
      return NextResponse.json({ election: updated });
    }

    if (status === "CLOSED") {
      if (election.status !== "OPEN") {
        return NextResponse.json({ error: "Transition impossible" }, { status: 400 });
      }
      const updated = await closeElection(electionId, prisma);
      return NextResponse.json({ election: updated });
    }

    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; electionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, electionId } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  if (!BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
  }

  const election = await prisma.election.findFirst({
    where: { id: electionId, associationId: id },
  });
  if (!election) return NextResponse.json({ error: "Élection introuvable" }, { status: 404 });
  if (election.status === "CLOSED") {
    return NextResponse.json({ error: "Impossible d'annuler une élection clôturée" }, { status: 400 });
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
