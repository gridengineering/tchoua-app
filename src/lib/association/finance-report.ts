import { prisma } from "@/lib/prisma";
import { allocateInterest, loadCapitalEntries } from "@/lib/association/history";
import { buildAssociationState } from "@/lib/association/association-state";
import type { PdfColumn } from "@/lib/association/pdf-table";

export type FinanceReportSection = "state" | "history" | "dividends" | "interests";

export type FinanceReportParams = {
  membershipId?: string | null;
  activityId?: string | null;
  year?: number | null;
  from?: string | null;
  to?: string | null;
};

export type SectionReport = {
  section: FinanceReportSection;
  title: string;
  subtitle: string;
  meta: string[];
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
  summary: Record<string, unknown>;
  associationName: string;
};

function startOfDay(value?: string | null) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
function endOfDay(value?: string | null) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(d.getTime() + 86_399_999);
}
function ds(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fr-FR");
}
function n(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

const TYPE_LABEL: Record<string, string> = {
  CONTRIBUTION: "Cotisation",
  LOAN: "Prêt décaissé",
  REPAYMENT: "Remboursement",
  BENEFICIARY: "Bénéficiaire",
  AID: "Aide sociale",
  INTEREST: "Intérêts",
  WALLET: "Wallet membre",
  MEMBER_ACCOUNT: "Compte association",
};

export async function buildSectionReport(
  associationId: string,
  section: FinanceReportSection,
  params: FinanceReportParams = {}
): Promise<SectionReport> {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { id: true, name: true, type: true, status: true, createdAt: true, region: true },
  });
  if (!association) throw new Error("ASSOCIATION_NOT_FOUND");
  const generated = new Date().toISOString();

  if (section === "state") {
    const state = await buildAssociationState(associationId);
    return {
      section,
      associationName: association.name,
      title: `Rapport de l'association en l'état — ${association.name}`,
      subtitle: "Situation consolidée des membres, activités, caisses, engagements et flux financiers.",
      meta: [`Situation au ${ds(generated)}`, `${state.summary.members.active} membre(s) actif(s)`, `${state.summary.activitiesCount} activité(s)`],
      columns: [
        { key: "Rubrique", label: "Rubrique", width: 18 },
        { key: "Indicateur", label: "Indicateur", width: 30 },
        { key: "Valeur", label: "Valeur (FCFA)", width: 18, align: "right" },
        { key: "Détail", label: "Détail", width: 50 },
      ],
      rows: state.rows,
      summary: state.summary as unknown as Record<string, unknown>,
    };
  }

  const membershipFilter = params.membershipId || undefined;
  const activityFilter = params.activityId || undefined;
  const from = startOfDay(params.from);
  const to = endOfDay(params.to);

  if (section === "history") {
    const [contributions, loans, repayments, beneficiaries, aids, memberTx] = await Promise.all([
      prisma.activityContribution.findMany({
        where: {
          activity: { associationId, ...(activityFilter ? { id: activityFilter } : {}) },
          ...(membershipFilter ? { membershipId: membershipFilter } : {}),
          ...(from || to ? { paidAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        include: { activity: { select: { name: true } }, membership: { include: { user: { select: { name: true } } } } },
      }),
      prisma.assocLoan.findMany({
        where: {
          activity: { associationId, ...(activityFilter ? { id: activityFilter } : {}) },
          ...(membershipFilter ? { borrowerMembershipId: membershipFilter } : {}),
          ...(from || to ? { disbursedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        include: { activity: { select: { name: true } }, borrowerMembership: { include: { user: { select: { name: true } } } } },
      }),
      prisma.assocLoanRepayment.findMany({
        where: {
          loan: {
            activity: { associationId, ...(activityFilter ? { id: activityFilter } : {}) },
            ...(membershipFilter ? { borrowerMembershipId: membershipFilter } : {}),
          },
          ...(from || to ? { paidAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        include: { loan: { include: { activity: { select: { name: true } }, borrowerMembership: { include: { user: { select: { name: true } } } } } } },
      }),
      prisma.activityBeneficiary.findMany({
        where: {
          session: { activity: { associationId, ...(activityFilter ? { id: activityFilter } : {}) } },
          ...(membershipFilter ? { membershipId: membershipFilter } : {}),
        },
        include: { session: { include: { activity: { select: { name: true } } } }, membership: { include: { user: { select: { name: true } } } } },
      }),
      prisma.assocSocialAidRequest.findMany({
        where: {
          associationId,
          status: "PAID",
          ...(membershipFilter ? { membershipId: membershipFilter } : {}),
          ...(from || to ? { paidAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        include: { membership: { include: { user: { select: { name: true } } } } },
      }),
      prisma.associationMemberTransaction.findMany({
        where: {
          associationId,
          ...(membershipFilter ? { membershipId: membershipFilter } : {}),
          ...(activityFilter ? { activityId: activityFilter } : {}),
          ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        include: { activity: { select: { name: true } }, membership: { include: { user: { select: { name: true } } } } },
      }),
    ]);

    const rows: Record<string, unknown>[] = [];
    for (const c of contributions) {
      if (c.status !== "PAID") continue;
      rows.push({
        Date: ds(c.paidAt ?? c.createdAt),
        Type: TYPE_LABEL.CONTRIBUTION,
        Libellé: `Cotisation — ${c.activity.name}`,
        Membre: c.membership.user.name,
        Activité: c.activity.name,
        Sens: "Entrée",
        Montant: n(c.amount),
      });
    }
    for (const l of loans) {
      rows.push({
        Date: ds(l.disbursedAt ?? l.createdAt),
        Type: TYPE_LABEL.LOAN,
        Libellé: `Prêt décaissé — ${l.borrowerMembership.user.name}`,
        Membre: l.borrowerMembership.user.name,
        Activité: l.activity.name,
        Sens: "Sortie",
        Montant: n(l.amount),
      });
    }
    for (const r of repayments) {
      const interest = n(r.interest ?? Math.max(n(r.amount) - n(r.principal), 0));
      rows.push({
        Date: ds(r.paidAt),
        Type: TYPE_LABEL.REPAYMENT,
        Libellé: `Remboursement — ${r.loan.borrowerMembership.user.name}`,
        Membre: r.loan.borrowerMembership.user.name,
        Activité: r.loan.activity.name,
        Sens: "Entrée",
        Montant: n(r.principal ?? n(r.amount) - interest),
      });
      if (interest > 0) {
        rows.push({
          Date: ds(r.paidAt),
          Type: TYPE_LABEL.INTEREST,
          Libellé: `Intérêts — ${r.loan.borrowerMembership.user.name}`,
          Membre: r.loan.borrowerMembership.user.name,
          Activité: r.loan.activity.name,
          Sens: "Entrée",
          Montant: interest,
        });
      }
    }
    for (const b of beneficiaries) {
      rows.push({
        Date: ds(b.paidAt ?? b.session.heldAt ?? b.session.scheduledAt),
        Type: TYPE_LABEL.BENEFICIARY,
        Libellé: `Bénéficiaire — ${b.session.activity.name}`,
        Membre: b.membership.user.name,
        Activité: b.session.activity.name,
        Sens: "Sortie",
        Montant: n(b.amount),
      });
    }
    for (const a of aids) {
      rows.push({
        Date: ds(a.paidAt ?? a.approvedAt ?? a.createdAt),
        Type: TYPE_LABEL.AID,
        Libellé: `Aide sociale — ${a.category}`,
        Membre: a.membership.user.name,
        Activité: "—",
        Sens: "Sortie",
        Montant: n(a.approvedAmount ?? a.requestedAmount),
      });
    }
    for (const t of memberTx) {
      rows.push({
        Date: ds(t.createdAt),
        Type: TYPE_LABEL.MEMBER_ACCOUNT,
        Libellé: `${t.type} — ${t.method}`,
        Membre: t.membership.user.name,
        Activité: t.activity?.name ?? "—",
        Sens: t.direction === "IN" ? "Entrée" : "Sortie",
        Montant: n(t.amount),
      });
    }
    const sortFr = (value: unknown) => {
      const [d, m, y] = String(value).split("/").map(Number);
      return new Date(y, m - 1, d).getTime();
    };
    rows.sort((a, b) => sortFr(b.Date) - sortFr(a.Date));
    const totalIn = rows.filter((r) => r.Sens === "Entrée").reduce((s, r) => s + n(r.Montant), 0);
    const totalOut = rows.filter((r) => r.Sens === "Sortie").reduce((s, r) => s + n(r.Montant), 0);
    return {
      section,
      associationName: association.name,
      title: `Historique financier — ${association.name}`,
      subtitle: membershipFilter ? "Mouvements du membre sélectionné." : "Tous les mouvements de l'association.",
      meta: [`${rows.length} mouvement(s)`, `Entrées ${totalIn} FCFA`, `Sorties ${totalOut} FCFA`],
      columns: [
        { key: "Date", label: "Date", width: 12 },
        { key: "Type", label: "Type", width: 15 },
        { key: "Libellé", label: "Libellé", width: 32 },
        { key: "Membre", label: "Membre", width: 18 },
        { key: "Activité", label: "Activité", width: 16 },
        { key: "Sens", label: "Sens", width: 9 },
        { key: "Montant", label: "Montant", width: 13, align: "right" as const },
      ],
      rows,
      summary: { count: rows.length, totalIn, totalOut, net: totalIn - totalOut },
    };
  }

  if (section === "dividends") {
    const runs = await prisma.associationDividendRun.findMany({
      where: { associationId, ...(params.year ? { year: params.year } : {}) },
      include: {
        shares: {
          include: { membership: { include: { user: { select: { name: true, email: true } } } } },
          orderBy: { interestShare: "desc" },
        },
      },
      orderBy: { year: "desc" },
    });
    const rows: Record<string, unknown>[] = [];
    for (const run of runs) {
      for (const share of run.shares) {
        if (membershipFilter && share.membershipId !== membershipFilter) continue;
        rows.push({
          Exercice: run.year,
          Statut: run.status,
          Membre: share.membership.user.name,
          Capital: n(share.capital),
          "Quote-part": n(share.interestShare),
          Éligible: share.eligible ? "Oui" : "Non",
          Crédité: share.credited ? "Oui" : "Non",
          "Date de crédit": share.creditedAt ? ds(share.creditedAt) : "—",
        });
      }
    }
    const totalInterest = runs.reduce((s, r) => s + n(r.totalInterest), 0);
    return {
      section,
      associationName: association.name,
      title: `Dividendes — ${association.name}`,
      subtitle: "Répartition annuelle des intérêts au prorata du capital détenu.",
      meta: [`${runs.length} exercice(s)`, `Intérêts calculés ${totalInterest} FCFA`, `${rows.length} ligne(s)`],
      columns: [
        { key: "Exercice", label: "Exercice", width: 9 },
        { key: "Statut", label: "Statut", width: 11 },
        { key: "Membre", label: "Membre", width: 25 },
        { key: "Capital", label: "Capital", width: 14, align: "right" as const },
        { key: "Quote-part", label: "Quote-part", width: 14, align: "right" as const },
        { key: "Éligible", label: "Éligible", width: 9 },
        { key: "Crédité", label: "Crédité", width: 9 },
        { key: "Date de crédit", label: "Date de crédit", width: 12 },
      ],
      rows,
      summary: { runs: runs.length, totalInterest, shares: rows.length },
    };
  }

  // Interests
  const [capitalEntries, repayments, membership] = await Promise.all([
    loadCapitalEntries(prisma, associationId),
    prisma.assocLoanRepayment.findMany({
      where: {
        loan: {
          activity: { associationId, ...(activityFilter ? { id: activityFilter } : {}) },
          ...(membershipFilter ? { borrowerMembershipId: membershipFilter } : {}),
        },
        ...(from || to ? { paidAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { loan: { include: { activity: { select: { name: true } }, borrowerMembership: { include: { user: { select: { name: true } } } } } } },
      orderBy: { paidAt: "desc" },
    }),
    membershipFilter
      ? prisma.associationMembership.findFirst({ where: { id: membershipFilter, associationId }, include: { user: { select: { name: true } } } })
      : Promise.resolve(null),
  ]);
  const rows: Record<string, unknown>[] = [];
  for (const r of repayments) {
    const interest = n(r.interest ?? Math.max(n(r.amount) - n(r.principal), 0));
    if (interest <= 0) continue;
    const date = r.loan.disbursedAt ?? r.loan.createdAt;
    const allocation = allocateInterest(capitalEntries, interest, date);
    if (membershipFilter) {
      const mine = allocation.find((a) => a.membershipId === membershipFilter);
      if (!mine) continue;
      rows.push({
        Date: ds(r.paidAt),
        Emprunteur: r.loan.borrowerMembership.user.name,
        Activité: r.loan.activity.name,
        Remboursement: n(r.amount),
        Intérêts: interest,
        "Capital détenu": n(mine.capital),
        "Capital total": n(mine.totalCapital),
        "Quote-part": `${(mine.ratio * 100).toFixed(2)} %`,
        "Part membre": n(mine.amount),
      });
    } else {
      rows.push({
        Date: ds(r.paidAt),
        Emprunteur: r.loan.borrowerMembership.user.name,
        Activité: r.loan.activity.name,
        Remboursement: n(r.amount),
        Intérêts: interest,
        "Capital détenu": "—",
        "Capital total": "—",
        "Quote-part": "—",
        "Part membre": interest,
      });
    }
  }
  const totalInterest = rows.reduce((s, r) => s + n(r.Intérêts), 0);
  const totalShare = rows.reduce((s, r) => s + n(r["Part membre"]), 0);
  return {
    section,
    associationName: association.name,
    title: `Intérêts — ${association.name}${membership ? ` — ${membership.user.name}` : ""}`,
    subtitle: "Intérêts encaissés et quote-part calculée sur le capital détenu à la date du prêt.",
    meta: [`${rows.length} remboursement(s)`, `Intérêts ${totalInterest} FCFA`, `Part ${totalShare} FCFA`],
    columns: [
      { key: "Date", label: "Date", width: 11 },
      { key: "Emprunteur", label: "Emprunteur", width: 18 },
      { key: "Activité", label: "Activité", width: 16 },
      { key: "Remboursement", label: "Remb.", width: 12, align: "right" as const },
      { key: "Intérêts", label: "Intérêts", width: 12, align: "right" as const },
      { key: "Capital détenu", label: "Capital", width: 12, align: "right" as const },
      { key: "Capital total", label: "Capital total", width: 12, align: "right" as const },
      { key: "Quote-part", label: "Quote-part", width: 9 },
      { key: "Part membre", label: "Part membre", width: 12, align: "right" as const },
    ],
    rows,
    summary: { count: rows.length, totalInterest, totalShare },
  };
}
