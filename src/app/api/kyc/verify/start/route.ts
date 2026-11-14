import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode, isPhoneTarget, type VerificationChannel } from "@/lib/verification";

const CHANNELS: VerificationChannel[] = ["EMAIL", "PHONE", "WHATSAPP"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const channel = String(body.channel ?? "").toUpperCase() as VerificationChannel;
  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Canal de vérification invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, phone: true, emailVerifiedAt: true, phoneVerifiedAt: true, whatsappVerifiedAt: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  let target = "";
  if (channel === "EMAIL") {
    target = user.email;
    if (user.emailVerifiedAt) return NextResponse.json({ error: "Votre e-mail est déjà vérifié", already: true }, { status: 409 });
  } else {
    target = String(body.target ?? user.phone ?? "").trim();
    if (!isPhoneTarget(target) || target.includes("*")) {
      return NextResponse.json({ error: "Saisissez un numéro de téléphone valide au format international." }, { status: 400 });
    }
    if (channel === "WHATSAPP" && user.whatsappVerifiedAt) {
      return NextResponse.json({ error: "Votre WhatsApp est déjà vérifié", already: true }, { status: 409 });
    }
    if (channel === "PHONE" && user.phoneVerifiedAt) {
      return NextResponse.json({ error: "Votre téléphone est déjà vérifié", already: true }, { status: 409 });
    }
  }

  const result = await sendVerificationCode(session.user.id, channel, target);
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: 503 });

  return NextResponse.json({
    success: true,
    channel,
    target: result.target,
    expiresAt: result.expiresAt,
    delivered: result.delivered,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
