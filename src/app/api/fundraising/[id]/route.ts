import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canManage,
  cleanText,
  dateOrNull,
  getFundraisingActor,
  getFundraisingViewer,
  isContributionMode,
  isContributorMode,
  isFundraisingScope,
  isFundraisingType,
  safeAmount,
  serializeProject,
} from "@/lib/fundraising";
import { notifyFundraisingProject } from "@/lib/fundraising/notifications";

async function loadProject(id: string) {
  return prisma.fundraisingProject.findUnique({
    where: { id },
    include: {
      contributions: { orderBy: { createdAt: "desc" } },
      _count: { select: { contributions: true } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

  const actor = await getFundraisingViewer(req);
  const isPublic = project.scope === "PUBLIC" && ["PUBLISHED", "CLOSED"].includes(project.status);
  const isSameAssociation = Boolean(actor && actor.associationId === project.associationId);
  const isCrossAssociation = project.scope === "ALL_ASSOCIATIONS" && ["PUBLISHED", "CLOSED"].includes(project.status) && Boolean(actor);
  if (!isPublic && !isSameAssociation && !isCrossAssociation && !actor?.isPlatformAdmin) {
    return NextResponse.json({ error: actor ? "Non autorisé." : "Connectez-vous pour consulter cette levée." }, { status: actor ? 403 : 401 });
  }

  const manager = Boolean(actor && (canManage(actor) && (actor.associationId === project.associationId || actor.isPlatformAdmin)));
  return NextResponse.json({ project: serializeProject(project, { includeContributions: manager, isManager: manager }) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  const actor = await getFundraisingActor(req, project.associationId);
  if (!actor) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!canManage(actor)) return NextResponse.json({ error: "Réservé au fondateur et au bureau." }, { status: 403 });
  if (actor.associationId !== project.associationId && !actor.isPlatformAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const data: any = {};
  if (body.title !== undefined) {
    const title = cleanText(body.title, 160);
    if (title.length < 3) return NextResponse.json({ error: "Titre invalide." }, { status: 400 });
    data.title = title;
  }
  if (body.type !== undefined) {
    if (!isFundraisingType(body.type)) return NextResponse.json({ error: "Type invalide." }, { status: 400 });
    data.type = body.type;
  }
  for (const key of ["contextJustification", "objectives", "expectedResults", "beneficiaries", "coverUrl"] as const) {
    if (body[key] !== undefined) data[key] = cleanText(body[key]);
  }
  if (body.targetAmount !== undefined) data.targetAmount = safeAmount(body.targetAmount);
  if (body.startDate !== undefined) {
    const startDate = dateOrNull(body.startDate);
    if (!startDate) return NextResponse.json({ error: "Date de début invalide." }, { status: 400 });
    data.startDate = startDate;
  }
  if (body.endDate !== undefined) {
    const endDate = dateOrNull(body.endDate);
    if (!endDate) return NextResponse.json({ error: "Date de fin invalide." }, { status: 400 });
    data.endDate = endDate;
  }
  if (body.contributionMode !== undefined) {
    if (!isContributionMode(body.contributionMode)) return NextResponse.json({ error: "Mode de contribution invalide." }, { status: 400 });
    data.contributionMode = body.contributionMode;
  }
  if (body.fixedAmount !== undefined) data.fixedAmount = body.fixedAmount == null || body.fixedAmount === "" ? null : safeAmount(body.fixedAmount);
  if (body.contributorMode !== undefined) {
    if (!isContributorMode(body.contributorMode)) return NextResponse.json({ error: "Mode de contributeur invalide." }, { status: 400 });
    data.contributorMode = body.contributorMode;
  }
  if (body.scope !== undefined) {
    if (!isFundraisingScope(body.scope)) return NextResponse.json({ error: "Portée invalide." }, { status: 400 });
    data.scope = body.scope;
  }

  const nextStart = data.startDate || project.startDate;
  const nextEnd = data.endDate || project.endDate;
  if (nextEnd <= nextStart) return NextResponse.json({ error: "La date de fin doit être postérieure à la date de début." }, { status: 400 });
  const nextMode = data.contributionMode || project.contributionMode;
  const nextFixed = data.fixedAmount !== undefined ? data.fixedAmount : project.fixedAmount;
  if (nextMode === "FIXE" && (!nextFixed || nextFixed <= 0)) return NextResponse.json({ error: "Montant fixe requis." }, { status: 400 });

  const wasPublished = Boolean(project.publishedAt);
  if (body.status !== undefined) {
    if (!["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"].includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }
    data.status = body.status;
    if (body.status === "PUBLISHED" && !project.publishedAt) {
      if ((data.targetAmount ?? project.targetAmount) <= 0) return NextResponse.json({ error: "La cagnotte cible doit être supérieure à 0." }, { status: 400 });
      data.publishedAt = new Date();
    }
    if (body.status === "CLOSED" && !project.closedAt) data.closedAt = new Date();
  }

  const updated = await prisma.fundraisingProject.update({ where: { id }, data, include: { contributions: { orderBy: { createdAt: "desc" } } } });
  if (updated.status === "PUBLISHED" && !wasPublished) await notifyFundraisingProject(updated);

  const fresh = await loadProject(id);
  return NextResponse.json({ project: serializeProject(fresh, { includeContributions: true, isManager: true }) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  const actor = await getFundraisingActor(req, project.associationId);
  if (!actor) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!canManage(actor) || (actor.associationId !== project.associationId && !actor.isPlatformAdmin)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  if (project.contributions.some((c) => c.status !== "CANCELLED")) {
    const cancelled = await prisma.fundraisingProject.update({
      where: { id },
      data: { status: "CANCELLED", closedAt: new Date() },
      include: { contributions: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json({ project: serializeProject(cancelled, { includeContributions: true, isManager: true }), deleted: false });
  }

  await prisma.fundraisingProject.delete({ where: { id } });
  return NextResponse.json({ success: true, deleted: true });
}
