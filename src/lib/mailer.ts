import nodemailer from "nodemailer";
import { getGovernanceConfig } from "@/lib/governance";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{ filename: string; path: string }>;
};

/**
 * Envoi transactionnel via la configuration SMTP de la gouvernance.
 * Retourne false si la messagerie est désactivée ou si le serveur SMTP échoue ;
 * l'appelant peut alors utiliser son canal de secours.
 */
export async function sendTransactionalEmail(input: MailInput): Promise<boolean> {
  const { email } = await getGovernanceConfig();
  if (!email.enabled || !email.smtp.enabled || !email.smtp.host) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: email.smtp.host,
      port: email.smtp.port,
      secure: email.smtp.secure,
      auth: email.smtp.user ? { user: email.smtp.user, pass: email.smtp.password } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transporter.sendMail({
      from: `${email.fromName} <${email.fromEmail}>`,
      replyTo: email.replyTo || undefined,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
    });
    return true;
  } catch (error) {
    console.error("[MAIL] SMTP send failed", error);
    return false;
  }
}

export async function verifyMailConfiguration() {
  const { email } = await getGovernanceConfig();
  if (!email.smtp.enabled || !email.smtp.host) {
    return { ok: false, error: "SMTP désactivé ou hôte manquant" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: email.smtp.host,
      port: email.smtp.port,
      secure: email.smtp.secure,
      auth: email.smtp.user ? { user: email.smtp.user, pass: email.smtp.password } : undefined,
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
    });
    await transporter.verify();
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? "Connexion SMTP impossible" };
  }
}
