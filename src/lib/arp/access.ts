import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isSuperAdmin, type Permission } from "@/lib/permissions";

export type ArpActor =
  | {
      ok: true;
      session: Awaited<ReturnType<typeof getServerSession>>;
      membership: Awaited<ReturnType<typeof findMembership>>;
      userId: string;
    }
  | { ok: false; response: NextResponse };

async function findMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

export async function arpActor(
  associationId: string,
  permission?: Permission
): Promise<ArpActor> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  const membership = await findMembership(session.user.id, associationId);
  if (!membership && !isSuperAdmin(session)) {
    return { ok: false, response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  if (permission && !hasPermission(session, membership, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Permission ${permission} requise` },
        { status: 403 }
      ),
    };
  }
  return { ok: true, session, membership, userId: session.user.id };
}

export async function canPublishArp(associationId: string, session: unknown, membership: { role: string } | null) {
  return (
    isSuperAdmin(session as Parameters<typeof isSuperAdmin>[0]) ||
    membership?.role === "PRESIDENT" ||
    membership?.role === "FOUNDER"
  );
}
