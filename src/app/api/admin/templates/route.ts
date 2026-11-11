import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const guard = await requireSystemAdmin("TEMPLATES", "READ");
  if (!guard.ok) return guard.response;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const templates = await prisma.associationTemplate.findMany({
      orderBy: { usageCount: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[GET /api/admin/templates]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireSystemAdmin("TEMPLATES", "CREATE");
  if (!guard.ok) return guard.response;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const { name, description, category, reglementHtml, visibility } = body;

    const template = await prisma.associationTemplate.create({
      data: {
        name,
        description,
        category,
        reglementHtml: typeof reglementHtml === "string" ? reglementHtml : JSON.stringify(reglementHtml),
        visibility: visibility || "PUBLIC",
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "TEMPLATE_CREATE",
        entity: "TEMPLATE",
        entityId: template.id,
        details: `Création du modèle d'association: ${name}`,
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/templates]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/templates — mettre à jour / publier / archiver un modèle
export async function PATCH(request: NextRequest) {
  const guard = await requireSystemAdmin("TEMPLATES", "UPDATE");
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { id, name, description, category, visibility, isActive, iconEmoji, color } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const template = await prisma.associationTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(iconEmoji !== undefined ? { iconEmoji } : {}),
        ...(color !== undefined ? { color } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: guard.user.id,
        action: "TEMPLATE_UPDATE",
        entity: "TEMPLATE",
        entityId: id,
        details: `Mise à jour du modèle ${template.name} (visible: ${template.visibility}, actif: ${template.isActive})`,
      },
    }).catch(() => {});

    return NextResponse.json({ template });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }
    console.error("[PATCH /api/admin/templates]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
