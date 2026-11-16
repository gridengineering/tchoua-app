import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmVerificationCode } from "@/lib/verification";

async function verify(uid: string, code: string) {
  if (!uid || !code) {
    return NextResponse.json({ error: "Lien de confirmation incomplet." }, { status: 400 });
  }

  const result = await confirmVerificationCode(uid, "EMAIL", code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { id: true, name: true, email: true, kycLevel: true, language: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const level = Math.max(1, user.kycLevel);
  await prisma.user.update({
    where: { id: uid },
    data: {
      kycLevel: level,
      kycStatus: level >= 2 ? "VERIFIED" : "VERIFIED",
      kycVerifiedAt: new Date(),
      isVerified: true,
    },
  });

  return NextResponse.json({
    success: true,
    verifiedAt: result.verifiedAt,
    level,
    user: { id: user.id, name: user.name, email: user.email, language: user.language },
  });
}

export async function GET(req: NextRequest) {
  return verify(
    req.nextUrl.searchParams.get("uid") ?? "",
    req.nextUrl.searchParams.get("code") ?? ""
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return verify(String(body.uid ?? ""), String(body.code ?? ""));
}
