import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { exportToPDF } from "@/lib/association/reports";
import { meetingDateLabel } from "@/lib/association/meetings";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br />");
}

export async function buildMeetingReport(associationId: string, meetingId: string) {
  const meeting = await prisma.assocMeeting.findFirst({
    where: { id: meetingId, associationId },
    include: {
      association: { select: { name: true, email: true, phone: true } },
      attendances: { include: { membership: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { membership: { user: { name: "asc" } } } },
      agendaItems: { orderBy: { order: "asc" } },
      sessionContributions: { include: { membership: { include: { user: { select: { name: true } } } } } },
    },
  });
  if (!meeting) throw new Error("Session introuvable");
  const sessionContributions = meeting.sessionContributions;
  const totals = sessionContributions.reduce(
    (acc, row) => ({
      total: acc.total + Number(row.totalAmount ?? 0),
      cash: acc.cash + Number(row.cashAmount ?? 0),
      mobile: acc.mobile + Number(row.mobileMoneyAmount ?? 0),
      bank: acc.bank + Number(row.bankTransferAmount ?? 0),
    }),
    { total: 0, cash: 0, mobile: 0, bank: 0 }
  );
  const present = meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE");
  const absent = meeting.attendances.filter((a) => a.status === "ABSENT" || a.status === "EXCUSED");
  const roleName = async (id?: string | null) => {
    if (!id) return "—";
    const m = await prisma.associationMembership.findFirst({ where: { id, associationId }, select: { user: { select: { name: true } } } });
    return m?.user.name ?? "—";
  };
  const president = await roleName(meeting.sessionPresidentId);
  const secretary = await roleName(meeting.sessionSecretaryId);
  const censor = await roleName(meeting.sessionCensorId);

  const rows: Array<Record<string, string | number>> = [
    { Rubrique: "Association", Contenu: meeting.association.name },
    { Rubrique: "Session", Contenu: meeting.title ?? "Session de réunion" },
    { Rubrique: "Date et heure", Contenu: meetingDateLabel(meeting.scheduledAt) },
    { Rubrique: "Ouverture", Contenu: meeting.openedAt ? meetingDateLabel(meeting.openedAt) : "—" },
    { Rubrique: "Clôture", Contenu: meeting.closedAt ? meetingDateLabel(meeting.closedAt) : meetingDateLabel(new Date()) },
    { Rubrique: "Modalité", Contenu: meeting.modality },
    { Rubrique: "Lieu", Contenu: meeting.location || meeting.onlineUrl || "—" },
    { Rubrique: "Président de séance", Contenu: president },
    { Rubrique: "Secrétaire de séance", Contenu: secretary },
    { Rubrique: "Censeur", Contenu: censor },
    { Rubrique: "Présents", Contenu: `${present.length} — ${present.map((a) => `${a.membership.user.name}${a.arrivedAt ? ` (${new Date(a.arrivedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})` : ""}`).join(", ") || "—"}` },
    { Rubrique: "Absents / excusés", Contenu: `${absent.length} — ${absent.map((a) => `${a.membership.user.name} (${a.status})`).join(", ") || "—"}` },
    { Rubrique: "Quorum", Contenu: `${meeting.quorumReached ? "Atteint" : "Non atteint"}${meeting.quorumRequired != null ? ` (${meeting.quorumRequired}%)` : ""}` },
  ];
  for (const item of meeting.agendaItems) {
    rows.push({
      Rubrique: `Point ${item.order} — ${item.title}`,
      Contenu: [item.content, item.decision ? `Décision : ${item.decision}` : ""].filter(Boolean).join(" — ") || "Non renseigné",
    });
  }
  rows.push(
    { Rubrique: "Relevé financier — total", Contenu: totals.total },
    { Rubrique: "Relevé financier — espèces", Contenu: totals.cash },
    { Rubrique: "Relevé financier — mobile money", Contenu: totals.mobile },
    { Rubrique: "Relevé financier — banque", Contenu: totals.bank }
  );

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(meeting.title ?? "Compte rendu de session")}</title>
  <style>body{font-family:Arial,sans-serif;color:#1f2937;line-height:1.55;max-width:900px;margin:40px auto;padding:0 24px}h1{color:#0d3d28;border-bottom:3px solid #0d3d28;padding-bottom:8px}h2{color:#0d3d28;margin-top:24px;font-size:18px}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #d6d3cd;padding:7px;text-align:left;vertical-align:top;font-size:13px}th{background:#f0f5f1}.meta{color:#6b7280;font-size:13px}.item{border-left:4px solid #c8a951;padding:8px 12px;margin:10px 0;background:#faf8f2}.sign{display:flex;justify-content:space-between;margin-top:40px;font-size:13px}</style></head><body>
  <h1>${esc(meeting.association.name)} — Compte rendu de session</h1>
  <p class="meta">${esc(meetingDateLabel(meeting.scheduledAt))} · ${esc(meeting.location || meeting.onlineUrl || meeting.modality)}</p>
  <table><tr><th>Président de séance</th><td>${esc(president)}</td><th>Secrétaire</th><td>${esc(secretary)}</td></tr>
  <tr><th>Présents</th><td>${present.length}</td><th>Absents / excusés</th><td>${absent.length}</td></tr>
  <tr><th>Quorum</th><td colspan="3">${meeting.quorumReached ? "Atteint" : "Non atteint"}${meeting.quorumRequired != null ? ` (${meeting.quorumRequired}%)` : ""}</td></tr></table>
  <h2>Présences</h2><table><tr><th>Membre</th><th>Statut</th><th>Arrivée</th><th>Justification</th></tr>
  ${meeting.attendances.map((a) => `<tr><td>${esc(a.membership.user.name)}</td><td>${esc(a.status)}</td><td>${a.arrivedAt ? esc(new Date(a.arrivedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })) : "—"}</td><td>${esc(a.justification ?? "—")}</td></tr>`).join("")}</table>
  <h2>Ordre du jour et délibérations</h2>
  ${meeting.agendaItems.map((item) => `<div class="item"><strong>${esc(item.title)}</strong><p>${esc(item.content ?? "Non renseigné")}</p>${item.decision ? `<p><strong>Décision :</strong> ${esc(item.decision)}</p>` : ""}</div>`).join("") || "<p>Aucun point renseigné.</p>"}
  <h2>Relevé financier de session</h2><table><tr><th>Total</th><th>Espèces</th><th>Mobile Money</th><th>Banque</th></tr><tr><td>${totals.total.toLocaleString("fr-FR")} FCFA</td><td>${totals.cash.toLocaleString("fr-FR")} FCFA</td><td>${totals.mobile.toLocaleString("fr-FR")} FCFA</td><td>${totals.bank.toLocaleString("fr-FR")} FCFA</td></tr></table>
  <div class="sign"><span>Le Président de séance<br/><br/>${esc(president)}</span><span>Le Secrétaire de séance<br/><br/>${esc(secretary)}</span></div>
  </body></html>`;

  return { meeting, html, rows, totals, present, absent, president, secretary, censor };
}

export async function generateMeetingPdfs(associationId: string, meetingId: string) {
  const report = await buildMeetingReport(associationId, meetingId);
  const statementRows: Array<Record<string, string | number>> = report.meeting.sessionContributions.map((row) => ({
    Membre: row.membership.user.name,
    Compte: "Session",
    Total: Number(row.totalAmount ?? 0),
    Espèces: Number(row.cashAmount ?? 0),
    "Mobile Money": Number(row.mobileMoneyAmount ?? 0),
    Banque: Number(row.bankTransferAmount ?? 0),
    Statut: row.status,
    Date: new Date(row.paidAt).toLocaleString("fr-FR"),
  }));
  const dir = join(process.cwd(), "public", "uploads", "associations", associationId, "meetings", meetingId);
  await mkdir(dir, { recursive: true });
  const minutesPath = join(dir, "compte-rendu.pdf");
  const statementPath = join(dir, "releve-session.pdf");
  await writeFile(minutesPath, exportToPDF(report.rows, `Compte rendu — ${report.meeting.title ?? "Session"}`));
  await writeFile(statementPath, exportToPDF(statementRows.length ? statementRows : [{ Information: "Aucun versement de session enregistré." }], `Relevé de session — ${report.meeting.title ?? "Session"}`));
  return {
    ...report,
    minutesUrl: `/uploads/associations/${associationId}/meetings/${meetingId}/compte-rendu.pdf`,
    statementUrl: `/uploads/associations/${associationId}/meetings/${meetingId}/releve-session.pdf`,
    minutesPath,
    statementPath,
  };
}
