import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const association = await prisma.association.findUnique({
    where: { id },
    include: {
      memberships: {
        where: { status: { not: "LEFT" } },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { joinedAt: "asc" },
      },
      activities: { orderBy: { sortOrder: "asc" } },
      meetings: {
        where: { scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      },
      documents: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      accounts: true,
      regulations: { orderBy: { articleNumber: "asc" } },
      parent: { select: { id: true, name: true } },
      _count: { select: { memberships: true, activities: true } },
    },
  });

  if (!association) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });

  const membership = await getMembership(session.user.id, id);

  if (!association.isPublic && !membership && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({ association, myRole: membership?.role ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  if (!hasPermission(session, membership, "EDIT_SETTINGS")) {
    return NextResponse.json({ error: "Permission EDIT_SETTINGS requise" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name, description, type, isPublic, color, logo, region, website, email, phone,
    reglementHtml, reglementUrl, bureauConfig, membershipConfig, meetingConfig,
    socialAidCaps, sanctionsConfig, bankConfig, status,
    parentId, parentSubscriptionFee, regulations,
    minKycLevel, requireRegulationApproval
  } = body;

  const association = await prisma.$transaction(async (tx) => {
    const updated = await tx.association.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(isPublic !== undefined && { isPublic }),
        ...(color !== undefined && { color }),
        ...(logo !== undefined && { logo }),
        ...(region !== undefined && { region }),
        ...(website !== undefined && { website }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(reglementHtml !== undefined && { reglementHtml }),
        ...(reglementUrl !== undefined && { reglementUrl }),
        ...(bureauConfig !== undefined && { bureauConfig: JSON.stringify(bureauConfig) }),
        ...(membershipConfig !== undefined && { membershipConfig: JSON.stringify(membershipConfig) }),
        ...(meetingConfig !== undefined && { meetingConfig: JSON.stringify(meetingConfig) }),
        ...(socialAidCaps !== undefined && { socialAidCaps: JSON.stringify(socialAidCaps) }),
        ...(sanctionsConfig !== undefined && { sanctionsConfig: JSON.stringify(sanctionsConfig) }),
        ...(bankConfig !== undefined && { bankConfig: JSON.stringify(bankConfig) }),
        ...(status !== undefined && { status }),
        ...(parentId !== undefined && { parentId }),
        ...(parentSubscriptionFee !== undefined && { parentSubscriptionFee: parentSubscriptionFee ? parseFloat(parentSubscriptionFee) : null }),
        ...(minKycLevel !== undefined && { minKycLevel: Math.max(0, Math.min(3, Number(minKycLevel))) }),
        ...(requireRegulationApproval !== undefined && { requireRegulationApproval: Boolean(requireRegulationApproval) }),
      },
    });

    if (regulations !== undefined && Array.isArray(regulations)) {
      // Les approbations référencent les articles : les supprimer d'abord,
      // dans la même transaction, pour éviter une violation de clé étrangère.
      await tx.membershipRegulationApproval.deleteMany({
        where: { article: { associationId: id } },
      });
      await tx.associationRegulationArticle.deleteMany({ where: { associationId: id } });
      if (regulations.length > 0) {
        await tx.associationRegulationArticle.createMany({
          data: regulations.map((reg: any, i: number) => ({
            associationId: id,
            articleNumber: i + 1,
            title: reg.title,
            content: reg.content,
          })),
        });
      }
    }

    return updated;
  });

  return NextResponse.json({ association });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const membership = await getMembership(session.user.id, id);
  const canDelete = isSuperAdmin(session) || (membership && ["PRESIDENT", "FOUNDER"].includes(membership.role));
  if (!canDelete) {
    return NextResponse.json({ error: "Réservé au président ou fondateur" }, { status: 403 });
  }

  await prisma.association.update({
    where: { id },
    data: { status: "DISSOLVED" },
  });

  return NextResponse.json({ success: true });
}
