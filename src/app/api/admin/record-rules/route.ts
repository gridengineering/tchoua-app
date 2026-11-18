import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { parseDomain } from "@/lib/record-rules";
import { normalizeOperations } from "@/lib/rbac";

function validateTarget(roleId: unknown, groupId: unknown) {
  if (roleId && groupId) throw new Error("Choisissez un rôle ou un groupe, pas les deux.");
  return {
    roleId: roleId ? String(roleId) : null,
    groupId: groupId ? String(groupId) : null,
  };
}

async function validateReferences(roleId: string | null, groupId: string | null) {
  if (roleId) {
    const role = await prisma.systemRole.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!role) throw new Error("Rôle cible introuvable");
  }
  if (groupId) {
    const group = await prisma.systemRoleGroup.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) throw new Error("Groupe cible introuvable");
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "READ");
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource");
  const rules = await prisma.systemRecordRule.findMany({
    where: resource ? { resource } : {},
    include: {
      role: { select: { id: true, name: true } },
      group: { select: { id: true, name: true, color: true } },
    },
    orderBy: [{ resource: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "CREATE");
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const resource = String(body.resource ?? "").trim().toUpperCase();
    if (!name || !resource) return NextResponse.json({ error: "Le nom et la ressource sont requis" }, { status: 400 });
    const target = validateTarget(body.roleId, body.groupId);
    await validateReferences(target.roleId, target.groupId);
    const domain = JSON.stringify(parseDomain(body.domain ?? "[]"));
    const operations = normalizeOperations(body.operations).join(",");
    const rule = await prisma.systemRecordRule.create({
      data: {
        name,
        description: body.description ? String(body.description).trim() : null,
        resource,
        domain,
        operations,
        active: body.active !== false,
        ...target,
      },
      include: {
        role: { select: { id: true, name: true } },
        group: { select: { id: true, name: true, color: true } },
      },
    });
    await prisma.auditLog.create({
      data: { userId: guard.user.id, action: "RECORD_RULE_CREATE", entity: "SYSTEM_RECORD_RULE", entityId: rule.id, details: `Création de la règle ${rule.name} (${resource})` },
    }).catch(() => {});
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "UPDATE");
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Règle requise" }, { status: 400 });
    const current = await prisma.systemRecordRule.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Règle introuvable" }, { status: 404 });
    const target = body.roleId !== undefined || body.groupId !== undefined
      ? validateTarget(body.roleId, body.groupId)
      : { roleId: current.roleId, groupId: current.groupId };
    await validateReferences(target.roleId, target.groupId);
    const rule = await prisma.systemRecordRule.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.description !== undefined ? { description: String(body.description).trim() || null } : {}),
        ...(body.resource !== undefined ? { resource: String(body.resource).trim().toUpperCase() } : {}),
        ...(body.domain !== undefined ? { domain: JSON.stringify(parseDomain(body.domain)) } : {}),
        ...(body.operations !== undefined ? { operations: normalizeOperations(body.operations).join(",") } : {}),
        ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
        ...target,
      },
      include: {
        role: { select: { id: true, name: true } },
        group: { select: { id: true, name: true, color: true } },
      },
    });
    await prisma.auditLog.create({
      data: { userId: guard.user.id, action: "RECORD_RULE_UPDATE", entity: "SYSTEM_RECORD_RULE", entityId: rule.id, details: `Mise à jour de la règle ${rule.name}` },
    }).catch(() => {});
    return NextResponse.json({ rule });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "DELETE");
  if (!guard.ok) return guard.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Règle requise" }, { status: 400 });
  const rule = await prisma.systemRecordRule.findUnique({ where: { id } });
  if (!rule) return NextResponse.json({ error: "Règle introuvable" }, { status: 404 });
  await prisma.systemRecordRule.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: guard.user.id, action: "RECORD_RULE_DELETE", entity: "SYSTEM_RECORD_RULE", entityId: id, details: `Suppression de la règle ${rule.name}` },
  }).catch(() => {});
  return NextResponse.json({ success: true });
}
