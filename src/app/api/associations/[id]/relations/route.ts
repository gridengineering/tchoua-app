import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";
import {
  validateSingleParent,
  validateMaxChildAssociations,
} from "@/lib/association/rules";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

async function isPresidentOrFounder(userId: string, associationId: string) {
  const membership = await getMembership(userId, associationId);
  return membership && ["PRESIDENT", "FOUNDER"].includes(membership.role);
}

async function getAncestors(associationId: string): Promise<Set<string>> {
  const ancestors = new Set<string>();
  const queue = [associationId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    const assoc = await prisma.association.findUnique({
      where: { id: current },
      select: { parentId: true },
    });

    if (assoc?.parentId && !ancestors.has(assoc.parentId)) {
      ancestors.add(assoc.parentId);
      queue.push(assoc.parentId);
    }

    const mothers = await prisma.associationRelation.findMany({
      where: { targetId: current, type: "MOTHER" },
      select: { sourceId: true },
    });
    for (const m of mothers) {
      if (!ancestors.has(m.sourceId)) {
        ancestors.add(m.sourceId);
        queue.push(m.sourceId);
      }
    }

    const childrenRelations = await prisma.associationRelation.findMany({
      where: { sourceId: current, type: "CHILD" },
      select: { targetId: true },
    });
    for (const c of childrenRelations) {
      if (!ancestors.has(c.targetId)) {
        ancestors.add(c.targetId);
        queue.push(c.targetId);
      }
    }
  }

  return ancestors;
}

async function wouldCreateCycle(sourceId: string, targetId: string): Promise<boolean> {
  if (sourceId === targetId) return true;
  const ancestors = await getAncestors(targetId);
  return ancestors.has(sourceId);
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

  const association = await prisma.association.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!association) {
    return NextResponse.json(
      { error: "Association introuvable" },
      { status: 404 }
    );
  }

  const membership = await getMembership(session.user.id, id);
  if (!membership && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const [sourceRelations, targetRelations] = await prisma.$transaction([
    prisma.associationRelation.findMany({
      where: { sourceId: id },
      include: {
        target: {
          select: { id: true, name: true, type: true, status: true },
        },
      },
    }),
    prisma.associationRelation.findMany({
      where: { targetId: id },
      include: {
        source: {
          select: { id: true, name: true, type: true, status: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    sourceRelations,
    targetRelations,
    relations: [...sourceRelations, ...targetRelations],
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: sourceId } = await params;
  const body = await req.json().catch(() => ({}));
  const { targetId, type, notes } = body;

  if (!targetId || !type) {
    return NextResponse.json(
      { error: "targetId et type requis" },
      { status: 400 }
    );
  }

  if (!["MOTHER", "CHILD", "SISTER"].includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const [sourceAssoc, targetAssoc] = await prisma.$transaction([
    prisma.association.findUnique({ where: { id: sourceId } }),
    prisma.association.findUnique({ where: { id: targetId } }),
  ]);

  if (!sourceAssoc || !targetAssoc) {
    return NextResponse.json(
      { error: "Association source ou cible introuvable" },
      { status: 404 }
    );
  }

  const isAdmin = isSuperAdmin(session);
  const canSource = isAdmin || (await isPresidentOrFounder(session.user.id, sourceId));
  const canTarget = isAdmin || (await isPresidentOrFounder(session.user.id, targetId));

  if (!canSource || !canTarget) {
    return NextResponse.json(
      { error: "Vous devez être président/fondateur des deux associations" },
      { status: 403 }
    );
  }

  if (await wouldCreateCycle(sourceId, targetId)) {
    return NextResponse.json(
      { error: "Cette relation créerait un cycle hiérarchique" },
      { status: 400 }
    );
  }

  // R-004 & R-005 : Validation hiérarchique Mère-Fille (max 1 mère par fille, max 20 filles par mère)
  if (type === "MOTHER" || type === "CHILD") {
    const parentId = type === "MOTHER" ? sourceId : targetId;
    const childId = type === "MOTHER" ? targetId : sourceId;

    const singleParentCheck = await validateSingleParent(childId, prisma);
    if (!singleParentCheck.valid) {
      return NextResponse.json(
        { error: singleParentCheck.error, code: singleParentCheck.code },
        { status: 409 }
      );
    }

    const maxChildrenCheck = await validateMaxChildAssociations(parentId, prisma);
    if (!maxChildrenCheck.valid) {
      return NextResponse.json(
        { error: maxChildrenCheck.error, code: maxChildrenCheck.code },
        { status: 400 }
      );
    }
  }

  try {
    const relation = await prisma.associationRelation.create({
      data: {
        sourceId,
        targetId,
        type,
        notes: notes ?? null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ relation }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Cette relation existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }
}

// ─── §13.1 & §15 : Rupture de relation / Indépendance sans suppression en cascade ─
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const relationId = searchParams.get("relationId") ?? body.relationId;

  if (!relationId) {
    return NextResponse.json({ error: "relationId requis" }, { status: 400 });
  }

  const relation = await prisma.associationRelation.findUnique({
    where: { id: relationId },
  });

  if (!relation || (relation.sourceId !== id && relation.targetId !== id)) {
    return NextResponse.json({ error: "Relation introuvable" }, { status: 404 });
  }

  const isAdmin = isSuperAdmin(session);
  const canManage =
    isAdmin ||
    (await isPresidentOrFounder(session.user.id, relation.sourceId)) ||
    (await isPresidentOrFounder(session.user.id, relation.targetId));

  if (!canManage) {
    return NextResponse.json(
      { error: "Seuls le président ou le fondateur peuvent dissoudre cette relation" },
      { status: 403 }
    );
  }

  const updated = await prisma.associationRelation.update({
    where: { id: relationId },
    data: {
      status: "DISSOLVED",
      endDate: new Date(),
    },
  });

  // Si un lien parentId direct existait sur l'association fille, le détacher sans supprimer l'association
  if (relation.type === "MOTHER" || relation.type === "CHILD") {
    const childId = relation.type === "MOTHER" ? relation.targetId : relation.sourceId;
    await prisma.association
      .update({
        where: { id: childId },
        data: { parentId: null },
      })
      .catch(() => {});
  }

  return NextResponse.json({ relation: updated });
}
