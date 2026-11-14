import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const whereClause: any = { associationId };
    if (status) {
      whereClause.status = status;
    }

    const actor = await prisma.associationMembership.findUnique({
      where: { userId_associationId: { userId: session.user.id, associationId } },
      include: { customRole: true },
    });
    const canReviewKyc = Boolean(actor && hasPermission(session, actor, "MANAGE_MEMBERS"));

    const members = await prisma.associationMembership.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profession: true,
            avatar: true,
            kycLevel: true,
            kycStatus: true,
            ...(canReviewKyc
              ? {
                  kycRequests: {
                    where: { status: "PENDING" },
                    orderBy: { createdAt: "desc" as const },
                    take: 1,
                    select: { id: true, requestedLevel: true, createdAt: true },
                  },
                }
              : {}),
          },
        },
        customRole: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
