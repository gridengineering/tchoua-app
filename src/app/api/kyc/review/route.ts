import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";
import { normalizeKycLevel } from "@/lib/kyc";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const requestId = String(body.requestId ?? "");
  const decision = String(body.decision ?? "").toUpperCase();
  const note = body.note ? String(body.note).slice(0, 1000) : null;

  if (!requestId || !["APPROVE", "REJECT"].includes(decision)) {
    return NextResponse.json({ error: "requestId et decision (APPROVE|REJECT) sont requis" }, { status: 400 });
  }

  const kycRequest = await prisma.kycRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      documents: { select: { id: true, type: true, label: true, mimeType: true, size: true, status: true } },
    },
  });

  if (!kycRequest) return NextResponse.json({ error: "Demande KYC introuvable" }, { status: 404 });
  if (kycRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 409 });
  }
  if (kycRequest.userId === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas valider votre propre KYC" }, { status: 403 });
  }

  let authorized = isSuperAdmin(session);

  if (!authorized) {
    const targetMemberships = await prisma.associationMembership.findMany({
      where: { userId: kycRequest.userId, status: { not: "LEFT" } },
      select: { associationId: true },
    });
    for (const target of targetMemberships) {
      const actor = await prisma.associationMembership.findUnique({
        where: { userId_associationId: { userId: session.user.id, associationId: target.associationId } },
        include: { customRole: true },
      });
      if (actor && actor.status !== "LEFT" && hasPermission(session, actor, "MANAGE_MEMBERS")) {
        authorized = true;
        break;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Validation réservée au bureau de l'association ou à l'administration" }, { status: 403 });
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycLevel: true },
  });
  const reviewerLevel = normalizeKycLevel(reviewer?.kycLevel ?? 0);
  const requestedLevel = normalizeKycLevel(kycRequest.requestedLevel);
  if (!isSuperAdmin(session) && reviewerLevel < requestedLevel) {
    return NextResponse.json(
      {
        error: `Un validateur doit avoir un niveau KYC au moins égal au niveau demandé (KYC ${requestedLevel}).`,
        code: "REVIEWER_KYC_TOO_LOW",
        reviewerLevel,
        requiredLevel: requestedLevel,
      },
      { status: 403 }
    );
  }

  const now = new Date();

  if (decision === "REJECT") {
    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.kycRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", reviewNote: note, reviewedById: session.user.id, reviewedAt: now },
      });
      await tx.user.update({ where: { id: kycRequest.userId }, data: { kycStatus: "REJECTED" } });
      await tx.kycDocument.updateMany({
        where: { kycRequestId: kycRequest.id },
        data: { status: "REJECTED" },
      });
      return request;
    });
    return NextResponse.json({ request: updated, status: "REJECTED" });
  }

  const level = normalizeKycLevel(kycRequest.requestedLevel);
  if (level < 2) {
    return NextResponse.json({ error: "Niveau de validation incohérent" }, { status: 400 });
  }

  const kycData = JSON.stringify({
    level,
    fullName: kycRequest.fullName,
    dateOfBirth: kycRequest.dateOfBirth,
    nationality: kycRequest.nationality,
    idType: kycRequest.idType,
    idNumber: kycRequest.idNumber,
    address: kycRequest.address,
    city: kycRequest.city,
    country: kycRequest.country,
    occupation: kycRequest.occupation,
    sourceOfFunds: kycRequest.sourceOfFunds,
    reviewedById: session.user.id,
    reviewedAt: now.toISOString(),
  });

  const updated = await prisma.$transaction(async (tx) => {
    const request = await tx.kycRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewNote: note, reviewedById: session.user.id, reviewedAt: now },
    });
    await tx.user.update({
      where: { id: kycRequest.userId },
      data: {
        kycLevel: level,
        kycStatus: "VERIFIED",
        kycVerifiedAt: now,
        kycData,
      },
    });
    await tx.kycDocument.updateMany({
      where: { kycRequestId: kycRequest.id },
      data: { status: "APPROVED" },
    });
    return request;
  });

  return NextResponse.json({ request: updated, level, status: "VERIFIED" });
}
