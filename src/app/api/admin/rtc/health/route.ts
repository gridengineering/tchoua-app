import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { createSocket } from "dgram";

type Check = { name: string; ok: boolean; error?: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Délai dépassé")), ms)),
  ]);
}

async function httpCheck(name: string, url: string, expectedStatus?: number): Promise<Check> {
  try {
    const res = await withTimeout(
      fetch(url, { method: "GET", redirect: "follow", cache: "no-store" }),
      6000
    );
    if (expectedStatus && res.status !== expectedStatus && res.status >= 500) {
      return { name, ok: false, error: `HTTP ${res.status}` };
    }
    return { name, ok: true };
  } catch (error: any) {
    return { name, ok: false, error: error?.message ?? "Injoignable" };
  }
}

function stunCheck(name: string, stunUrl: string): Promise<Check> {
  return new Promise((resolve) => {
    const match = stunUrl.match(/^stun:([^:?]+)(?::(\d+))?/i);
    if (!match) {
      resolve({ name, ok: false, error: "URL STUN invalide" });
      return;
    }
    const host = match[1];
    const port = Number(match[2] ?? 3478);
    const socket = createSocket("udp4");
    let settled = false;
    const finish = (check: Check) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.close();
      resolve(check);
    };
    const timer = setTimeout(() => finish({ name, ok: false, error: "Pas de réponse STUN" }), 4000);
    socket.on("error", (error) => finish({ name, ok: false, error: error.message }));
    socket.on("message", () => finish({ name, ok: true }));
    try {
      const transaction = Buffer.from(Array.from({ length: 12 }, () => Math.floor(Math.random() * 256)));
      const packet = Buffer.concat([
        Buffer.from([0x00, 0x01, 0x00, 0x00, 0x21, 0x12, 0xa4, 0x42]),
        transaction,
      ]);
      socket.send(packet, port, host);
    } catch (error: any) {
      finish({ name, ok: false, error: error?.message ?? "Envoi STUN impossible" });
    }
  });
}

export async function GET() {
  const guard = await requireSystemAdmin("SETTINGS", "READ");
  if (!guard.ok) return guard.response;

  const settings = await getPlatformSettings();
  const rtc = settings.rtc;
  const checks: Check[] = [
    { name: "Service RTC activé", ok: rtc.enabled },
    { name: "Jitsi — secret JWT configuré", ok: Boolean(process.env.JITSI_JWT_APP_SECRET) },
    { name: "Centrifugo — clé API configurée", ok: Boolean(process.env.CENTRIFUGO_API_KEY) },
    { name: "Centrifugo — secret HMAC configuré", ok: Boolean(process.env.CENTRIFUGO_TOKEN_HMAC_SECRET) },
  ];

  if (rtc.jitsiUrl) checks.push(await httpCheck("Jitsi Meet", rtc.jitsiUrl));
  if (rtc.chatApiUrl) checks.push(await httpCheck("Centrifugo — API", rtc.chatApiUrl));
  if (rtc.stunUrl) checks.push(await stunCheck("TURN / STUN", rtc.stunUrl));

  return NextResponse.json({
    ok: checks.every((check) => check.ok),
    checks,
    checkedAt: new Date().toISOString(),
  });
}
