import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendTransactionalEmail } from "@/lib/mailer";

export type FreeMemberInput = {
  firstName?: string;
  lastName?: string;
  name?: string;
  country?: string;
  city?: string;
  phone?: string;
  email?: string;
  language?: string;
  role?: string;
};

export type MemberInviteTokenPayload = {
  userId: string;
  associationId: string;
  membershipId: string;
  email?: string;
  phone?: string;
  exp: number;
};

function getInviteSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "tchoua-invite-secret-2026";
}

export function normalizeEmail(raw?: string | null): string | undefined {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v || !v.includes("@") || v.endsWith("@phone.tchoua.local")) return undefined;
  return v;
}

export function normalizePhone(raw?: string | null): string | undefined {
  const cleaned = String(raw ?? "").replace(/[^\d+]/g, "").trim();
  if (!cleaned || cleaned.replace(/\D/g, "").length < 6) return undefined;
  return cleaned;
}

export function createInviteToken(payload: Omit<MemberInviteTokenPayload, "exp">, ttlDays = 14): string {
  const full: MemberInviteTokenPayload = {
    ...payload,
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
  };
  const data = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = createHmac("sha256", getInviteSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyInviteToken(token: string): MemberInviteTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = createHmac("sha256", getInviteSecret()).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as MemberInviteTokenPayload;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildMemberInviteHtml(params: {
  memberName: string;
  associationName: string;
  inviterName: string;
  confirmUrl: string;
  existingAccount: boolean;
}): string {
  const { memberName, associationName, inviterName, confirmUrl, existingAccount } = params;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><title>Invitation Tchoua</title></head>
<body style="margin:0;padding:0;background:#f7f3eb;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#0d3d28;padding:24px 28px;color:#ffffff;">
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">Tchoua</div>
            <div style="font-size:12px;color:#fbbf24;text-transform:uppercase;letter-spacing:1.2px;margin-top:4px;">Solidarité Digitale</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h2 style="margin:0 0 12px;color:#0d3d28;font-size:20px;">Bonjour ${memberName},</h2>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
              <strong>${inviterName}</strong> vous invite à rejoindre l'association <strong>${associationName}</strong> sur la plateforme <strong>Tchoua</strong>.
            </p>
            <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#4b5563;">
              ${existingAccount
                ? "Un compte Tchoua existant est déjà associé à vos coordonnées. Confirmez votre accès ci-dessous pour activer votre adhésion et valider votre niveau KYC1."
                : "Confirmez votre accès en un clic pour activer votre compte Tchoua, passer automatiquement au niveau KYC1 et accéder à votre association sur le Web ou l'application mobile."}
            </p>
            <div style="text-align:center;margin:26px 0;">
              <a href="${confirmUrl}" style="display:inline-block;background:#0d3d28;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">
                Confirmer mon accès &amp; activer KYC1
              </a>
            </div>
            <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
              Vous pouvez également télécharger l'application mobile sur <a href="https://www.tchoua.com/mobile" style="color:#0d3d28;font-weight:600;">www.tchoua.com/mobile</a>.<br/>
              Si le bouton ne fonctionne pas, copiez ce lien : <span style="word-break:break-all;color:#374151;">${confirmUrl}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 28px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
            Tchoua — Gestion moderne de tontines et d'associations · www.tchoua.com
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function inviteOrAttachMember(
  prisma: PrismaClient,
  params: {
    associationId: string;
    actorUserId: string;
    input: FreeMemberInput;
    baseUrl?: string;
  }
) {
  const { associationId, actorUserId, input, baseUrl = "https://www.tchoua.com" } = params;
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (!email && !phone) {
    throw new Error("CONTACT_REQUIRED");
  }

  const fullName =
    [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(" ") ||
    input.name?.trim() ||
    email?.split("@")[0] ||
    phone ||
    "Nouveau Membre";

  const location = [input.city?.trim(), input.country?.trim()].filter(Boolean).join(", ") || null;
  const language = (input.language || "fr").trim().toLowerCase().slice(0, 12);

  const [association, inviter] = await Promise.all([
    prisma.association.findUnique({ where: { id: associationId }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: actorUserId }, select: { name: true } }),
  ]);
  if (!association) throw new Error("ASSOCIATION_NOT_FOUND");

  const orClauses: Array<{ email?: string; phone?: string }> = [];
  if (email) orClauses.push({ email });
  if (phone) orClauses.push({ phone });

  let user = await prisma.user.findFirst({
    where: { OR: orClauses },
    select: { id: true, email: true, phone: true, name: true, kycLevel: true },
  });

  const existingAccount = Boolean(user);

  if (!user) {
    const digits = (phone || randomBytes(6).toString("hex")).replace(/\D/g, "");
    const userEmail = email || `phone-${digits}@phone.tchoua.local`;
    const randomPass = await bcrypt.hash(randomBytes(16).toString("hex"), 10);

    user = await prisma.user.create({
      data: {
        email: userEmail,
        phone: phone || null,
        name: fullName,
        password: randomPass,
        location,
        language,
        role: "MEMBER",
        isActive: true,
        kycLevel: 0,
      },
      select: { id: true, email: true, phone: true, name: true, kycLevel: true },
    });
  }

  let membership = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: user.id, associationId } },
  });

  if (membership && membership.status === "ACTIVE") {
    return {
      status: "ALREADY_MEMBER" as const,
      existingAccount,
      user,
      membership,
      emailSent: false,
      whatsappUrl: null,
      smsUrl: null,
      confirmUrl: null,
    };
  }

  if (!membership) {
    membership = await prisma.associationMembership.create({
      data: {
        userId: user.id,
        associationId,
        role: input.role || "MEMBER",
        status: "PENDING",
      },
    });
  } else {
    membership = await prisma.associationMembership.update({
      where: { id: membership.id },
      data: { status: "PENDING" },
    });
  }

  const token = createInviteToken({
    userId: user.id,
    associationId,
    membershipId: membership.id,
    email,
    phone,
  });
  const confirmUrl = `${baseUrl}/invite/confirm?token=${encodeURIComponent(token)}`;
  const inviterName = inviter?.name || "Le bureau";

  let emailSent = false;
  if (email) {
    const html = buildMemberInviteHtml({
      memberName: user.name || fullName,
      associationName: association.name,
      inviterName,
      confirmUrl,
      existingAccount,
    });
    emailSent = await sendTransactionalEmail({
      to: email,
      subject: `Invitation à rejoindre ${association.name} sur Tchoua`,
      text: `Bonjour ${user.name || fullName}, ${inviterName} vous invite à rejoindre ${association.name} sur Tchoua. Confirmez votre accès et activez votre KYC1 : ${confirmUrl}`,
      html,
    });
  }

  const phoneDigits = (phone || user.phone || "").replace(/\D/g, "");
  const inviteText = `Bonjour ${user.name || fullName}, ${inviterName} vous invite à rejoindre l'association "${association.name}" sur Tchoua. Confirmez votre accès ici : ${confirmUrl}`;
  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(inviteText)}`
    : null;
  const smsUrl = phone || user.phone
    ? `sms:${phone || user.phone}?body=${encodeURIComponent(inviteText)}`
    : null;

  return {
    status: existingAccount ? ("INVITED_EXISTING" as const) : ("CREATED_AND_INVITED" as const),
    existingAccount,
    user,
    membership,
    emailSent,
    whatsappUrl,
    smsUrl,
    confirmUrl,
  };
}

/**
 * Parse CSV (Excel/Google Sheets) ou vCard (.vcf) en liste normalisée de membres.
 */
export function parseMembersImportPayload(content: string, fileName = ""): FreeMemberInput[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  if (fileName.toLowerCase().endsWith(".vcf") || trimmed.includes("BEGIN:VCARD")) {
    const cards = trimmed.split(/BEGIN:VCARD/i).slice(1);
    return cards
      .map((card) => {
        const fn = card.match(/^FN[^:]*:(.+)$/im)?.[1]?.trim();
        const tel = card.match(/^TEL[^:]*:(.+)$/im)?.[1]?.trim();
        const email = card.match(/^EMAIL[^:]*:(.+)$/im)?.[1]?.trim();
        return { name: fn, phone: tel, email };
      })
      .filter((m) => normalizeEmail(m.email) || normalizePhone(m.phone));
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const sep = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/["']/g, ""));

  const idxOf = (...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));
  const iLast = idxOf("nom", "last");
  const iFirst = idxOf("prenom", "prénom", "first");
  const iName = idxOf("name", "complet");
  const iEmail = idxOf("email", "mail", "courriel");
  const iPhone = idxOf("mobile", "tel", "phone", "whatsapp");
  const iCountry = idxOf("pays", "country");
  const iCity = idxOf("ville", "city");
  const iLang = idxOf("lang", "langue");

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      return {
        lastName: iLast >= 0 ? cols[iLast] : undefined,
        firstName: iFirst >= 0 ? cols[iFirst] : undefined,
        name: iName >= 0 ? cols[iName] : undefined,
        email: iEmail >= 0 ? cols[iEmail] : undefined,
        phone: iPhone >= 0 ? cols[iPhone] : undefined,
        country: iCountry >= 0 ? cols[iCountry] : undefined,
        city: iCity >= 0 ? cols[iCity] : undefined,
        language: iLang >= 0 ? cols[iLang] : undefined,
      };
    })
    .filter((m) => normalizeEmail(m.email) || normalizePhone(m.phone));
}
