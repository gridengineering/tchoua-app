import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId } = await params;
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId, status: { not: "LEFT" } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX) return NextResponse.json({ error: "Fichier trop volumineux (8 Mo maximum)" }, { status: 413 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Formats acceptés : JPG, PNG, WEBP ou PDF" }, { status: 415 });

  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const dir = join(process.cwd(), "public", "uploads", "associations", associationId, "preuves");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomUUID()}.${ext}`;
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/associations/${associationId}/preuves/${name}`, name: file.name, size: file.size, mimeType: file.type }, { status: 201 });
}
