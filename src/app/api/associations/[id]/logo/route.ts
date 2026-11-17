import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureAssociationLogo } from "@/lib/association/default-logo";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const BUREAU = ["FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ", "AUDITOR", "SOLIDARITY_OFFICER"];
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX = 2 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const me = await prisma.associationMembership.findFirst({ where: { associationId: id, userId: session.user.id, status: "ACTIVE" }, select: { role: true } });
  if (!me || !BUREAU.includes(me.role)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
  const association = await prisma.association.findUnique({ where: { id }, select: { name: true, color: true, logo: true } });
  if (!association) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size <= 0 || file.size > MAX) return NextResponse.json({ error: "Fichier 2 Mo maximum" }, { status: 413 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Formats acceptés : PNG, JPG ou WEBP" }, { status: 415 });
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const dir = join(process.cwd(), "public", "uploads", "associations", id);
    await mkdir(dir, { recursive: true });
    const name = `logo-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/associations/${id}/${name}`;
    await prisma.association.update({ where: { id }, data: { logo: url } });
    return NextResponse.json({ logo: url }, { status: 201 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.generate === true || body.reset === true) {
    const logo = await ensureAssociationLogo({ ...association, id, force: true });
    return NextResponse.json({ logo, generated: true });
  }
  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
