import { createHmac, timingSafeEqual } from "crypto";
import type { AppScope } from "@/lib/apps";

export type AppTokenPayload = {
  appId: string;
  slug: string;
  installationId: string;
  userId: string;
  associationId?: string | null;
  scope: AppScope;
  exp: number;
};

function secret() {
  return process.env.APP_SDK_SECRET || process.env.NEXTAUTH_SECRET || "tchoua-app-sdk-development-secret";
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

export function createAppToken(payload: AppTokenPayload) {
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyAppToken(token?: string | null): AppTokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const given = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (given.length !== expectedBuffer.length || !timingSafeEqual(given, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AppTokenPayload;
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
