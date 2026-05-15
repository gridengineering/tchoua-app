import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

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
    select: {
      bureauConfig: true,
      membershipConfig: true,
      meetingConfig: true,
      socialAidCaps: true,
      sanctionsConfig: true,
      bankConfig: true,
    }
  });

  if (!association) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });

  const membership = await getMembership(session.user.id, id);

  if (!membership) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({ settings: association });
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
    bureauConfig, membershipConfig, meetingConfig,
    socialAidCaps, sanctionsConfig, bankConfig
  } = body;

  const association = await prisma.association.update({
    where: { id },
    data: {
      ...(bureauConfig !== undefined && { bureauConfig: typeof bureauConfig === 'string' ? bureauConfig : JSON.stringify(bureauConfig) }),
      ...(membershipConfig !== undefined && { membershipConfig: typeof membershipConfig === 'string' ? membershipConfig : JSON.stringify(membershipConfig) }),
      ...(meetingConfig !== undefined && { meetingConfig: typeof meetingConfig === 'string' ? meetingConfig : JSON.stringify(meetingConfig) }),
      ...(socialAidCaps !== undefined && { socialAidCaps: typeof socialAidCaps === 'string' ? socialAidCaps : JSON.stringify(socialAidCaps) }),
      ...(sanctionsConfig !== undefined && { sanctionsConfig: typeof sanctionsConfig === 'string' ? sanctionsConfig : JSON.stringify(sanctionsConfig) }),
      ...(bankConfig !== undefined && { bankConfig: typeof bankConfig === 'string' ? bankConfig : JSON.stringify(bankConfig) }),
    },
  });

  return NextResponse.json({ settings: association });
}
