import nodemailer from "nodemailer";
import { getGovernanceConfig } from "@/lib/governance";
import type { EmailConfig } from "@/lib/governance-types";
import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect } from "node:tls";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
};

/**
 * Envoi transactionnel via la configuration SMTP de la gouvernance.
 * Retourne false si la messagerie est désactivée ou si le serveur SMTP échoue ;
 * l'appelant peut alors utiliser son canal de secours.
 */
function smtpTransportOptions(account: EmailConfig["smtp"]) {
  // OVH (et la plupart des serveurs) : 465 = TLS direct, 587 = STARTTLS.
  // « secure=true » sur 587 ferait échouer nodemailer ; on normalise selon le port.
  const implicitTls = Number(account.port) === 465;
  return {
    host: account.host,
    port: Number(account.port) || 587,
    secure: implicitTls,
    requireTLS: !implicitTls,
    auth: account.user ? { user: account.user, pass: account.password } : undefined,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
  };
}

export async function sendTransactionalEmail(input: MailInput, override?: EmailConfig): Promise<boolean> {
  const { email: saved } = await getGovernanceConfig();
  const email = override ?? saved;
  if (!email.enabled || !email.smtp.enabled || !email.smtp.host) return false;

  try {
    const transporter = nodemailer.createTransport(smtpTransportOptions(email.smtp));
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

export async function verifyMailConfiguration(override?: EmailConfig) {
  const { email: saved } = await getGovernanceConfig();
  const email = override ?? saved;
  if (!email.smtp.enabled || !email.smtp.host) {
    return { ok: false, error: "SMTP désactivé ou hôte manquant" };
  }
  try {
    const transporter = nodemailer.createTransport(smtpTransportOptions(email.smtp));
    await transporter.verify();
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? "Connexion SMTP impossible" };
  }
}

export type MailCheck = { ok: boolean; label: string; error?: string };

function protocolLogin(host: string, port: number, protocol: "imap" | "pop3", user: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let socket: Socket | undefined;
    const timeout = setTimeout(() => { socket?.destroy(); reject(new Error("Délai de connexion dépassé")); }, 15_000);
    let buffer = "";
    let stage = 0;
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      try { socket?.destroy(); } catch {}
      error ? reject(error) : resolve();
    };
    const write = (line: string) => socket?.write(`${line}\r\n`);
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      if (protocol === "imap") {
        if (stage === 0 && /^\* OK/m.test(buffer)) {
          stage = 1; buffer = "";
          write(`a1 LOGIN ${JSON.stringify(user)} ${JSON.stringify(password)}`);
        } else if (stage === 1 && /^a1 (OK|NO|BAD)/m.test(buffer)) {
          const ok = /^a1 OK/m.test(buffer);
          write("a2 LOGOUT");
          finish(ok ? undefined : new Error("Identifiants IMAP refusés"));
        }
      } else {
        if (stage === 0 && /^\+OK/m.test(buffer)) {
          stage = 1; buffer = ""; write(`USER ${user}`);
        } else if (stage === 1 && /^\+OK/m.test(buffer)) {
          stage = 2; buffer = ""; write(`PASS ${password}`);
        } else if (stage === 2 && /^\+OK/m.test(buffer)) {
          write("QUIT"); finish();
        } else if (/^-ERR/m.test(buffer)) {
          finish(new Error("Identifiants POP3 refusés"));
        }
      }
    };
    try {
      socket = (port === 465 || port === 993 || port === 995)
        ? tlsConnect({ host, port, rejectUnauthorized: true }, () => {})
        : netConnect({ host, port }, () => {});
      socket.setTimeout(15_000, () => finish(new Error("Délai de connexion dépassé")));
      socket.on("data", onData);
      socket.on("error", (error) => finish(error));
    } catch (error: any) {
      finish(error);
    }
  });
}

export async function verifyEmailConfiguration(email: EmailConfig): Promise<{ smtp: MailCheck; imap: MailCheck; pop3: MailCheck }> {
  const smtp: MailCheck = { ok: false, label: "SMTP" };
  if (!email.smtp.enabled || !email.smtp.host) smtp.error = "SMTP désactivé ou hôte manquant";
  else {
    try {
      const transporter = nodemailer.createTransport(smtpTransportOptions(email.smtp));
      await transporter.verify();
      smtp.ok = true;
    } catch (error: any) { smtp.error = error?.message ?? "Connexion SMTP impossible"; }
  }
  const imap: MailCheck = { ok: false, label: "IMAP" };
  if (!email.imap.enabled || !email.imap.host) imap.error = "IMAP désactivé ou hôte manquant";
  else {
    try {
      await protocolLogin(email.imap.host, Number(email.imap.port), "imap", email.imap.user, email.imap.password);
      imap.ok = true;
    } catch (error: any) { imap.error = error?.message ?? "Connexion IMAP impossible"; }
  }
  const pop3: MailCheck = { ok: false, label: "POP3" };
  if (!email.pop3.enabled || !email.pop3.host) pop3.error = "POP3 désactivé ou hôte manquant";
  else {
    try {
      await protocolLogin(email.pop3.host, Number(email.pop3.port), "pop3", email.pop3.user, email.pop3.password);
      pop3.ok = true;
    } catch (error: any) { pop3.error = error?.message ?? "Connexion POP3 impossible"; }
  }
  return { smtp, imap, pop3 };
}
