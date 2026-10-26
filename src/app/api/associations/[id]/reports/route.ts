import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportData } from "@/lib/association/reports";
import { API_ERROR_CODES } from "@/lib/association/rules";

const BUREAU_ROLES = [
  "PRESIDENT",
  "FOUNDER",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
  "SOLIDARITY_OFFICER",
  "AUDITOR",
];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? "20")));
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: any = { associationId: id };
  if (type) where.type = type;
  if (status) where.status = status;

  const [reports, total] = await Promise.all([
    prisma.associationReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.associationReport.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [membership, association] = await Promise.all([
    getMembership(session.user.id, id),
    prisma.association.findUnique
      ? prisma.association.findUnique({ where: { id }, select: { status: true } })
      : Promise.resolve(null),
  ]);

  if (!membership) {
    return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  }

  // R-043 : La génération de rapports est bloquée si l'association est en statut SUSPENDED
  if (association?.status === "SUSPENDED") {
    return NextResponse.json(
      {
        error: API_ERROR_CODES.ASSOC_010.message,
        code: API_ERROR_CODES.ASSOC_010.code,
      },
      { status: API_ERROR_CODES.ASSOC_010.httpStatus }
    );
  }

  const body = await req.json();
  const { type, title, format = "PDF", parameters } = body;

  const isBureau = BUREAU_ROLES.includes(membership.role);
  const isGlobalAdmin = ["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role ?? "");

  // R-038 : Le rapport d'audit est réservé au fondateur et aux administrateurs système
  if (type === "AUDIT" && membership.role !== "FOUNDER" && !isGlobalAdmin) {
    return NextResponse.json(
      { error: "Le rapport d'audit est réservé au fondateur et aux administrateurs système" },
      { status: 403 }
    );
  }

  // R-036 & R-042 : Un membre simple ne peut générer que son propre rapport d'activité (MEMBER) ou son attestation (ATTESTATION)
  const isPersonalMemberReport =
    (type === "ATTESTATION" ||
      (type === "MEMBER" && parameters?.membershipId === membership.id)) &&
    membership.status === "ACTIVE";

  if (!isBureau && !isGlobalAdmin && !isPersonalMemberReport) {
    return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
  }

  if (!type || !title) {
    return NextResponse.json({ error: "type et title sont requis" }, { status: 400 });
  }

  const resolvedParams =
    !isBureau && !isGlobalAdmin
      ? { ...(parameters ?? {}), membershipId: membership.id }
      : parameters ?? {};

  const report = await prisma.associationReport.create({
    data: {
      associationId: id,
      type,
      title,
      format,
      status: "PENDING",
      parameters: Object.keys(resolvedParams).length ? JSON.stringify(resolvedParams) : null,
      generatedById: session.user.id,
    },
  });

  // Simulate async generation synchronously for now
  try {
    await generateReportData(type, id, resolvedParams, prisma);
    await prisma.associationReport.update({
      where: { id: report.id },
      data: { status: "READY", generatedAt: new Date() },
    });
  } catch (err: any) {
    await prisma.associationReport.update({
      where: { id: report.id },
      data: { status: "ERROR", errorMessage: err?.message ?? "Erreur de génération" },
    });
  }

  const updated = await prisma.associationReport.findUnique({ where: { id: report.id } });
  return NextResponse.json({ report: updated }, { status: 201 });
}
