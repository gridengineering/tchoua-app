import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";
import {
  ArpError,
  arpErrorResponse,
  loadArpProfileView,
  publishArpProfile,
  saveArpDraft,
} from "@/lib/arp/server";
import { serializeFund } from "@/lib/arp/funds";

async function membershipFor(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
    include: { customRole: true },
  });
}

async function versionsFor(profileId: string) {
  const versions = await prisma.arpProfileVersion.findMany({
    where: { profileId },
    select: {
      id: true,
      version: true,
      status: true,
      origin: true,
      hash: true,
      effectiveAt: true,
      createdAt: true,
      approvedById: true,
    },
    orderBy: { version: "desc" },
    take: 30,
  });
  return versions.map((v) => ({
    ...v,
    effectiveAt: v.effectiveAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
  }));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const association = await prisma.association.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, isPublic: true },
  });
  if (!association) {
    return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
  }

  const membership = await membershipFor(session.user.id, id);
  if (!membership && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const view = await loadArpProfileView(id);
    const versions = await versionsFor(view.profile.id);
    const fundRows = await prisma.arpFund.findMany({
      where: { associationId: id },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });
    const funds = await Promise.all(fundRows.map((fund) => serializeFund(fund, true)));
    const canEdit = hasPermission(session, membership, "EDIT_SETTINGS");
    const canPublish =
      isSuperAdmin(session) ||
      membership?.role === "PRESIDENT" ||
      membership?.role === "FOUNDER";

    return NextResponse.json({
      ...view,
      versions,
      funds,
      canEdit,
      canPublish,
      myRole: membership?.role ?? null,
      association,
    });
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error("ARP GET", error);
    return NextResponse.json({ error: "Erreur interne du cadre ARP" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const membership = await membershipFor(session.user.id, id);
  if (!hasPermission(session, membership, "EDIT_SETTINGS")) {
    return NextResponse.json({ error: "Permission EDIT_SETTINGS requise" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const { config, publish } = body as { config?: unknown; publish?: boolean };

  const canPublish =
    isSuperAdmin(session) ||
    membership?.role === "PRESIDENT" ||
    membership?.role === "FOUNDER";
  if (publish && !canPublish) {
    return NextResponse.json(
      {
        error:
          "Seul le président, le fondateur ou l'administration système peut publier une version du cadre ARP.",
        code: "ARP_PUBLISH_FORBIDDEN",
      },
      { status: 403 }
    );
  }

  try {
    const view = publish
      ? await publishArpProfile({
          associationId: id,
          userId: session.user.id,
          rawConfig: config,
        })
      : await saveArpDraft({
          associationId: id,
          userId: session.user.id,
          rawConfig: config,
        });
    const versions = await versionsFor(view.profile.id);
    const fundRows = await prisma.arpFund.findMany({
      where: { associationId: id },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });
    const funds = await Promise.all(fundRows.map((fund) => serializeFund(fund, true)));
    return NextResponse.json({ ...view, versions, funds, canEdit: true, canPublish, saved: true });
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error("ARP PUT", error);
    return NextResponse.json({ error: "Erreur interne du cadre ARP" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const membership = await membershipFor(session.user.id, id);
  const canPublish =
    isSuperAdmin(session) ||
    membership?.role === "PRESIDENT" ||
    membership?.role === "FOUNDER";
  if (!canPublish) {
    return NextResponse.json({ error: "Action réservée à la présidence" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const action = (body as { action?: string } | null)?.action;
  if (action !== "publish") {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
  try {
    const view = await publishArpProfile({ associationId: id, userId: session.user.id });
    return NextResponse.json({ ...view, versions: await versionsFor(view.profile.id), saved: true });
  } catch (error) {
    if (error instanceof ArpError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status }
      );
    }
    console.error("ARP PATCH", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
