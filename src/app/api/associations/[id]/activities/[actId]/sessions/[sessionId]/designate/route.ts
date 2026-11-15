import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { designateSessionBeneficiary } from "@/lib/association/beneficiary-designation";

const BUREAU_ROLES = [
  "PRESIDENT",
  "FOUNDER",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
];

export async function POST(
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
  if (!membership || !BUREAU_ROLES.includes(membership.role)) {
    return NextResponse.json(
      { error: "Accès refusé. Seul le bureau peut lancer la désignation automatique." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await designateSessionBeneficiary(prisma, {
      associationId,
      activityId,
      sessionId,
      actorUserId: session.user.id,
      modeOverride: body.mode,
      bids: Array.isArray(body.bids) ? body.bids : undefined,
      requirePaidContribution: Boolean(body.requirePaidContribution),
      allowCycleWrap: body.allowCycleWrap !== false,
      finalize: Boolean(body.finalize),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    const msg = String(err?.message ?? "");
    if (msg === "SESSION_NOT_FOUND") {
      return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });
    }
    if (msg === "ALREADY_DESIGNATED") {
      return NextResponse.json({ error: "Un bénéficiaire a déjà été désigné pour cette séance" }, { status: 409 });
    }
    if (msg === "NO_ELIGIBLE_CANDIDATE") {
      return NextResponse.json({ error: "Aucun candidat éligible pour cette séance" }, { status: 422 });
    }
    if (msg.startsWith("AUCTION_MIN_BIDDERS:")) {
      return NextResponse.json(
        { error: `Enchères invalides : minimum ${msg.split(":")[1]} enchérisseur(s) éligible(s) requis.` },
        { status: 422 }
      );
    }
    console.error("Designation error:", err);
    return NextResponse.json({ error: "Erreur lors de la désignation automatique" }, { status: 500 });
  }
}
