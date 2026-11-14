import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAssociationEligibility, eligibilityJson } from "@/lib/association/eligibility";
import { arpErrorResponse, requireArpCapability } from "@/lib/arp/server";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "SOLIDARITY_OFFICER"];
const AID_APPROVER_ROLES = ["PRESIDENT", "FOUNDER", "TREASURER", "SOLIDARITY_OFFICER"];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const isBureau = BUREAU_ROLES.includes(membership.role);

  const requests = await prisma.assocSocialAidRequest.findMany({
    where: {
      associationId: id,
      ...(!isBureau && { membershipId: membership.id }),
    },
    include: {
      membership: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  try {
    await requireArpCapability(id, "SOCIAL_AID");
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    throw error;
  }

  const body = await req.json();
  const { category, requestedAmount, justification, urgencyLevel, documentUrl } = body;

  if (!category || !requestedAmount) {
    return NextResponse.json({ error: "category et requestedAmount sont requis" }, { status: 400 });
  }

  const eligibility = await checkAssociationEligibility(session.user.id, id, {
    amount: Number(requestedAmount),
  });
  if (!eligibility.ok) {
    return NextResponse.json(eligibilityJson(eligibility), { status: 403 });
  }

  // Check cap from association socialAidCaps
  const association = await prisma.association.findUnique({
    where: { id },
    select: { socialAidCaps: true },
  });

  if (association?.socialAidCaps) {
    const caps = JSON.parse(association.socialAidCaps as string);
    const cap = caps[category] ?? caps["DEFAULT"];
    if (cap !== undefined && requestedAmount > cap) {
      return NextResponse.json(
        { error: `Montant demandé dépasse le plafond autorisé (${cap}) pour la catégorie ${category}` },
        { status: 400 }
      );
    }
  }

  const request = await prisma.assocSocialAidRequest.create({
    data: {
      associationId: id,
      membershipId: membership.id,
      category,
      requestedAmount,
      justification,
      urgencyLevel: urgencyLevel ?? "NORMAL",
      documentUrl,
      status: "PENDING",
    },
    include: {
      membership: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership || !AID_APPROVER_ROLES.includes(membership.role)) {
    return NextResponse.json({ error: "Réservé aux officiers désignés" }, { status: 403 });
  }

  const body = await req.json();
  const { requestId, action, approvedAmount, rejectedReason, notes } = body;

  if (!requestId || !action) {
    return NextResponse.json({ error: "requestId et action sont requis" }, { status: 400 });
  }

  const aidRequest = await prisma.assocSocialAidRequest.findFirst({
    where: { id: requestId, associationId: id },
  });
  if (!aidRequest) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

  let newStatus = action;
  if (action === "APPROVE") newStatus = "APPROVED";
  if (action === "REJECT") newStatus = "REJECTED";
  if (action === "PAY") newStatus = "PAID";

  const updated = await prisma.assocSocialAidRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      ...(action === "APPROVE" && {
        approvedAmount: approvedAmount ?? aidRequest.requestedAmount,
        approvedAt: new Date(),
        approvedById: session.user.id,
      }),
      ...(action === "REJECT" && { rejectedReason }),
      ...(action === "PAY" && { paidAt: new Date() }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      membership: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });

  return NextResponse.json({ request: updated });
}
