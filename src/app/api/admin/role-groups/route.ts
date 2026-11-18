import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

function validColor(value: unknown) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#6366f1";
}

async function hasCycle(groupId: string, parentId: string | null): Promise<boolean> {
  let cursor: string | null = parentId;
  while (cursor) {
    if (cursor === groupId) return true;
    const parent: { parentId: string | null } | null = await prisma.systemRoleGroup.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = parent?.parentId ?? null;
  }
  return false;
}

async function validParent(parentId: unknown): Promise<string | null> {
  if (parentId === undefined || parentId === null || parentId === "") return null;
  const id = String(parentId);
  const parent = await prisma.systemRoleGroup.findUnique({ where: { id }, select: { id: true } });
  if (!parent) throw new Error("Groupe parent introuvable");
  return id;
}

export async function GET() {
  const guard = await requireSystemAdmin("ROLES", "READ");
  if (!guard.ok) return guard.response;
  const groups = await prisma.systemRoleGroup.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { roles: true, recordRules: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "CREATE");
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Le nom du groupe est requis" }, { status: 400 });
    const parentId = await validParent(body.parentId);
    const group = await prisma.systemRoleGroup.create({
      data: {
        name,
        description: body.description ? String(body.description).trim() : null,
        color: validColor(body.color),
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
        parentId,
      },
      include: { parent: true, _count: { select: { roles: true, recordRules: true } } },
    });
    await prisma.auditLog.create({
      data: { userId: guard.user.id, action: "ROLE_GROUP_CREATE", entity: "SYSTEM_ROLE_GROUP", entityId: group.id, details: `Création du groupe ${group.name}` },
    }).catch(() => {});
    return NextResponse.json({ group }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Un groupe porte déjà ce nom" }, { status: 409 });
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "UPDATE");
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Groupe requis" }, { status: 400 });
    const current = await prisma.systemRoleGroup.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });

    const parentId = body.parentId !== undefined ? await validParent(body.parentId) : current.parentId;
    if (parentId && await hasCycle(id, parentId)) {
      return NextResponse.json({ error: "Un groupe ne peut pas être son propre parent" }, { status: 400 });
    }
    const name = body.name !== undefined ? String(body.name).trim() : current.name;
    if (!name) return NextResponse.json({ error: "Le nom du groupe est requis" }, { status: 400 });
    const group = await prisma.systemRoleGroup.update({
      where: { id },
      data: {
        name,
        description: body.description !== undefined ? (String(body.description).trim() || null) : current.description,
        color: body.color !== undefined ? validColor(body.color) : current.color,
        sortOrder: body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : current.sortOrder,
        parentId,
      },
      include: { parent: true, _count: { select: { roles: true, recordRules: true } } },
    });
    await prisma.auditLog.create({
      data: { userId: guard.user.id, action: "ROLE_GROUP_UPDATE", entity: "SYSTEM_ROLE_GROUP", entityId: group.id, details: `Mise à jour du groupe ${group.name}` },
    }).catch(() => {});
    return NextResponse.json({ group });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Un groupe porte déjà ce nom" }, { status: 409 });
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "DELETE");
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Groupe requis" }, { status: 400 });
  const group = await prisma.systemRoleGroup.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
  await prisma.systemRoleGroup.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: guard.user.id, action: "ROLE_GROUP_DELETE", entity: "SYSTEM_ROLE_GROUP", entityId: id, details: `Suppression du groupe ${group.name}` },
  }).catch(() => {});
  return NextResponse.json({ success: true });
}
