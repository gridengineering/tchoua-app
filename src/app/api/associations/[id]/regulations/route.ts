import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Retourne les articles + statut d'approbation du membre connecté
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;

  const membership = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: session.user.id, associationId } }
  });

  const [articles, association] = await Promise.all([
    prisma.associationRegulationArticle.findMany({
      where: { associationId },
      orderBy: { articleNumber: "asc" }
    }),
    prisma.association.findUnique({
      where: { id: associationId },
      select: { requireRegulationApproval: true },
    }),
  ]);

  let approvals: string[] = [];
  if (membership) {
    const memberApprovals = await prisma.membershipRegulationApproval.findMany({
      where: { membershipId: membership.id },
      select: { articleId: true }
    });
    approvals = memberApprovals.map(a => a.articleId);
  }

  return NextResponse.json({
    articles,
    approvals,
    membershipStatus: membership?.status ?? null,
    required: association?.requireRegulationApproval ?? true,
    allApproved: articles.length > 0 && articles.every(a => approvals.includes(a.id)),
  });
}

// POST: Approuver un article spécifique
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const { articleId } = await req.json();

  if (!articleId) return NextResponse.json({ error: "articleId requis" }, { status: 400 });

  const membership = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: session.user.id, associationId } }
  });

  if (!membership) return NextResponse.json({ error: "Vous n'êtes pas membre de cette association" }, { status: 403 });

  // Valider que l'article appartient à l'association
  const article = await prisma.associationRegulationArticle.findFirst({
    where: { id: articleId, associationId }
  });
  if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

  // Créer ou ignorer si déjà approuvé
  await prisma.membershipRegulationApproval.upsert({
    where: { membershipId_articleId: { membershipId: membership.id, articleId } },
    create: { membershipId: membership.id, articleId },
    update: {}
  });

  // Vérifier si TOUS les articles ont été approuvés
  const totalArticles = await prisma.associationRegulationArticle.count({ where: { associationId } });
  const totalApprovals = await prisma.membershipRegulationApproval.count({ where: { membershipId: membership.id } });

  let activatedNow = false;
  if (totalArticles > 0 && totalApprovals >= totalArticles && membership.status === "PENDING") {
    await prisma.associationMembership.update({
      where: { id: membership.id },
      data: { status: "ACTIVE", joinedAt: new Date() }
    });
    activatedNow = true;
  }

  return NextResponse.json({ success: true, activatedNow });
}
