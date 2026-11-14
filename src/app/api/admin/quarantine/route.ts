import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { computeAssociationTrust, refreshTrustForUser } from "@/lib/trust";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const entity = String(body.entity ?? "").toLowerCase();
  const id = String(body.id ?? "");
  const action = String(body.action ?? "").toUpperCase();
  const reason = body.reason ? String(body.reason).slice(0, 1000) : null;

  if (!["association", "user"].includes(entity) || !id || !["QUARANTINE", "RELEASE"].includes(action)) {
    return NextResponse.json({ error: "entity, id et action (QUARANTINE|RELEASE) sont requis" }, { status: 400 });
  }

  const guard = await requireSystemAdmin(entity === "association" ? "ASSOCIATIONS" : "USERS", "UPDATE");
  if (!guard.ok) return guard.response;

  const now = new Date();
  const data = action === "QUARANTINE"
    ? { quarantinedAt: now, quarantineReason: reason, quarantinedById: guard.user.id }
    : { quarantinedAt: null, quarantineReason: null, quarantinedById: null };

  if (entity === "association") {
    const association = await prisma.association.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: action === "QUARANTINE" ? "ASSOCIATION_QUARANTINE" : "ASSOCIATION_RELEASE",
        entity: "ASSOCIATIONS",
        entityId: id,
        details: `${action === "QUARANTINE" ? "Mise en quarantaine" : "Levée de quarantaine"} de ${association.name}${reason ? ` — ${reason}` : ""}`,
      },
    });
    await computeAssociationTrust(id).catch(() => {});
    return NextResponse.json({ association });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, quarantinedAt: true, quarantineReason: true },
  });
  await prisma.auditLog.create({
    data: {
      userId: guard.user.id,
      action: action === "QUARANTINE" ? "USER_QUARANTINE" : "USER_RELEASE",
      entity: "USER",
      entityId: id,
      details: `${action === "QUARANTINE" ? "Mise en quarantaine" : "Levée de quarantaine"} de ${user.email}${reason ? ` — ${reason}` : ""}`,
    },
  });
  await refreshTrustForUser(id).catch(() => {});
  return NextResponse.json({ user });
}
