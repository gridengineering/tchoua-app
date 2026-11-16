import { toMinor } from "@/lib/arp/money";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { checkAssociationEligibility, eligibilityJson } from "@/lib/association/eligibility";
import { arpErrorResponse, requireArpCapability } from "@/lib/arp/server";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "SOLIDARITY_OFFICER"];
const AID_APPROVER_ROLES = ["PRESIDENT", "FOUNDER", "TREASURER", "SOLIDARITY_OFFICER"];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: "ACTIVE" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!membership && !isPlatformAdmin(session)) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const isBureau = Boolean(membership && BUREAU_ROLES.includes(membership.role)) || isPlatformAdmin(session);

  const requests = await prisma.assocSocialAidRequest.findMany({
    where: {
      associationId: id,
      ...(!isBureau && { membershipId: membership?.id }),
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
  const idempotencyKey = req.headers.get("idempotency-key")?.trim() || undefined;
  if (idempotencyKey) {
    const existing = await prisma.assocSocialAidRequest.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.associationId !== id || existing.membershipId !== membership.id ||
          existing.category !== category || existing.requestedAmount !== requestedAmount ||
          (existing.justification ?? null) !== (justification ?? null) ||
          existing.urgencyLevel !== (urgencyLevel ?? "NORMAL") ||
          (existing.documentUrl ?? null) !== (documentUrl ?? null)) {
        return NextResponse.json({ error: "Clé de requête déjà utilisée pour une autre opération" }, { status: 409 });
      }
      return NextResponse.json({ request: existing, replayed: true });
    }
  }

  if (!category || typeof requestedAmount !== "number" || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
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
      idempotencyKey,
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
  if (!membership || (!AID_APPROVER_ROLES.includes(membership.role) && !isPlatformAdmin(session))) {
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

  const association = await prisma.association.findUnique({
    where: { id },
    select: { socialAidCaps: true },
  });

  const caps = (() => {
    try {
      return association?.socialAidCaps ? JSON.parse(association.socialAidCaps) : {};
    } catch {
      return {};
    }
  })();

  const cap = Number(caps[aidRequest.category] ?? caps.DEFAULT ?? 0);
  const requested = Number(aidRequest.requestedAmount) || 0;

  try {
    if (action === "APPROVE") {
      if (aidRequest.status !== "PENDING") {
        return NextResponse.json({ error: "Seule une demande en attente peut être approuvée" }, { status: 409 });
      }
      const amount = Number(approvedAmount ?? requested);
      if (!Number.isFinite(amount) || amount <= 0 || amount > requested) {
        return NextResponse.json(
          { error: "Le montant approuvé doit être positif et inférieur ou égal au montant demandé" },
          { status: 400 }
        );
      }
      if (cap > 0 && amount > cap) {
        return NextResponse.json(
          { error: `Montant supérieur au plafond de la catégorie (${cap} FCFA)` },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM associations WHERE id = ${id} FOR UPDATE`;
      if (cap > 0) {
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        const used = await tx.assocSocialAidRequest.aggregate({
          where: {
            associationId: id,
            membershipId: aidRequest.membershipId,
            category: aidRequest.category,
            status: { in: ["APPROVED", "PAID"] },
            createdAt: { gte: yearStart },
            id: { not: requestId },
          },
          _sum: { approvedAmount: true },
        });
        const alreadyApproved = used._sum.approvedAmount ?? 0;
        if (alreadyApproved + amount > cap) {
          throw new Error("AID_ANNUAL_CAP");
        }
      }

        const changed = await tx.assocSocialAidRequest.updateMany({
          where: { id: requestId, associationId: id, status: "PENDING" },
          data: {
            status: "APPROVED",
            approvedAmount: amount,
            approvedAt: new Date(),
            approvedById: session.user.id,
            ...(notes !== undefined && { notes }),
          },
        });
        if (changed.count === 0) throw new Error("AID_STATE_CHANGED");
        return tx.assocSocialAidRequest.findUniqueOrThrow({
          where: { id: requestId },
          include: { membership: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
        });
      });

      return NextResponse.json({ request: updated });
    }

    if (action === "REJECT") {
      if (aidRequest.status !== "PENDING") {
        return NextResponse.json({ error: "Seule une demande en attente peut être rejetée" }, { status: 409 });
      }
      const changed = await prisma.assocSocialAidRequest.updateMany({
        where: { id: requestId, associationId: id, status: "PENDING" },
        data: {
          status: "REJECTED",
          rejectedReason: rejectedReason ?? null,
          ...(notes !== undefined && { notes }),
        },
      });
      if (changed.count === 0) {
        return NextResponse.json({ error: "La demande a déjà changé d'état" }, { status: 409 });
      }
      const updated = await prisma.assocSocialAidRequest.findUniqueOrThrow({ where: { id: requestId } });
      return NextResponse.json({ request: updated });
    }

    if (action === "PAY") {
      if (aidRequest.status !== "APPROVED") {
        return NextResponse.json({ error: "Une aide doit être approuvée avant d'être payée" }, { status: 409 });
      }
      const amount = Number(aidRequest.approvedAmount ?? 0);
      if (amount <= 0) {
        return NextResponse.json({ error: "Le montant approuvé est invalide" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM associations WHERE id = ${id} FOR UPDATE`;
        const solidarity = await tx.associationActivity.findFirst({
          where: { associationId: id, type: { in: ["AIDE_SOLIDAIRE", "SOLIDARITY"] }, status: "ACTIVE" },
          select: { id: true, caisseBalance: true },
        });
        if (!solidarity) throw new Error("AID_TREASURY_NOT_FOUND");
        

        const changed = await tx.assocSocialAidRequest.updateMany({
          where: { id: requestId, associationId: id, status: "APPROVED" },
          data: { status: "PAID", paidAt: new Date(), ...(notes !== undefined && { notes }) },
        });
        if (changed.count === 0) throw new Error("AID_STATE_CHANGED");

        const debited = await tx.associationActivity.updateMany({
          where: { id: solidarity.id, caisseBalance: { gte: amount } },
          data: { caisseBalance: { decrement: amount } },
        });
        if (debited.count !== 1) throw new Error("AID_TREASURY_INSUFFICIENT");

        // Si un fonds ARP est rattaché à la caisse de solidarité, la sortie
        // est également inscrite au journal du fonds.
        const fund = await tx.arpFund.findFirst({
          where: { associationId: id, activityId: solidarity.id, status: "ACTIVE" },
          select: { id: true, currency: true },
        });
        if (fund) {
          await tx.$queryRaw`SELECT id FROM arp_funds WHERE id = ${fund.id} FOR UPDATE`;
          const amountMinor = toMinor(amount, fund.currency);
          const [inflow, outflow, reserved] = await Promise.all([
            tx.arpFundMovement.aggregate({ where: { fundId: fund.id, direction: "IN" }, _sum: { amountMinor: true } }),
            tx.arpFundMovement.aggregate({ where: { fundId: fund.id, direction: "OUT" }, _sum: { amountMinor: true } }),
            tx.arpFundReservation.aggregate({ where: { fundId: fund.id, status: "ACTIVE" }, _sum: { amountMinor: true } }),
          ]);
          const available =
            (inflow._sum.amountMinor ?? BigInt(0)) -
            (outflow._sum.amountMinor ?? BigInt(0)) -
            (reserved._sum.amountMinor ?? BigInt(0));
          if (available < amountMinor) {
            throw new Error("AID_FUND_INSUFFICIENT");
          }
          await tx.arpFundMovement.create({
            data: {
              fundId: fund.id,
              direction: "OUT",
              amountMinor,
              currency: fund.currency,
              valueDate: new Date(),
              sourceType: "SOCIAL_AID",
              sourceId: requestId,
              description: `Paiement aide ${aidRequest.category}`,
              createdById: session.user.id,
            },
          });
        }

        return tx.assocSocialAidRequest.findUniqueOrThrow({ where: { id: requestId } });
      });

      return NextResponse.json({ request: result });
    }
  } catch (error: any) {
    if (error?.message === "AID_ANNUAL_CAP") {
      return NextResponse.json({ error: "Le plafond annuel de cette catégorie est dépassé" }, { status: 409 });
    }
    if (error?.message === "AID_STATE_CHANGED") {
      return NextResponse.json({ error: "La demande a déjà changé d'état" }, { status: 409 });
    }
    if (error?.message === "AID_TREASURY_NOT_FOUND") {
      return NextResponse.json({ error: "Aucune caisse de solidarité active" }, { status: 409 });
    }
    if (error?.message === "AID_TREASURY_INSUFFICIENT" || error?.message === "AID_FUND_INSUFFICIENT") {
      return NextResponse.json({ error: "Solde insuffisant dans la caisse/fonds de solidarité" }, { status: 409 });
    }
    console.error("Social aid update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
