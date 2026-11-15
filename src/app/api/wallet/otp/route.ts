import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/verification";

/** Envoie un code de confirmation par e-mail pour une opération wallet sensible. */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!user?.email) return NextResponse.json({ error: "Aucune adresse e-mail sur ce compte." }, { status: 400 });

  const result = await sendVerificationCode(session.user.id, "EMAIL", user.email);
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  return NextResponse.json({ ok: true, target: result.target, expiresAt: result.expiresAt });
}
