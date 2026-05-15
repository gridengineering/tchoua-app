import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) {
    return NextResponse.json({ error: "Réservé aux membres de l'association" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { parameterPath, newValue, justification } = body;

  if (!parameterPath || newValue === undefined) {
    return NextResponse.json({ error: "Paramètre et nouvelle valeur requis" }, { status: 400 });
  }

  // Enregistrer une demande d'approbation (workflow)
  try {
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: { associationId: id, entityType: "SETTINGS_CHANGE" }
    });

    if (!workflow) {
      // Pour simuler si le workflow n'existe pas
      return NextResponse.json({
        message: "Vote initié mais aucun workflow configuré, modification directe possible",
        status: "PENDING_WORKFLOW"
      });
    }

    const request = await prisma.approvalRequest.create({
      data: {
        workflowId: workflow.id,
        entityType: "SETTINGS",
        entityId: parameterPath,
        requestedById: session.user.id,
        reason: justification || `Modification de ${parameterPath}`,
        status: "PENDING"
      }
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur" }, { status: 400 });
  }
}
