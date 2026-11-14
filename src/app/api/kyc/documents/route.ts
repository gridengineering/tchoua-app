import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { join, basename } from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "application/pdf",
]);
const ALLOWED_TYPES = new Set([
  "ID_DOCUMENT", "PASSPORT_PHOTO", "LOCATION_PROOF", "UTILITY_BILL", "GOOGLE_MAPS", "OTHER",
]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const documents = await prisma.kycDocument.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, label: true, mimeType: true, size: true, status: true, createdAt: true, kycRequestId: true },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Le fichier doit faire moins de 8 Mo" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Formats acceptés : JPEG, PNG, WEBP ou PDF" }, { status: 400 });
  }

  const type = String(form?.get("type") ?? "OTHER").toUpperCase();
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
  }

  const root = join(process.cwd(), "storage", "kyc", session.user.id);
  await mkdir(root, { recursive: true });
  const safeName = basename(file.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const filename = `${randomUUID()}-${safeName}`;
  const absolutePath = join(root, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  const document = await prisma.kycDocument.create({
    data: {
      userId: session.user.id,
      type,
      label: String(form?.get("label") ?? file.name ?? "Document"),
      filePath: join("storage", "kyc", session.user.id, filename),
      mimeType: file.type,
      size: file.size,
      status: "PENDING",
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}
