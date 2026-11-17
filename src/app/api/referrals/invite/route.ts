import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/mailer";
import { normalizeEmail } from "@/lib/association/member-invite";

import { buildInviteLandingHtml } from "@/lib/email-templates/invite";

function buildDiscoveryHtml(inviterName: string, webUrl: string, mobileUrl: string): string {
  return buildInviteLandingHtml({ inviterName, webUrl, mobileUrl, mode: "DISCOVERY" });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, referralCode: true, score: true, level: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const shareUrl = `https://www.tchoua.com/register?ref=${encodeURIComponent(user.referralCode)}`;
  const mobileDownloadUrl = "https://www.tchoua.com/mobile";
  const shareText = `Rejoignez-moi sur Tchoua : tontines transparentes, cotisations suivies, prêts, aides et réunions dans un seul espace sécurisé. Créez votre compte gratuitement : ${shareUrl} · Application mobile : ${mobileDownloadUrl}`;

  return NextResponse.json({
    referralCode: user.referralCode,
    shareUrl,
    mobileDownloadUrl,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    score: user.score,
    level: user.level,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, referralCode: true, score: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const channel = String(body.channel ?? "EMAIL").toUpperCase();
  const rawEmails: string[] = Array.isArray(body.emails) ? body.emails : [];
  const rawContacts: Array<{ name?: string; email?: string; phone?: string }> = Array.isArray(body.contacts)
    ? body.contacts
    : [];

  const shareUrl = `https://www.tchoua.com/register?ref=${encodeURIComponent(user.referralCode)}`;
  const mobileDownloadUrl = "https://www.tchoua.com/mobile";
  const shareText = `${user.name} vous invite à découvrir Tchoua, la plateforme qui digitalise la solidarité : tontines, cotisations, prêts, aides et réunions. Inscription gratuite : ${shareUrl} · App Mobile : ${mobileDownloadUrl}`;

  if (channel === "WHATSAPP") {
    const pointsAwarded = 15;
    const updated = await prisma.$transaction(async (tx) => {
      await tx.scoringRecord.create({
        data: {
          userId: user.id,
          points: pointsAwarded,
          reason: "Partage de lien de découverte Tchoua via WhatsApp",
          category: "REFERRAL",
        },
      });
      return tx.user.update({
        where: { id: user.id },
        data: { score: { increment: pointsAwarded } },
        select: { score: true, level: true },
      });
    });

    return NextResponse.json({
      ok: true,
      pointsAwarded,
      newScore: updated.score,
      shareUrl,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    });
  }

  const validEmails = Array.from(
    new Set(
      [
        ...rawEmails,
        ...rawContacts.map((c) => c.email ?? ""),
      ]
        .map((e) => normalizeEmail(e))
        .filter((e): e is string => Boolean(e))
    )
  ).slice(0, 5);

  const contactPhones = rawContacts.filter((c) => c.phone && !normalizeEmail(c.email)).slice(0, 5);

  if (validEmails.length === 0 && contactPhones.length === 0) {
    return NextResponse.json(
      { error: "Fournissez jusqu'à 5 adresses email valides ou des contacts téléphoniques." },
      { status: 400 }
    );
  }

  let sentCount = 0;
  for (const email of validEmails) {
    const sent = await sendTransactionalEmail({
      to: email,
      subject: `${user.name} vous invite à découvrir Tchoua — la solidarité en mieux`,
      text: shareText,
      html: buildDiscoveryHtml(user.name, shareUrl, mobileDownloadUrl),
    });
    if (sent) sentCount++;
  }

  const totalInvited = validEmails.length + contactPhones.length;
  const pointsAwarded = totalInvited * 10;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.scoringRecord.create({
      data: {
        userId: user.id,
        points: pointsAwarded,
        reason: `Invitation de ${totalInvited} contact(s) à découvrir Tchoua`,
        category: "REFERRAL",
      },
    });
    return tx.user.update({
      where: { id: user.id },
      data: { score: { increment: pointsAwarded } },
      select: { score: true, level: true },
    });
  });

  return NextResponse.json({
    ok: true,
    invitedCount: totalInvited,
    emailsSent: sentCount,
    pointsAwarded,
    newScore: updated.score,
    shareUrl,
    whatsappLinks: contactPhones.map((c) => ({
      name: c.name || c.phone,
      whatsappUrl: `https://wa.me/${String(c.phone).replace(/\D/g, "")}?text=${encodeURIComponent(shareText)}`,
    })),
  });
}
