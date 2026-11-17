import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { sendTransactionalEmail } from "@/lib/mailer";
import { buildSectionReport, type FinanceReportSection } from "@/lib/association/finance-report";
import { buildTablePdf } from "@/lib/association/pdf-table";
import { exportToExcel } from "@/lib/association/reports";

const BUREAU_ROLES = new Set([
  "FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ",
  "TREASURER", "TREASURER_ADJ", "CENSOR", "AUDITOR", "SOLIDARITY_OFFICER",
]);
const SECTIONS = new Set<FinanceReportSection>(["state", "history", "dividends", "interests"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeFile(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "rapport";
}

function formatMoney(value: unknown) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value ?? 0))} FCFA`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const membership = await prisma.associationMembership.findFirst({
    where: { associationId: id, userId: session.user.id, status: { not: "LEFT" } },
    include: { user: { select: { name: true, email: true } } },
  });
  const admin = isPlatformAdmin(session);
  if (!membership && !admin) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const rawSection = String(body.section ?? "state");
  if (!SECTIONS.has(rawSection as FinanceReportSection)) {
    return NextResponse.json({ error: "section invalide" }, { status: 400 });
  }
  const section = rawSection as FinanceReportSection;
  const isBureau = Boolean(admin || (membership && BUREAU_ROLES.has(membership.role)));
  if (section === "state" && !isBureau) {
    return NextResponse.json({ error: "Rapport de situation réservé au bureau" }, { status: 403 });
  }

  const membershipId = isBureau ? (body.membershipId ? String(body.membershipId) : null) : membership?.id ?? null;
  const report = await buildSectionReport(id, section, {
    membershipId,
    activityId: body.activityId ? String(body.activityId) : null,
    year: body.year ? Number(body.year) : null,
    from: body.from ? String(body.from) : null,
    to: body.to ? String(body.to) : null,
  });

  const fallback = membership?.user.email || session.user.email || "";
  const requested = String(body.to ?? "").split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  const recipients = isBureau && requested.length ? requested : [fallback].filter(Boolean);
  if (!recipients.length) return NextResponse.json({ error: "Aucun destinataire" }, { status: 400 });
  const invalid = recipients.find((email) => !EMAIL.test(email));
  if (invalid) return NextResponse.json({ error: `Adresse invalide : ${invalid}` }, { status: 400 });

  const pdf = buildTablePdf({
    title: report.title,
    subtitle: report.subtitle,
    meta: report.meta,
    columns: report.columns,
    rows: report.rows,
  });
  const excel = exportToExcel(report.rows, report.columns.map((column) => ({ key: column.key })));
  const base = safeFile(report.title);
  const summary =
    section === "state"
      ? `Membres actifs : ${(report.summary as any)?.members?.active ?? "—"} · Trésorerie : ${formatMoney((report.summary as any)?.finance?.globalCash)} · Engagements membres : ${formatMoney((report.summary as any)?.finance?.memberAvoir)}`
      : section === "history"
        ? `Mouvements : ${report.summary.count ?? report.rows.length} · Entrées : ${formatMoney(report.summary.totalIn)} · Sorties : ${formatMoney(report.summary.totalOut)}`
        : section === "dividends"
          ? `Exercices : ${report.summary.runs ?? 0} · Intérêts : ${formatMoney(report.summary.totalInterest)}`
          : `Remboursements : ${report.summary.count ?? report.rows.length} · Intérêts : ${formatMoney(report.summary.totalInterest)}`;

  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,sans-serif;color:#16211b">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:#0d3d28;color:#fff;border-radius:18px;padding:26px 28px">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d4a343;font-weight:700">Tchoua · Rapport financier</div>
      <h1 style="font-size:23px;line-height:1.25;margin:10px 0 6px">${report.title}</h1>
      <p style="margin:0;color:#cfe2d8;font-size:13px">${report.subtitle}</p>
    </div>
    <div style="background:#fff;border:1px solid #e4ded1;border-radius:18px;padding:24px 28px;margin-top:16px">
      <p style="margin:0 0 12px;font-size:14px">Bonjour,</p>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.6">Veuillez trouver ci-joint le rapport demandé pour <strong>${report.associationName}</strong>. Les pièces PDF et Excel sont jointes à ce message.</p>
      <div style="background:#f6f3ec;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.7">${summary}</div>
      <p style="margin:18px 0 0;font-size:12px;color:#66736b">Document généré le ${new Date().toLocaleString("fr-FR")} · Tchoua</p>
    </div>
  </div></body></html>`;

  const sent = await sendTransactionalEmail({
    to: recipients.join(", "),
    subject: `${report.title} — ${report.associationName}`,
    text: `${report.title}\n${report.subtitle}\n${summary}\n\nRapport généré le ${new Date().toLocaleString("fr-FR")}.`,
    html,
    attachments: [
      { filename: `${base}.pdf`, content: pdf, contentType: "application/pdf" },
      { filename: `${base}.xls`, content: excel, contentType: "application/vnd.ms-excel" },
    ],
  });
  if (!sent) return NextResponse.json({ error: "Envoi impossible : configurez la messagerie SMTP dans Gouvernance & Mail." }, { status: 502 });

  await prisma.associationAuditLog.create({
    data: {
      associationId: id,
      userId: session.user.id,
      action: "REPORT_SENT",
      entity: "ASSOCIATION",
      entityId: id,
      details: `${report.title} envoyé à ${recipients.join(", ")}`,
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true, section, recipients, rows: report.rows.length });
}
