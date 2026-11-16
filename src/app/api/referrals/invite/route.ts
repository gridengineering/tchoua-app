import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/mailer";
import { normalizeEmail } from "@/lib/association/member-invite";

function buildDiscoveryHtml(inviterName: string, webUrl: string, mobileUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><title>Découvrez Tchoua</title></head>
<body style="margin:0;padding:0;background:#f7f3eb;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#0d3d28;padding:24px 28px;color:#ffffff;">
            <div style="font-size:22px;font-weight:800;">Tchoua · Solidarité Digitale</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h2 style="margin:0 0 12px;color:#0d3d28;">${inviterName} vous invite à découvrir Tchoua</h2>
            <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
              Gérez vos tontines, cotisations, prêts, aides solidaires et réunions en toute transparence sur Web ou Mobile.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${webUrl}" style="display:inline-block;background:#0d3d28;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:10px;margin:4px;">
                S&apos;inscrire sur le Web
              </a>
              <a href="${mobileUrl}" style="display:inline-block;background:#d97706;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:10px;margin:4px;">
                Télécharger l&apos;app Mobile
              </a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
  const shareText = `Rejoignez-moi sur Tchoua pour gérer nos associations et tontines ! Inscrivez-vous ici : ${shareUrl} ou téléchargez l'app mobile : ${mobileDownloadUrl}`;

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
  const shareText = `${user.name} vous invite à découvrir Tchoua ! Inscription Web : ${shareUrl} · App Mobile : ${mobileDownloadUrl}`;

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
      subject: `${user.name} vous invite à découvrir Tchoua`,
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
