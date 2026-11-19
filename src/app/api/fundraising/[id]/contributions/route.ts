import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManage, cleanText, getFundraisingActor, getFundraisingViewer, safeAmount, serializeProject } from "@/lib/fundraising";

async function projectFor(id: string) {
  return prisma.fundraisingProject.findUnique({
    where: { id },
    include: { contributions: { orderBy: { createdAt: "desc" } } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await projectFor(id);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  const actor = await getFundraisingActor(req, project.associationId);
  if (!actor || !canManage(actor) || (actor.associationId !== project.associationId && !actor.isPlatformAdmin)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  return NextResponse.json({
    contributions: project.contributions.map((c) => ({
      id: c.id,
      amount: c.amount,
      currency: c.currency,
      isAnonymous: c.isAnonymous,
      contributorName: c.isAnonymous ? "Contributeur anonyme" : c.contributorName,
      contributorEmail: c.contributorEmail,
      contributorPhone: c.contributorPhone,
      message: c.message,
      status: c.status,
      paymentMethod: c.paymentMethod,
      paymentReference: c.paymentReference,
      createdAt: c.createdAt,
      confirmedAt: c.confirmedAt,
    })),
    totals: serializeProject(project).totals,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await projectFor(id);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  if (project.status !== "PUBLISHED") return NextResponse.json({ error: "Cette levée n'est pas ouverte aux contributions." }, { status: 400 });
  const now = new Date();
  if (now < project.startDate) return NextResponse.json({ error: "La levée n'a pas encore commencé." }, { status: 400 });
  if (now > project.endDate) return NextResponse.json({ error: "La levée est terminée." }, { status: 400 });

  const hasBearer = Boolean(req.headers.get("authorization"));
  const actor = await getFundraisingViewer(req);
  if (hasBearer && !actor) return NextResponse.json({ error: "Jeton invalide." }, { status: 401 });

  if (project.scope === "ASSOCIATION") {
    if (!actor) return NextResponse.json({ error: "Connectez-vous pour contribuer à cette levée." }, { status: 401 });
    const membership = await prisma.associationMembership.findFirst({
      where: { userId: actor.userId, associationId: project.associationId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!membership) return NextResponse.json({ error: "Cette levée est réservée aux membres de l'association." }, { status: 403 });
  }
  if (project.scope === "ALL_ASSOCIATIONS" && !actor) {
    return NextResponse.json({ error: "Connectez-vous pour contribuer à cette levée." }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const requestedAmount = safeAmount(body.amount);
  const amount = project.contributionMode === "FIXE" ? Number(project.fixedAmount || 0) : requestedAmount;
  if (project.contributionMode === "FIXE" && requestedAmount > 0 && requestedAmount !== amount) {
    return NextResponse.json({ error: `Le montant fixe de cette levée est de ${amount} ${project.currency}.` }, { status: 400 });
  }
  if (!amount || amount <= 0) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
  if (amount > 100_000_000) return NextResponse.json({ error: "Montant trop élevé." }, { status: 400 });

  let anonymous = project.contributorMode === "ANONYME";
  if (project.contributorMode === "AU_CHOIX") anonymous = body.isAnonymous === true;
  if (project.contributorMode === "IDENTIFIE" && body.isAnonymous === true) {
    return NextResponse.json({ error: "Cette levée exige un contributeur identifié." }, { status: 400 });
  }

  const contributor = actor
    ? await prisma.user.findUnique({ where: { id: actor.userId }, select: { name: true, email: true, phone: true } }).catch(() => null)
    : null;
  const name = cleanText(body.contributorName || contributor?.name || "", 120);
  const email = cleanText(body.contributorEmail || contributor?.email || "", 160);
  const phone = cleanText(body.contributorPhone || contributor?.phone || "", 40);

  if (!anonymous && !name) return NextResponse.json({ error: "Votre nom est requis pour une contribution identifiée." }, { status: 400 });
  if (!anonymous && !actor && !email) return NextResponse.json({ error: "Votre e-mail est requis pour une contribution identifiée." }, { status: 400 });

  const contribution = await prisma.fundraisingContribution.create({
    data: {
      projectId: project.id,
      contributorUserId: anonymous ? null : actor?.userId || null,
      contributorName: anonymous ? null : name,
      contributorEmail: anonymous ? null : email || null,
      contributorPhone: anonymous ? null : phone || null,
      associationId: anonymous ? null : actor?.associationId || null,
      amount,
      currency: project.currency,
      isAnonymous: anonymous,
      message: cleanText(body.message, 800) || null,
      status: "PLEDGED",
      paymentMethod: cleanText(body.paymentMethod, 40) || null,
      paymentReference: cleanText(body.paymentReference, 120) || null,
    },
  });

  const fresh = await projectFor(project.id);
  return NextResponse.json({
    contribution: {
      id: contribution.id,
      amount: contribution.amount,
      currency: contribution.currency,
      isAnonymous: contribution.isAnonymous,
      status: contribution.status,
      createdAt: contribution.createdAt,
    },
    project: serializeProject(fresh),
  }, { status: 201 });
}
