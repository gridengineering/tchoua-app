import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { distributeContribution } from "@/lib/distribution-engine";
import { prisma } from "@/lib/prisma";
import { bankOnlyPaymentError, isBankOnlyPaymentMode, isBankPaymentMethod } from "@/lib/payment-policy";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: associationId } = await params;
  
  // Vérification des droits: seul le bureau (trésorier, secrétaire, président) ou un admin peut faire ça
  const myMembership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId, status: "ACTIVE" }
  });
  
  const isBureau = myMembership && ["PRESIDENT", "FOUNDER", "TREASURER", "SECRETARY", "SECRETARY_ADJ", "TREASURER_ADJ"].includes(myMembership.role);
  
  if (!isBureau) {
    return NextResponse.json({ error: "Accès refusé. Seul le bureau peut encaisser et répartir des fonds." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { membershipId, amount, paymentMethod, reference, meetingId } = body;

    if (!membershipId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { bankConfig: true },
    });
    const bankOnly = isBankOnlyPaymentMode(association?.bankConfig);
    const effectivePaymentMethod = paymentMethod ?? (bankOnly ? "BANK_TRANSFER" : "CASH");
    if (bankOnly && !isBankPaymentMethod(effectivePaymentMethod)) {
      return NextResponse.json(bankOnlyPaymentError(), { status: 422 });
    }

    // Appel du moteur de répartition
    const result = await distributeContribution(
      associationId,
      membershipId,
      Number(amount),
      effectivePaymentMethod,
      reference,
      meetingId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error, allocations: result.allocations }, { status: 422 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Distribution error:", error);
    return NextResponse.json({ error: "Erreur interne serveur" }, { status: 500 });
  }
}
