import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; actId: string; sessionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: associationId, actId: activityId, sessionId } = await params;

  // Check if user is in bureau
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId, status: "ACTIVE" }
  });

  const isBureau = membership && ["PRESIDENT", "FOUNDER", "SECRETARY", "TREASURER"].includes(membership.role);
  if (!isBureau) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, drawResult, auctionResult, distributed, reliquat } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (drawResult !== undefined) data.drawResult = drawResult;
    if (auctionResult !== undefined) data.auctionResult = auctionResult;
    if (distributed !== undefined) data.distributed = distributed;
    if (reliquat !== undefined) data.reliquat = reliquat;
    
    // If the session is closing (HELD), record the completion date
    if (status === "HELD") {
      data.heldAt = new Date();
    }

    const updatedSession = await prisma.$transaction(async (tx) => {
      const sess = await tx.activitySession.update({
        where: { id: sessionId },
        data
      });

      if (status === "HELD") {
        // 1. Identify Beneficiary
        let beneficiaryId: string | null = null;
        const amountToGive = distributed || 0;

        if (drawResult) {
          try {
            const dr = typeof drawResult === 'string' ? JSON.parse(drawResult) : drawResult;
            beneficiaryId = dr.beneficiaries?.[0]?.membershipId;
          } catch {}
        } else if (auctionResult) {
          try {
            const ar = typeof auctionResult === 'string' ? JSON.parse(auctionResult) : auctionResult;
            beneficiaryId = ar.winnerId;
            // The amount given is already net (distributed), but the auction gain goes to caisse
            if (ar.winningBid > 0) {
              await tx.associationActivity.update({
                where: { id: activityId },
                data: { caisseBalance: { increment: ar.winningBid } }
              });
            }
          } catch {}
        }

        if (beneficiaryId && amountToGive > 0) {
          // 2. Check for Solidarity Prélèvement (Module 5.1)
          const assoc = await tx.association.findUnique({
            where: { id: associationId },
            select: { socialAidCaps: true }
          });
          
          let solidarityDeduction = 0;
          if (assoc?.socialAidCaps) {
            try {
              const caps = JSON.parse(assoc.socialAidCaps);
              // Rule: if tontine_tax is defined, we deduct it
              if (caps.tontine_tax) {
                solidarityDeduction = caps.tontine_tax; // Example fixed amount like 500
              } else if (caps.tontine_tax_pct) {
                solidarityDeduction = (amountToGive * caps.tontine_tax_pct) / 100;
              }
            } catch {}
          }

          const finalAmount = amountToGive - solidarityDeduction;

          // 3. Create Beneficiary Record
          await tx.activityBeneficiary.create({
            data: {
              sessionId,
              membershipId: beneficiaryId,
              amount: finalAmount,
              paidAt: new Date(),
              notes: solidarityDeduction > 0 ? `Déduction solidarité : ${solidarityDeduction} FCFA` : undefined
            }
          });

          // 4. Update Solidarity Fund if deduction was made
          if (solidarityDeduction > 0) {
            const solidarityAct = await tx.associationActivity.findFirst({
              where: { associationId, type: "AIDE_SOLIDAIRE", status: "ACTIVE" }
            });
            if (solidarityAct) {
              await tx.associationActivity.update({
                where: { id: solidarityAct.id },
                data: { caisseBalance: { increment: solidarityDeduction } }
              });
            }
          }
        }

        // 5. Update Activity Caisse with Reliquat
        if (reliquat !== undefined && reliquat > 0) {
          await tx.associationActivity.update({
            where: { id: activityId },
            data: { caisseBalance: { increment: reliquat } }
          });
        }
      }

      return sess;
    });
    
    return NextResponse.json(updatedSession);
  } catch (error: any) {
    console.error("Session update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
