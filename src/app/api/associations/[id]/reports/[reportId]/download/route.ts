import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportData, exportToCSV, exportToExcel, exportToPDF } from "@/lib/association/reports";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; reportId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, reportId } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const report = await prisma.associationReport.findFirst({
    where: { id: reportId, associationId: id },
  });

  if (!report) return NextResponse.json({ error: "Rapport introuvable" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") ?? report.format ?? "JSON").toUpperCase();

  if (format === "PDF") {
    try {
      const parameters = report.parameters ? JSON.parse(report.parameters) : {};
      const data = await generateReportData(report.type, id, parameters, prisma);
      const pdf = await exportToPDF(data, report.title);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${report.title}.pdf"`,
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Erreur lors de la génération PDF", detail: err?.message },
        { status: 500 }
      );
    }
  }

  try {
    const parameters = report.parameters ? JSON.parse(report.parameters) : {};
    const data = await generateReportData(report.type, id, parameters, prisma);

    if (format === "CSV") {
      const csv = exportToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${report.title}.csv"`,
        },
      });
    }

    if (format === "EXCEL") {
      const buffer = exportToExcel(data);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="${report.title}.xls"`,
        },
      });
    }

    // Default JSON
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport", detail: err?.message },
      { status: 500 }
    );
  }
}
