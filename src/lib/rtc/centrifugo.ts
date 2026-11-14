import { createHmac } from "crypto";

export function centrifugoToken(userId: string, channels: string[], ttlSeconds = 3600) {
  const secret = process.env.CENTRIFUGO_TOKEN_HMAC_SECRET;
  if (!secret) throw new Error("CENTRIFUGO_TOKEN_HMAC_SECRET manquant");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      iat: now,
      exp: now + ttlSeconds,
      channels,
    })
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export async function publishAssociationEvent(associationId: string, channel: string, data: unknown) {
  const url = process.env.CENTRIFUGO_API_URL;
  const key = process.env.CENTRIFUGO_API_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/api/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify({ channel: `assoc:${associationId}:${channel}`, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
