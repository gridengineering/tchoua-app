/**
 * Passerelle Twilio pour les messages transactionnels Tchoua.
 *
 * Variables d'environnement :
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN (ou TWILIO_API_KEY / TWILIO_API_SECRET)
 * - TWILIO_SMS_FROM : numéro E.164 ou sender ID alphanumérique
 * - TWILIO_WHATSAPP_FROM : expéditeur WhatsApp, ex. whatsapp:+14155238886
 * - TWILIO_MESSAGING_SERVICE_SID (optionnel, prioritaire pour SMS)
 */

export type TwilioMessageInput = {
  channel: "SMS" | "WHATSAPP";
  to: string;
  body: string;
};

export type TwilioMessageResult =
  | { ok: true; sid: string; status: string; channel: "SMS" | "WHATSAPP"; to: string }
  | { ok: false; error: string; code?: string; channel: "SMS" | "WHATSAPP"; to: string };

function accountSid() {
  return process.env.TWILIO_ACCOUNT_SID?.trim() || "";
}

function authToken() {
  return process.env.TWILIO_AUTH_TOKEN?.trim() || "";
}

function apiKey() {
  return process.env.TWILIO_API_KEY?.trim() || "";
}

function apiSecret() {
  return process.env.TWILIO_API_SECRET?.trim() || "";
}

export function twilioConfigured(channel: "SMS" | "WHATSAPP") {
  return Boolean(accountSid() && (authToken() || (apiKey() && apiSecret())) && fromFor(channel));
}

export function normalizeTwilioPhone(value: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.toLowerCase().startsWith("whatsapp:")) return "whatsapp:" + normalizeTwilioPhone(raw.slice(9));
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("237")) return "+" + digits;
  if (digits.length <= 9) return "+237" + digits;
  return "+" + digits;
}

function fromFor(channel: "SMS" | "WHATSAPP") {
  const configured = channel === "WHATSAPP"
    ? process.env.TWILIO_WHATSAPP_FROM?.trim()
    : process.env.TWILIO_SMS_FROM?.trim();
  if (!configured) return "";
  if (channel === "WHATSAPP") {
    return configured.toLowerCase().startsWith("whatsapp:")
      ? configured
      : "whatsapp:" + normalizeTwilioPhone(configured);
  }
  return configured;
}

function authorization() {
  // Le jeton de compte est prioritaire : il couvre l'API Messages. La clé API
  // reste disponible pour les comptes où le jeton n'est pas exposé.
  const user = authToken() ? accountSid() : apiKey();
  const password = authToken() ? authToken() : apiSecret();
  return "Basic " + Buffer.from(`${user}:${password}`).toString("base64");
}

/**
 * Envoie un message via l'API REST Twilio. Aucun secret n'est journalisé.
 * Un échec est retourné, jamais transformé en succès silencieux.
 */
export async function sendTwilioMessage(input: TwilioMessageInput): Promise<TwilioMessageResult> {
  const to = input.channel === "WHATSAPP"
    ? "whatsapp:" + normalizeTwilioPhone(input.to.replace(/^whatsapp:/i, ""))
    : normalizeTwilioPhone(input.to);
  const from = fromFor(input.channel);
  const sid = accountSid();

  if (!sid) return { ok: false, error: "TWILIO_ACCOUNT_SID manquant.", code: "CONFIG_MISSING", channel: input.channel, to };
  if (!authToken() && !(apiKey() && apiSecret())) {
    return { ok: false, error: "Authentification Twilio manquante.", code: "CONFIG_MISSING", channel: input.channel, to };
  }
  if (!from) {
    return { ok: false, error: `Aucun expéditeur ${input.channel} configuré.`, code: "SENDER_MISSING", channel: input.channel, to };
  }

  const body = new URLSearchParams({ To: to, From: from, Body: input.body });
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (input.channel === "SMS" && messagingServiceSid) {
    body.set("MessagingServiceSid", messagingServiceSid);
    body.delete("From");
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: authorization(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("[TWILIO] message rejected", {
        channel: input.channel,
        to,
        httpStatus: response.status,
        code: data.code,
        message: data.message,
      });
      return {
        ok: false,
        error: data.message || `Twilio HTTP ${response.status}.`,
        code: data.code ? String(data.code) : `HTTP_${response.status}`,
        channel: input.channel,
        to,
      };
    }
    return {
      ok: true,
      sid: data.sid || "",
      status: data.status || "queued",
      channel: input.channel,
      to,
    };
  } catch (error: any) {
    console.error("[TWILIO] network error", { channel: input.channel, to, error: error?.message || String(error) });
    return { ok: false, error: "Réseau Twilio indisponible.", code: "NETWORK", channel: input.channel, to };
  }
}
