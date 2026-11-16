import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isPlatformAdmin } from "@/lib/permissions";
import { inviteOrAttachMember } from "@/lib/association/member-invite";

const BUREAU_ROLES = [
  "PRESIDENT",
  "FOUNDER",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const whereClause: any = { associationId };
    if (status) {
      whereClause.status = status;
    }

    const actor = await prisma.associationMembership.findUnique({
      where: { userId_associationId: { userId: session.user.id, associationId } },
      include: { customRole: true },
    });
    const canReviewKyc = Boolean(actor && hasPermission(session, actor, "MANAGE_MEMBERS"));

    const members = await prisma.associationMembership.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profession: true,
            avatar: true,
            kycLevel: true,
            kycStatus: true,
            ...(canReviewKyc
              ? {
                  kycRequests: {
                    where: { status: "PENDING" },
                    orderBy: { createdAt: "desc" as const },
                    take: 1,
                    select: { id: true, requestedLevel: true, createdAt: true },
                  },
                }
              : {}),
          },
        },
        customRole: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const actor = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId, status: "ACTIVE" },
    include: { customRole: true },
  });

  const allowed =
    isPlatformAdmin(session) ||
    (actor && (BUREAU_ROLES.includes(actor.role) || hasPermission(session, actor, "MANAGE_MEMBERS")));
  if (!allowed) {
    return NextResponse.json(
      { error: "Seuls les membres du bureau ou le fondateur peuvent ajouter un membre." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const result = await inviteOrAttachMember(prisma, {
      associationId,
      actorUserId: session.user.id,
      input: body,
      baseUrl: req.nextUrl.origin || "https://www.tchoua.com",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err?.message === "CONTACT_REQUIRED") {
      return NextResponse.json(
        { error: "Le numéro mobile ou l'adresse email est obligatoire." },
        { status: 400 }
      );
    }
    if (err?.message === "ASSOCIATION_NOT_FOUND") {
      return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
    }
    console.error("Add member error:", err);
    return NextResponse.json({ error: "Erreur lors de l'ajout du membre" }, { status: 500 });
  }
}
