import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import {
  federationReportToCsv,
  generateFederationReport,
} from "@/lib/association/federation-report";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId: id, status: { not: "LEFT" } },
  });

  if (!membership && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  }

  try {
    const report = await generateFederationReport(prisma, id);
    const format = req.nextUrl.searchParams.get("format") ?? "json";

    if (format === "csv") {
      const csv = federationReportToCsv(report);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="consolidation-federale-${id}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (err: any) {
    if (err?.message === "FEDERATION_NOT_FOUND") {
      return NextResponse.json({ error: "Fédération introuvable" }, { status: 404 });
    }
    console.error("Federation report error:", err);
    return NextResponse.json({ error: "Erreur lors de la consolidation fédérale" }, { status: 500 });
  }
}
