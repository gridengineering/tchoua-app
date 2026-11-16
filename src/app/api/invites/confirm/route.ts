import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInviteToken } from "@/lib/association/member-invite";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Jeton d'invitation manquant" }, { status: 400 });
  }

  const payload = verifyInviteToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Lien d'invitation invalide ou expiré" }, { status: 400 });
  }

  const [user, membership, association] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.userId } }),
    prisma.associationMembership.findUnique({ where: { id: payload.membershipId } }),
    prisma.association.findUnique({
      where: { id: payload.associationId },
      select: { id: true, name: true },
    }),
  ]);

  if (!user || !membership || !association) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        kycLevel: Math.max(user.kycLevel, 1),
        kycStatus: user.kycLevel >= 1 ? user.kycStatus : "VERIFIED",
        kycVerifiedAt: user.kycVerifiedAt ?? now,
        emailVerifiedAt: payload.email ? user.emailVerifiedAt ?? now : user.emailVerifiedAt,
        phoneVerifiedAt: payload.phone ? user.phoneVerifiedAt ?? now : user.phoneVerifiedAt,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.associationMembership.update({
      where: { id: membership.id },
      data: { status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json({
    confirmed: true,
    kycLevel: Math.max(user.kycLevel, 1),
    association,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
