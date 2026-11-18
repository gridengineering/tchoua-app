import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDeveloperKey } from "@/lib/apps/developer-auth";

async function sessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const keys = await prisma.developerApiKey.findMany({
    where: { userId },
    select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "Clé développeur").trim().slice(0, 80) || "Clé développeur";
  const generated = generateDeveloperKey();
  const key = await prisma.developerApiKey.create({
    data: { userId, name, prefix: generated.prefix, keyHash: generated.hash },
    select: { id: true, name: true, prefix: true, scopes: true, createdAt: true },
  });
  return NextResponse.json({ key, secret: generated.raw }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const updated = await prisma.developerApiKey.updateMany({
    where: { id, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ success: updated.count > 0 });
}
