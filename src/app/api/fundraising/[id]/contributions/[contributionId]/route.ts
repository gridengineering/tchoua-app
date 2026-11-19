import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManage, getFundraisingActor } from "@/lib/fundraising";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; contributionId: string }> }) {
  const { id, contributionId } = await params;
  const project = await prisma.fundraisingProject.findUnique({ where: { id }, select: { associationId: true } });
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  const actor = await getFundraisingActor(req, project.associationId);
  if (!actor || !canManage(actor) || (actor.associationId !== project.associationId && !actor.isPlatformAdmin)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const contribution = await prisma.fundraisingContribution.findUnique({ where: { id: contributionId } });
  if (!contribution || contribution.projectId !== id) return NextResponse.json({ error: "Contribution introuvable." }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }
  if (!["RECEIVED", "CANCELLED"].includes(body.status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const updated = await prisma.fundraisingContribution.update({
    where: { id: contributionId },
    data: { status: body.status, confirmedAt: body.status === "RECEIVED" ? new Date() : null },
  });
  return NextResponse.json({ contribution: updated });
}
