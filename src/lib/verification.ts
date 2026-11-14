import { createHash, randomInt, timingSafeEqual } from "crypto";
import { spawn } from "child_process";
import { prisma } from "@/lib/prisma";

export type VerificationChannel = "EMAIL" | "PHONE" | "WHATSAPP";

export const VERIFICATION_CHANNELS: Record<VerificationChannel, { label: string; hint: string }> = {
  EMAIL: { label: "E-mail", hint: "Un code à 6 chiffres est envoyé à votre adresse e-mail." },
  PHONE: { label: "SMS", hint: "Un code à 6 chiffres est envoyé par SMS au numéro indiqué." },
  WHATSAPP: { label: "WhatsApp", hint: "Un code à 6 chiffres est envoyé sur WhatsApp." },
};

function secret() {
  return process.env.KYC_CODE_SECRET ?? process.env.NEXTAUTH_SECRET ?? "tchoua-kyc";
}

export function hashCode(code: string) {
  return createHash("sha256").update(`${code}:${secret()}`).digest("hex");
}

export function normalizeCode(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

export function isPhoneTarget(value: string) {
  return /^\+?[0-9][0-9 .-]{7,19}$/.test(value.trim());
}

async function deliverEmail(to: string, code: string) {
  const from = process.env.KYC_EMAIL_FROM ?? "Tchoua <no-reply@tchoua.com>";
  const subject = "Votre code de vérification Tchoua";
  const text = [
    "Bonjour,",
    "",
    `Votre code de vérification Tchoua est : ${code}`,
    "",
    "Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
    "",
    "— Tchoua, la plateforme des tontines et associations",
  ].join("\n");
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
  ].join("\r\n");

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("/usr/sbin/sendmail", ["-t"], { stdio: ["pipe", "ignore", "pipe"] });
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("sendmail timeout"));
      }, 15_000);
      child.on("error", (error) => { clearTimeout(timer); reject(error); });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`sendmail exited with ${code}`));
      });
      child.stdin.write(message);
      child.stdin.end();
    });
    return true;
  } catch (error) {
    console.error("[KYC][EMAIL] sendmail failed", error);
    return false;
  }
}

async function deliverWebhook(channel: "PHONE" | "WHATSAPP", to: string, code: string) {
  const url = channel === "WHATSAPP"
    ? process.env.KYC_WHATSAPP_WEBHOOK_URL
    : process.env.KYC_SMS_WEBHOOK_URL;
  if (!url) return false;

  const token = process.env.KYC_MESSAGING_TOKEN;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      channel,
      to,
      message: `Votre code de vérification Tchoua est ${code}. Il expire dans 10 minutes.`,
      code,
    }),
  }).catch((error) => {
    console.error("[KYC][MESSAGING] webhook failed", error);
    return null;
  });

  return Boolean(response?.ok);
}

export async function sendVerificationCode(userId: string, channel: VerificationChannel, target: string) {
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const recentCount = await prisma.verificationCode.count({
    where: {
      userId,
      channel,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });
  if (recentCount >= 5) {
    return { ok: false as const, error: "Trop de demandes. Réessayez dans quelques minutes.", code: "RATE_LIMITED" };
  }

  let delivered = false;
  if (channel === "EMAIL") delivered = await deliverEmail(target, code);
  else delivered = await deliverWebhook(channel, target, code);

  const devMode = process.env.KYC_DEV_MODE === "1";
  if (!delivered && !devMode) {
    return {
      ok: false as const,
      error: channel === "EMAIL"
        ? "L'envoi d'e-mail n'est pas configuré sur ce serveur. Contactez l'administration."
        : "L'envoi SMS/WhatsApp n'est pas configuré. Choisissez l'e-mail ou contactez l'administration.",
      code: "DELIVERY_UNAVAILABLE",
    };
  }

  await prisma.verificationCode.create({
    data: { userId, channel, target, codeHash: hashCode(code), expiresAt },
  });

  return {
    ok: true as const,
    channel,
    target,
    expiresAt,
    delivered,
    ...(devMode ? { devCode: code } : {}),
  };
}

export async function confirmVerificationCode(userId: string, channel: VerificationChannel, value: string) {
  const code = normalizeCode(value);
  if (code.length !== 6) {
    return { ok: false as const, error: "Le code doit contenir 6 chiffres.", code: "INVALID_CODE" };
  }

  const record = await prisma.verificationCode.findFirst({
    where: { userId, channel, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false as const, error: "Aucun code valide. Demandez un nouveau code.", code: "CODE_EXPIRED" };
  }
  if (record.attempts >= 5) {
    return { ok: false as const, error: "Trop de tentatives. Demandez un nouveau code.", code: "TOO_MANY_ATTEMPTS" };
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const provided = Buffer.from(hashCode(code), "hex");
  const valid = expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!valid) {
    await prisma.verificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, error: "Code incorrect.", code: "INVALID_CODE" };
  }

  const now = new Date();
  const data: Record<string, unknown> = {};
  if (channel === "EMAIL") data.emailVerifiedAt = now;
  if (channel === "PHONE") {
    data.phoneVerifiedAt = now;
    if (isPhoneTarget(record.target) && !record.target.includes("*")) data.phone = record.target;
  }
  if (channel === "WHATSAPP") {
    data.whatsappVerifiedAt = now;
    data.phoneVerifiedAt = now;
    if (isPhoneTarget(record.target) && !record.target.includes("*")) data.phone = record.target;
  }
  const phone = (data as any).phone as string | undefined;
  delete (data as any).phone;

  await prisma.$transaction(async (tx) => {
    await tx.verificationCode.update({ where: { id: record.id }, data: { consumedAt: now } });
    await tx.user.update({ where: { id: userId }, data });
  });

  if (phone) {
    try {
      await prisma.user.update({ where: { id: userId }, data: { phone } });
    } catch (error: any) {
      // Le numéro peut déjà appartenir à un autre compte : la vérification
      // reste valable, mais on ne remplace pas le téléphone du profil.
      if (error?.code !== "P2002") console.error("[KYC][PHONE] update failed", error);
    }
  }

  return { ok: true as const, channel, verifiedAt: now };
}
