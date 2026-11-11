import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const BUREAU_ROLES = ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "CENSOR"];
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

async function membership(associationId: string, userId: string) {
  return prisma.associationMembership.findFirst({
    where: { associationId, userId },
    select: { id: true, role: true, status: true, customRole: { select: { name: true } } },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const me = await membership(id, session.user.id);
  if (!me) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const documents = await prisma.assocDocument.findMany({
    where: { associationId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const me = await membership(id, session.user.id);
  if (!me || me.status !== "ACTIVE") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (!BUREAU_ROLES.includes(me.role)) {
    return NextResponse.json({ error: "Seul le bureau peut ajouter des documents" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const name = (form.get("name") as string) || file?.name || "Document";
  const type = (form.get("type") as string) || "AUTRE";

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "PDF, JPEG, PNG ou WEBP attendu" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });

  const dir = join(process.cwd(), "public", "uploads", "associations", id);
  await mkdir(dir, { recursive: true });
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const doc = await prisma.assocDocument.create({
    data: {
      associationId: id,
      name,
      type,
      url: `/uploads/associations/${id}/${filename}`,
      mimeType: file.type,
      fileSize: file.size,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
