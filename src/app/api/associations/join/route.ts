import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Connectez-vous pour rejoindre" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code d'invitation requis" }, { status: 400 });

  const settings = await getPlatformSettings();
  if (settings.allowRegistration === false) {
    return NextResponse.json({ error: "Les adhésions sont fermées" }, { status: 403 });
  }

  const association = await prisma.association.findFirst({
    where: { joinCode: code, status: "ACTIVE" },
    select: { id: true, name: true, parentId: true },
  });
  if (!association) return NextResponse.json({ error: "Code invalide ou association inactive" }, { status: 404 });

  const existing = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId: association.id },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.status === "PENDING" ? "Votre demande est déjà en attente" : "Vous êtes déjà membre", membership: existing },
      { status: 409 }
    );
  }

  const membership = await prisma.associationMembership.create({
    data: {
      userId: session.user.id,
      associationId: association.id,
      role: "MEMBER",
      status: "PENDING",
    },
  });

  let parentMembership = null;
  if (association.parentId) {
    const parent = await prisma.association.findUnique({
      where: { id: association.parentId },
      select: { id: true, status: true },
    });
    if (parent?.status === "ACTIVE") {
      const alreadyParent = await prisma.associationMembership.findFirst({
        where: { userId: session.user.id, associationId: parent.id },
      });
      if (!alreadyParent) {
        parentMembership = await prisma.associationMembership.create({
          data: { userId: session.user.id, associationId: parent.id, role: "MEMBER", status: "PENDING", notes: `Adhésion via ${association.name}` },
        });
      }
    }
  }

  return NextResponse.json({ membership, parentMembership, association }, { status: 201 });
}
