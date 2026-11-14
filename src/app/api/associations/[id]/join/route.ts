import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONSENT_KEYS, CONSENT_VERSION } from "@/lib/consents";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  // Dans un cas réel, l'utilisateur pourrait ne pas être encore connecté et on créerait le User.
  // Pour simplifier cette démo SaaS, on suppose que l'utilisateur est connecté à la plateforme.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté pour postuler" }, { status: 401 });
  }

  const { id: associationId } = await params;

  const consents = await prisma.platformConsent.findMany({
    where: { userId: session.user.id, version: CONSENT_VERSION },
    select: { document: true },
  });
  const accepted = new Set(consents.map((c) => c.document));
  if (!CONSENT_KEYS.every((key) => accepted.has(key))) {
    return NextResponse.json(
      {
        error: "Acceptez d'abord les conditions, la confidentialité, la protection des données et la non-divulgation.",
        code: "CONSENT_REQUIRED",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { 
      sponsorId, 
      firstSpouseName, 
      fatherName, 
      motherName, 
      childrenCount,
      emergencyName,
      emergencyPhone,
      emergencyRelationship,
      profession,
      location
    } = body;

    // Vérifier si l'utilisateur est déjà membre
    const existingMembership = await prisma.associationMembership.findUnique({
      where: {
        userId_associationId: {
          userId: session.user.id,
          associationId
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: "Vous avez déjà soumis une demande pour cette association" }, { status: 400 });
    }

    // Mettre à jour les infos du User (Famille, Urgence, etc.)
    const familyInfo = JSON.stringify({ firstSpouseName, fatherName, motherName, childrenCount: Number(childrenCount) || 0 });
    const emergencyContact = JSON.stringify({ name: emergencyName, phone: emergencyPhone, relationship: emergencyRelationship });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profession: profession || undefined,
        location: location || undefined,
        familyInfo,
        emergencyContact
      }
    });

    // Créer le membership en attente (PENDING)
    const membership = await prisma.associationMembership.create({
      data: {
        userId: session.user.id,
        associationId,
        status: "PENDING", // En attente d'approbation du bureau ET du règlement intérieur
        role: "MEMBER",
        sponsorId: sponsorId || null
      }
    });

    // Gestion du Parent: Auto-ajout Actif si applicable
    const associationInfo = await prisma.association.findUnique({
      where: { id: associationId },
      select: { parentId: true }
    });

    if (associationInfo?.parentId) {
      const existingParent = await prisma.associationMembership.findUnique({
        where: {
          userId_associationId: {
            userId: session.user.id,
            associationId: associationInfo.parentId
          }
        }
      });

      if (!existingParent) {
        await prisma.associationMembership.create({
          data: {
            userId: session.user.id,
            associationId: associationInfo.parentId,
            status: "ACTIVE", // Actif automatiquement selon specs
            role: "MEMBER",
            joinedAt: new Date()
          }
        });
      }
    }

    return NextResponse.json({ success: true, membership });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la soumission de la demande" }, { status: 500 });
  }
}
