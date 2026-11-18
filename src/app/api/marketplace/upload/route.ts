import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Image manquante." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format accepté : JPEG, PNG ou WEBP." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop volumineuse (max 5 Mo)." }, { status: 400 });
  }

  const dir = join(process.cwd(), "public", "uploads", "marketplace", session.user.id);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/marketplace/${session.user.id}/${filename}` }, { status: 201 });
}
