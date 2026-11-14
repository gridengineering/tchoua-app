import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getPlatformSettings } from "@/lib/platform-settings";

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: session.user.id, associationId: id } },
    select: { status: true },
  });
  if (!membership || membership.status === "LEFT") {
    return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  const settings = await getPlatformSettings();
  if (!settings.rtc.enabled || !settings.rtc.chatEnabled) {
    return NextResponse.json({ error: "Le partage de fichiers est désactivé." }, { status: 503 });
  }
  const allowedExtensions = new Set((settings.rtc.chatAllowedExtensions ?? []).map((value) => value.toLowerCase()));
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!allowedExtensions.has(ext) || !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
  }
  const maxSize = Math.max(1, Number(settings.rtc.chatFileMaxMb ?? 20)) * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)} Mo)` }, { status: 400 });
  }
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "storage", "chat", id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    url: `/api/associations/${id}/messages/file/${filename}`,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    isImage: file.type.startsWith("image/"),
  }, { status: 201 });
}
