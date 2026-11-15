import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string; sessionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: associationId, actId: activityId, sessionId } = await params;

  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId, status: "ACTIVE" },
  });

  const isBureau = Boolean(
    membership && ["PRESIDENT", "FOUNDER", "SECRETARY", "TREASURER"].includes(membership.role)
  );
  if (!isBureau && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Isolation inter-associations : la séance et l'activité doivent appartenir
  // à l'association autorisée, indépendamment des identifiants de l'URL.
  const [activity, existingSession] = await Promise.all([
    prisma.associationActivity.findFirst({
      where: { id: activityId, associationId },
      select: { id: true },
    }),
    prisma.activitySession.findFirst({
      where: { id: sessionId, activityId },
      select: { id: true, status: true },
    }),
  ]);
  if (!activity || !existingSession) {
    return NextResponse.json({ error: "Séance ou activité introuvable" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { status, drawResult, auctionResult, distributed, reliquat } = body;

    if (status === "HELD" && existingSession.status === "HELD") {
      return NextResponse.json({ error: "Cette séance est déjà clôturée" }, { status: 409 });
    }

    const updatedSession = await prisma.$transaction(async (tx) => {
      if (status !== "HELD") {
        return tx.activitySession.update({
          where: { id: sessionId },
          data: {
            ...(status !== undefined && { status }),
            ...(drawResult !== undefined && { drawResult }),
            ...(auctionResult !== undefined && { auctionResult }),
            ...(distributed !== undefined && { distributed }),
            ...(reliquat !== undefined && { reliquat }),
          },
        });
      }

      // Clôture conditionnelle : une seule requête concurrente peut passer de
      // non-HELD à HELD, puis créer le bénéficiaire et les mouvements de caisse.
      const closed = await tx.activitySession.updateMany({
        where: { id: sessionId, activityId, status: { not: "HELD" } },
        data: {
          status,
          heldAt: new Date(),
          ...(drawResult !== undefined && { drawResult }),
          ...(auctionResult !== undefined && { auctionResult }),
          ...(distributed !== undefined && { distributed }),
          ...(reliquat !== undefined && { reliquat }),
        },
      });
      if (closed.count === 0) throw new Error("ALREADY_CLOSED");

      const closedSession = await tx.activitySession.findUniqueOrThrow({ where: { id: sessionId } });

      let beneficiaryId: string | null = null;
      const amountToGive = Number(distributed) || 0;

      if (drawResult) {
        try {
          const dr = typeof drawResult === "string" ? JSON.parse(drawResult) : drawResult;
          beneficiaryId = dr.beneficiaries?.[0]?.membershipId ?? null;
        } catch {}
      } else if (auctionResult) {
        try {
          const ar = typeof auctionResult === "string" ? JSON.parse(auctionResult) : auctionResult;
          beneficiaryId = ar.winnerId ?? null;
          if (Number(ar.winningBid) > 0) {
            await tx.associationActivity.update({
              where: { id: activityId },
              data: { caisseBalance: { increment: Number(ar.winningBid) } },
            });
          }
        } catch {}
      }

      if (beneficiaryId && amountToGive > 0) {
        const beneficiaryMembership = await tx.associationMembership.findFirst({
          where: { id: beneficiaryId, associationId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!beneficiaryMembership) throw new Error("BENEFICIARY_INVALID");

        const assoc = await tx.association.findUnique({
          where: { id: associationId },
          select: { socialAidCaps: true },
        });

        let solidarityDeduction = 0;
        if (assoc?.socialAidCaps) {
          try {
            const caps = JSON.parse(assoc.socialAidCaps);
            if (caps.tontine_tax) {
              solidarityDeduction = Number(caps.tontine_tax) || 0;
            } else if (caps.tontine_tax_pct) {
              solidarityDeduction = (amountToGive * Number(caps.tontine_tax_pct)) / 100;
            }
          } catch {}
        }

        const finalAmount = Math.max(0, amountToGive - solidarityDeduction);

        await tx.activityBeneficiary.create({
          data: {
            sessionId,
            membershipId: beneficiaryId,
            amount: finalAmount,
            paidAt: new Date(),
            notes:
              solidarityDeduction > 0
                ? `Déduction solidarité : ${solidarityDeduction} FCFA`
                : undefined,
          },
        });

        if (solidarityDeduction > 0) {
          const solidarityAct = await tx.associationActivity.findFirst({
            where: { associationId, type: "AIDE_SOLIDAIRE", status: "ACTIVE" },
          });
          if (solidarityAct) {
            await tx.associationActivity.update({
              where: { id: solidarityAct.id },
              data: { caisseBalance: { increment: solidarityDeduction } },
            });
          }
        }
      }

      if (reliquat !== undefined && Number(reliquat) > 0) {
        await tx.associationActivity.update({
          where: { id: activityId },
          data: { caisseBalance: { increment: Number(reliquat) } },
        });
      }

      return closedSession;
    });

    return NextResponse.json(updatedSession);
  } catch (error: any) {
    if (error?.message === "ALREADY_CLOSED") {
      return NextResponse.json({ error: "Cette séance est déjà clôturée" }, { status: 409 });
    }
    if (error?.message === "BENEFICIARY_INVALID") {
      return NextResponse.json(
        { error: "Le bénéficiaire n'appartient pas à cette association" },
        { status: 422 }
      );
    }
    console.error("Session update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
