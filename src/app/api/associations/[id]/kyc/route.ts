import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const actor = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: session.user.id, associationId } },
    include: { customRole: true },
  });
  if (!actor || actor.status === "LEFT" || !hasPermission(session, actor, "MANAGE_MEMBERS")) {
    return NextResponse.json({ error: "Réservé au bureau de l'association" }, { status: 403 });
  }

  const memberships = await prisma.associationMembership.findMany({
    where: { associationId, status: { not: "LEFT" } },
    select: {
      id: true,
      role: true,
      status: true,
      user: {
        select: {
          id: true, name: true, email: true, phone: true, avatar: true,
          kycLevel: true, kycStatus: true, emailVerifiedAt: true, phoneVerifiedAt: true, whatsappVerifiedAt: true,
          kycRequests: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true, requestedLevel: true, createdAt: true, fullName: true,
              idType: true, idNumber: true, address: true, city: true, sourceOfFunds: true,
              documents: { select: { id: true, type: true, label: true, mimeType: true, size: true, status: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const reviewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { kycLevel: true } });

  return NextResponse.json({
    memberships,
    reviewerLevel: reviewer?.kycLevel ?? 0,
    pending: memberships.filter((m) => m.user.kycRequests.length > 0).length,
  });
}
