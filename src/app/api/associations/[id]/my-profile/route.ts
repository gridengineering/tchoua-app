import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;

  try {
    const membership = await prisma.associationMembership.findFirst({
      where: { userId: session.user.id, associationId },
      include: {
        user: true,
        activitySubs: {
          include: { activity: true }
        },
        sanctions: {
          where: { status: "PENDING" }
        }
      }
    });

    if (!membership) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

    return NextResponse.json({ membership });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;

  try {
    const body = await req.json();
    const { subscriptions, loanRepaymentMode } = body; // Array of { id, allocationType, allocationValue }

    const membership = await prisma.associationMembership.findFirst({
      where: { userId: session.user.id, associationId }
    });

    if (!membership) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    if (loanRepaymentMode && !["PRIORITY", "RESIDUAL"].includes(loanRepaymentMode)) {
      return NextResponse.json({ error: "Mode de remboursement invalide" }, { status: 400 });
    }

    const updates: any[] = [];
    if (subscriptions && Array.isArray(subscriptions)) {
      updates.push(...subscriptions.map((sub: any) =>
        prisma.activitySubscription.updateMany({
          where: { id: sub.id, membershipId: membership.id },
          data: {
            allocationType: sub.allocationType,
            allocationValue: sub.allocationValue !== undefined ? Number(sub.allocationValue) : null
          }
        })
      ));
    }
    if (loanRepaymentMode) {
      updates.push(prisma.associationMembership.update({
        where: { id: membership.id },
        data: { loanRepaymentMode }
      }));
    }
    if (updates.length > 0) await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
