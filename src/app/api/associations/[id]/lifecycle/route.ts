import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { transitionAssociation } from "@/lib/association/lifecycle";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { toStatus, reason } = body;

  if (!toStatus || typeof toStatus !== "string") {
    return NextResponse.json({ error: "toStatus requis" }, { status: 400 });
  }

  const association = await prisma.association.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!association) {
    return NextResponse.json(
      { error: "Association introuvable" },
      { status: 404 }
    );
  }

  const membership = await getMembership(session.user.id, id);
  const isAdmin = isPlatformAdmin(session);
  const isPresident =
    membership && ["PRESIDENT", "FOUNDER"].includes(membership.role);

  if (!isAdmin && !isPresident) {
    return NextResponse.json(
      { error: "Président, fondateur ou admin requis" },
      { status: 403 }
    );
  }

  try {
    const result = await transitionAssociation(
      id,
      association.status,
      toStatus,
      session.user.id,
      reason,
      prisma
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur de transition" },
      { status: 400 }
    );
  }
}
