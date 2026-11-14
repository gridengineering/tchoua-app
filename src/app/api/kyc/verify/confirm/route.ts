import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { confirmVerificationCode, type VerificationChannel } from "@/lib/verification";

const CHANNELS: VerificationChannel[] = ["EMAIL", "PHONE", "WHATSAPP"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const channel = String(body.channel ?? "").toUpperCase() as VerificationChannel;
  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Canal de vérification invalide" }, { status: 400 });
  }

  const result = await confirmVerificationCode(session.user.id, channel, body.code);
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });

  return NextResponse.json({ success: true, channel: result.channel, verifiedAt: result.verifiedAt });
}
