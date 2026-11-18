import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type DeveloperAuth = {
  userId: string;
  user: { id: string; name: string; email: string };
  via: "SESSION" | "API_KEY";
};

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Authentifie un développeur externe :
 * - session NextAuth pour le portail ;
 * - ou clé API `Authorization: Bearer tchoua_dev_<prefix>_<secret>`.
 */
export async function authenticateDeveloper(req: Request): Promise<DeveloperAuth | null> {
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (bearer.startsWith("tchoua_dev_")) {
    const parts = bearer.split("_");
    const prefix = parts[2];
    if (!prefix) return null;
    const key = await prisma.developerApiKey.findFirst({
      where: { prefix, revokedAt: null },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!key) return null;
    const given = Buffer.from(hashKey(bearer));
    const expected = Buffer.from(key.keyHash);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    await prisma.developerApiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => null);
    return { userId: key.userId, user: key.user, via: "API_KEY" };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      name: session.user.name || session.user.email || "Développeur",
      email: session.user.email || "",
    },
    via: "SESSION",
  };
}

export function generateDeveloperKey() {
  const prefix = Math.random().toString(36).slice(2, 10);
  const secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const raw = `tchoua_dev_${prefix}_${secret}`;
  return { raw, prefix, hash: hashKey(raw) };
}
