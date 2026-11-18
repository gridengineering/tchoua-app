import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { ADMIN_ACTIONS, parsePermissionKey, templatePermissionKeys } from "@/lib/rbac";

async function assertGroup(groupId: unknown) {
  if (groupId === undefined || groupId === null || groupId === "") return null;
  const group = await prisma.systemRoleGroup.findUnique({ where: { id: String(groupId) }, select: { id: true } });
  if (!group) throw new Error("Groupe de rôles introuvable");
  return group.id;
}

async function connectPermissions(keys: unknown) {
  if (!Array.isArray(keys)) return [];
  const unique = Array.from(new Set(keys.map(String))).filter((key) => Boolean(parsePermissionKey(key)));
  const ids: string[] = [];
  for (const key of unique) {
    const parsed = parsePermissionKey(key)!;
    if (!ADMIN_ACTIONS.includes(parsed.action as any)) continue;
    const permission = await prisma.systemPermission.upsert({
      where: { resource_action: { resource: parsed.resource, action: parsed.action } },
      update: {},
      create: { resource: parsed.resource, action: parsed.action },
    });
    ids.push(permission.id);
  }
  return ids;
}

// GET /api/admin/roles — rôles, groupes, règles et catalogue de permissions
export async function GET() {
  const guard = await requireSystemAdmin("ROLES", "READ");
  if (!guard.ok) return guard.response;
  try {
    const [roles, permissions, groups, recordRules] = await Promise.all([
      prisma.systemRole.findMany({
        include: {
          permissions: true,
          group: true,
          _count: { select: { users: true, recordRules: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.systemPermission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] }),
      prisma.systemRoleGroup.findMany({
        include: { _count: { select: { roles: true, recordRules: true } }, parent: { select: { id: true, name: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.systemRecordRule.findMany({
        include: { role: { select: { id: true, name: true } }, group: { select: { id: true, name: true, color: true } } },
        orderBy: [{ resource: "asc" }, { createdAt: "asc" }],
      }),
    ]);
    return NextResponse.json({ roles, permissions, groups, recordRules });
  } catch (error) {
    console.error("[GET /api/admin/roles]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/roles — créer un rôle avec groupe et permissions initiales
export async function POST(request: NextRequest) {
  const guard = await requireSystemAdmin("ROLES", "CREATE");
  if (!guard.ok) return guard.response;
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Le nom du rôle est requis" }, { status: 400 });
    const groupId = await assertGroup(body.groupId);
    const permissionKeys = Array.isArray(body.permissionKeys)
      ? body.permissionKeys.map(String)
      : templatePermissionKeys(String(body.template ?? "NONE"));
    const permissionIds = await connectPermissions(permissionKeys);
    const role = await prisma.systemRole.create({
      data: {
        name,
        description: String(body.description ?? "").trim() || null,
        groupId,
        ...(permissionIds.length ? { permissions: { connect: permissionIds.map((id) => ({ id })) } } : {}),
      },
      include: {
        permissions: true,
        group: true,
        _count: { select: { users: true, recordRules: true } },
      },
    });
    await prisma.auditLog.create({
      data: { userId: guard.user.id, action: "ROLE_CREATE", entity: "SYSTEM_ROLE", entityId: role.id, details: `Création du rôle système ${role.name}` },
    }).catch(() => {});
    return NextResponse.json({ role }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 409 });
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 400 });
  }
}
