import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, hasPermission } from "@/lib/permissions";
import { readFile } from "fs/promises";
import { join, resolve } from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const document = await prisma.kycDocument.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  let allowed = document.userId === session.user.id || isSuperAdmin(session);
  if (!allowed) {
    const targetMemberships = await prisma.associationMembership.findMany({
      where: { userId: document.userId, status: { not: "LEFT" } },
      select: { associationId: true },
    });
    for (const target of targetMemberships) {
      const actor = await prisma.associationMembership.findUnique({
        where: { userId_associationId: { userId: session.user.id, associationId: target.associationId } },
        include: { customRole: true },
      });
      if (actor && actor.status !== "LEFT" && hasPermission(session, actor, "MANAGE_MEMBERS")) {
        allowed = true;
        break;
      }
    }
  }

  if (!allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const root = resolve(process.cwd(), "storage");
  const absolute = resolve(process.cwd(), document.filePath);
  if (!absolute.startsWith(root + "/")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  try {
    const data = await readFile(absolute);
    return new NextResponse(data, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${document.label.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
