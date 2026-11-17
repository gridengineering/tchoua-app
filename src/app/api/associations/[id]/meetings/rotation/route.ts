import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentRotation, isMeetingBureau, publicRotation } from "@/lib/association/meetings";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId } = await params;
  const me = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: { not: "LEFT" } },
    select: { id: true, role: true },
  });
  if (!me) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  const rotation = await currentRotation(associationId);
  const members = await prisma.associationMembership.findMany({
    where: { associationId, status: { not: "LEFT" } },
    select: { id: true, memberNumber: true, role: true, user: { select: { name: true, email: true } } },
    orderBy: [{ joinedAt: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ cycle: rotation.cycle, rotation: publicRotation(rotation.list), next: rotation.next ? { membershipId: rotation.next.membershipId, position: rotation.next.position, address: rotation.next.address } : null, members, canEdit: isMeetingBureau(me.role) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId } = await params;
  const me = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: "ACTIVE" },
    select: { id: true, role: true },
  });
  if (!me || !isMeetingBureau(me.role)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "Ajoutez au moins un membre à la rotation." }, { status: 400 });
  const valid = await prisma.associationMembership.findMany({ where: { associationId, status: { not: "LEFT" } }, select: { id: true } });
  const validIds = new Set(valid.map((x) => x.id));
  if (items.some((x: any) => !validIds.has(String(x.membershipId)))) return NextResponse.json({ error: "Membre étranger à l'association" }, { status: 400 });
  const current = await currentRotation(associationId);
  const mode = body.mode === "append" ? "append" : "replace";
  const cycle = Number(body.cycle ?? current.cycle) || 1;
  const saved = await prisma.$transaction(async (tx) => {
    let start = 1;
    if (mode === "append") {
      const last = await tx.hostingRotation.findFirst({ where: { associationId, cycle }, orderBy: { position: "desc" }, select: { position: true } });
      start = (last?.position ?? 0) + 1;
    } else {
      await tx.hostingRotation.deleteMany({ where: { associationId, cycle } });
    }
    await tx.hostingRotation.createMany({
      data: items.map((x: any, index: number) => ({
        associationId,
        membershipId: String(x.membershipId),
        position: Number(x.position ?? start + index),
        cycle,
        address: x.address ? String(x.address).slice(0, 500) : null,
        notes: x.notes ? String(x.notes).slice(0, 1000) : null,
        status: "PENDING",
      })),
    });
    return tx.hostingRotation.findMany({ where: { associationId, cycle }, orderBy: { position: "asc" }, include: { membership: { include: { user: { select: { name: true } } } } } });
  });
  return NextResponse.json({ cycle, rotation: publicRotation(saved) }, { status: 201 });
}
