import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { extname, join, normalize, resolve } from "path";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv; charset=utf-8",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path ?? [];
  if (!parts.length || parts.some((part) => part === ".." || part.includes("/") || part.includes("\\"))) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }
  const root = resolve(process.cwd(), "public", "uploads");
  const file = resolve(root, normalize(parts.join("/")));
  if (!file.startsWith(`${root}/`)) return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  try {
    const data = await readFile(file);
    const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${parts[parts.length - 1]}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
