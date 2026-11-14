import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONSENT_DOCUMENTS, CONSENT_KEYS, CONSENT_VERSION, type ConsentKey } from "@/lib/consents";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows = await prisma.platformConsent.findMany({
    where: { userId: session.user.id, version: CONSENT_VERSION },
    select: { document: true, acceptedAt: true },
  });

  const accepted = new Set(rows.map((r) => r.document));
  return NextResponse.json({
    version: CONSENT_VERSION,
    documents: CONSENT_DOCUMENTS.map((doc) => ({
      ...doc,
      accepted: accepted.has(doc.key),
      acceptedAt: rows.find((r) => r.document === doc.key)?.acceptedAt ?? null,
    })),
    complete: CONSENT_KEYS.every((key) => accepted.has(key)),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const requested: ConsentKey[] = Array.isArray(body.documents)
    ? body.documents.filter((d: unknown): d is ConsentKey => CONSENT_KEYS.includes(d as ConsentKey))
    : CONSENT_KEYS;

  const missing = CONSENT_KEYS.filter((key) => !requested.includes(key));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Toutes les conditions et politiques doivent être acceptées", missing },
      { status: 400 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  await prisma.platformConsent.createMany({
    data: CONSENT_KEYS.map((document) => ({
      userId: session.user.id,
      document,
      version: CONSENT_VERSION,
      ip,
      userAgent,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true, version: CONSENT_VERSION, complete: true });
}
