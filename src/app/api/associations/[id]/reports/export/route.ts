import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { buildSectionReport, type FinanceReportSection } from "@/lib/association/finance-report";
import { buildTablePdf } from "@/lib/association/pdf-table";
import { exportToCSV, exportToExcel } from "@/lib/association/reports";

const BUREAU_ROLES = new Set([
  "FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ",
  "TREASURER", "TREASURER_ADJ", "CENSOR", "AUDITOR", "SOLIDARITY_OFFICER",
]);
const SECTIONS = new Set<FinanceReportSection>(["state", "history", "dividends", "interests"]);

function safeFile(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "rapport";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const membership = await prisma.associationMembership.findFirst({
    where: { associationId: id, userId: session.user.id, status: { not: "LEFT" } },
    include: { user: { select: { name: true, email: true } } },
  });
  const admin = isPlatformAdmin(session);
  if (!membership && !admin) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const rawSection = sp.get("section") ?? "state";
  if (!SECTIONS.has(rawSection as FinanceReportSection)) {
    return NextResponse.json({ error: "section invalide" }, { status: 400 });
  }
  const section = rawSection as FinanceReportSection;
  const isBureau = Boolean(admin || (membership && BUREAU_ROLES.has(membership.role)));
  if (section === "state" && !isBureau) {
    return NextResponse.json({ error: "Rapport de situation réservé au bureau" }, { status: 403 });
  }

  const membershipId = isBureau ? sp.get("membershipId") || null : membership?.id ?? null;
  const report = await buildSectionReport(id, section, {
    membershipId,
    activityId: sp.get("activityId"),
    year: sp.get("year") ? Number(sp.get("year")) : null,
    from: sp.get("from"),
    to: sp.get("to"),
  });

  const requestedFormat = (sp.get("format") ?? "pdf").toLowerCase();
  const format = ["pdf", "excel", "xls", "csv"].includes(requestedFormat) ? requestedFormat : "pdf";
  const inline = sp.get("inline") === "1";
  const filename = `${safeFile(report.title)}-${new Date().toISOString().slice(0, 10)}`;
  const extension = format === "excel" || format === "xls" ? "xls" : format;
  const disposition = `${inline && format === "pdf" ? "inline" : "attachment"}; filename="${filename}.${extension}"`;

  if (format === "excel" || format === "xls") {
    const buffer = exportToExcel(report.rows, report.columns.map((column) => ({ key: column.key })));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "csv") {
    const csv = exportToCSV(report.rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  }

  const pdf = buildTablePdf({
    title: report.title,
    subtitle: report.subtitle,
    meta: report.meta,
    columns: report.columns,
    rows: report.rows,
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
