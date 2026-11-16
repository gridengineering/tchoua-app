import { randomInt } from "crypto";
import { spawn } from "child_process";
import { prisma } from "@/lib/prisma";
import { hashCode } from "@/lib/verification";
import { sendTransactionalEmail } from "@/lib/mailer";
import { normalizeLanguage, type SupportedLanguage } from "@/lib/identity";

const COPY: Record<SupportedLanguage, {
  subject: string;
  title: string;
  hello: string;
  intro: string;
  codeLabel: string;
  button: string;
  expiry: string;
  ignore: string;
  footer: string;
}> = {
  fr: {
    subject: "Confirmez votre adresse e-mail — Tchoua",
    title: "Confirmez votre adresse e-mail",
    hello: "Bonjour",
    intro: "Merci d’avoir créé votre compte Tchoua. Confirmez votre adresse e-mail pour activer votre niveau KYC 1 et accéder à toutes les fonctionnalités de votre association.",
    codeLabel: "Votre code de confirmation",
    button: "Confirmer mon adresse",
    expiry: "Ce lien et ce code expirent dans 10 minutes.",
    ignore: "Si vous n’êtes pas à l’origine de cette inscription, ignorez cet e-mail : votre compte reste inactif pour les opérations sensibles.",
    footer: "Tchoua — La solidarité digitalisée · www.tchoua.com",
  },
  en: {
    subject: "Confirm your email address — Tchoua",
    title: "Confirm your email address",
    hello: "Hello",
    intro: "Thank you for creating your Tchoua account. Confirm your email address to activate KYC level 1 and access all the features of your association.",
    codeLabel: "Your confirmation code",
    button: "Confirm my email",
    expiry: "This link and code expire in 10 minutes.",
    ignore: "If you did not create this account, ignore this email: your account remains restricted for sensitive operations.",
    footer: "Tchoua — Solidarity, digitized · www.tchoua.com",
  },
  es: {
    subject: "Confirma tu correo electrónico — Tchoua",
    title: "Confirma tu correo electrónico",
    hello: "Hola",
    intro: "Gracias por crear tu cuenta Tchoua. Confirma tu correo electrónico para activar el nivel KYC 1 y acceder a todas las funciones de tu asociación.",
    codeLabel: "Tu código de confirmación",
    button: "Confirmar mi correo",
    expiry: "Este enlace y este código caducan en 10 minutos.",
    ignore: "Si no creaste esta cuenta, ignora este correo: tu cuenta permanece restringida para operaciones sensibles.",
    footer: "Tchoua — La solidaridad digitalizada · www.tchoua.com",
  },
  de: {
    subject: "Bestätigen Sie Ihre E-Mail-Adresse — Tchoua",
    title: "Bestätigen Sie Ihre E-Mail-Adresse",
    hello: "Hallo",
    intro: "Vielen Dank für die Erstellung Ihres Tchoua-Kontos. Bestätigen Sie Ihre E-Mail-Adresse, um KYC-Stufe 1 zu aktivieren und alle Funktionen Ihres Vereins zu nutzen.",
    codeLabel: "Ihr Bestätigungscode",
    button: "Meine E-Mail bestätigen",
    expiry: "Dieser Link und dieser Code laufen in 10 Minuten ab.",
    ignore: "Wenn Sie dieses Konto nicht erstellt haben, ignorieren Sie diese E-Mail: Ihr Konto bleibt für sensible Vorgänge eingeschränkt.",
    footer: "Tchoua — Solidarität, digitalisiert · www.tchoua.com",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}

function buildHtml(params: {
  name: string;
  code: string;
  link: string;
  language: SupportedLanguage;
}) {
  const c = COPY[params.language];
  return `<!doctype html>
<html lang="${params.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f7f3eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3eb;padding:32px 14px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e0d4;border-radius:18px;overflow:hidden;">
<tr><td style="background:#0d3d28;padding:24px 28px;">
  <div style="font-size:24px;font-weight:900;letter-spacing:-.5px;color:#ffffff;">Tchoua</div>
  <div style="margin-top:3px;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#f0c56a;">La solidarité digitalisée</div>
</td></tr>
<tr><td style="padding:30px 28px 8px;">
  <h1 style="margin:0 0 12px;font-size:23px;line-height:1.2;color:#0d3d28;">${escapeHtml(c.title)}</h1>
  <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#374151;">${escapeHtml(c.hello)} ${escapeHtml(params.name)},</p>
  <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#4b5563;">${escapeHtml(c.intro)}</p>
  <div style="background:#f7f3eb;border:1px solid #e5e0d4;border-radius:14px;padding:16px;text-align:center;margin:0 0 22px;">
    <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a25;">${escapeHtml(c.codeLabel)}</div>
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:34px;font-weight:900;letter-spacing:7px;color:#0d3d28;margin:8px 0 2px;">${params.code}</div>
  </div>
  <div style="text-align:center;margin:0 0 22px;">
    <a href="${escapeHtml(params.link)}" style="display:inline-block;background:#0d3d28;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 26px;border-radius:11px;">${escapeHtml(c.button)}</a>
  </div>
  <p style="margin:0 0 8px;font-size:12px;line-height:1.55;color:#6b7280;">${escapeHtml(c.expiry)}</p>
  <p style="margin:0 0 20px;font-size:12px;line-height:1.55;color:#6b7280;">${escapeHtml(c.ignore)}</p>
</td></tr>
<tr><td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;line-height:1.5;color:#6b7280;">${escapeHtml(c.footer)}</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendHtmlEmail(to: string, subject: string, html: string) {
  if (await sendTransactionalEmail({ to, subject, text: subject, html })) return true;

  const webhook = process.env.KYC_EMAIL_WEBHOOK_URL;
  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.KYC_EMAIL_API_KEY ? { Authorization: `Bearer ${process.env.KYC_EMAIL_API_KEY}` } : {}),
      },
      body: JSON.stringify({ to, subject, html, text: subject }),
    }).catch(() => null);
    return Boolean(response?.ok);
  }

  const from = process.env.KYC_EMAIL_FROM ?? "Tchoua <no-reply@tchoua.com>";
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("/usr/sbin/sendmail", ["-t"], { stdio: ["pipe", "ignore", "pipe"] });
      const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("sendmail timeout")); }, 15_000);
      child.on("error", (error) => { clearTimeout(timer); reject(error); });
      child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`sendmail ${code}`)); });
      child.stdin.write(message);
      child.stdin.end();
    });
    return true;
  } catch (error) {
    console.error("[EMAIL][VERIFY] delivery failed", error);
    return false;
  }
}

export async function sendEmailVerification(params: {
  userId: string;
  email: string;
  name: string;
  language?: string | null;
  baseUrl?: string;
}) {
  const language = normalizeLanguage(params.language);
  const recent = await prisma.verificationCode.count({
    where: {
      userId: params.userId,
      channel: "EMAIL",
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });
  if (recent >= 5) return { ok: false as const, error: "Trop de demandes. Réessayez dans quelques minutes." };

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const base = (params.baseUrl ?? "https://www.tchoua.com").replace(/\/+$/, "");
  const link = `${base}/verify-email?uid=${encodeURIComponent(params.userId)}&code=${code}`;

  await prisma.verificationCode.create({
    data: {
      userId: params.userId,
      channel: "EMAIL",
      target: params.email,
      codeHash: hashCode(code),
      expiresAt,
    },
  });

  const delivered = await sendHtmlEmail(
    params.email,
    COPY[language].subject,
    buildHtml({ name: params.name, code, link, language })
  );

  return { ok: true as const, delivered, expiresAt };
}
