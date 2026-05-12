import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAssociationName, validateMaxAssociationsPerMember } from "@/lib/association/rules";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      name,
      description,
      type,
      color,
      logo,
      region,
      email,
      phone,
      parentId,
      parentSubscriptionFee,
      regulations // Array of { title, content }
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    // ─── Validation V9 ──────────────────────────────────────────────────────
    const nameValidation = await validateAssociationName(name, prisma);
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    const limitValidation = await validateMaxAssociationsPerMember(userId, prisma);
    if (!limitValidation.valid) {
      return NextResponse.json({ error: limitValidation.error }, { status: 400 });
    }

    const nameSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Process inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer l'association (statut DRAFT par défaut — spec V9)
      const newAssoc = await tx.association.create({
        data: {
          name,
          nameSlug,
          description,
          type: type || "TONTINE_CLUB",
          color: color || "#165E39",
          logo,
          region,
          email,
          phone,
          parentId,
          parentSubscriptionFee: parentSubscriptionFee ? parseFloat(parentSubscriptionFee) : null,
          creatorId: userId,
          // status: "DRAFT" — laissé au défaut Prisma
        }
      });

      // 2. Créer l'adhésion pour le créateur (Fondateur)
      const membership = await tx.associationMembership.create({
        data: {
          userId,
          associationId: newAssoc.id,
          role: "FOUNDER",
          status: "ACTIVE", // Le fondateur est actif par défaut
          joinedAt: new Date()
        }
      });

      // 3. Créer les articles du règlement intérieur
      if (regulations && Array.isArray(regulations) && regulations.length > 0) {
        const articlesData = regulations.map((reg, index) => ({
          associationId: newAssoc.id,
          articleNumber: index + 1,
          title: reg.title,
          content: reg.content
        }));

        await tx.associationRegulationArticle.createMany({
          data: articlesData
        });

        // Approuver automatiquement tous les articles pour le fondateur
        const createdArticles = await tx.associationRegulationArticle.findMany({
          where: { associationId: newAssoc.id }
        });

        const approvals = createdArticles.map(art => ({
          membershipId: membership.id,
          articleId: art.id
        }));

        if (approvals.length > 0) {
          await tx.membershipRegulationApproval.createMany({
            data: approvals
          });
        }
      }

      // 4. Si une association parente est définie, inscrire le fondateur dans la parente s'il n'y est pas
      if (parentId) {
        const existingParentMembership = await tx.associationMembership.findUnique({
          where: {
            userId_associationId: {
              userId,
              associationId: parentId
            }
          }
        });

        if (!existingParentMembership) {
          await tx.associationMembership.create({
            data: {
              userId,
              associationId: parentId,
              role: "MEMBER",
              status: "ACTIVE",
              joinedAt: new Date()
            }
          });
        }
      }

      return newAssoc;
    });

    return NextResponse.json({ success: true, association: result });

  } catch (error: any) {
    console.error("Erreur POST /api/associations/wizard:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la création de l'association" }, { status: 500 });
  }
}
