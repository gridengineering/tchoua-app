import type { PrismaClient } from "@prisma/client";

export type SyscohadaAccount = {
  compte: string;
  intitule: string;
  classe: number;
};

export type SyscohadaJournalEntry = {
  date: string;
  piece: string;
  compteDebit: string;
  libelleDebit: string;
  compteCredit: string;
  libelleCredit: string;
  libelle: string;
  montant: number;
  devise: string;
};

export type SyscohadaBalanceRow = {
  compte: string;
  intitule: string;
  classe: number;
  debit: number;
  credit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
};

export const SYSCOHADA_PLAN: SyscohadaAccount[] = [
  { compte: "101000", intitule: "Fonds associatifs et dotations", classe: 1 },
  { compte: "120000", intitule: "Résultat net de l'exercice", classe: 1 },
  { compte: "401000", intitule: "Dettes envers membres bénéficiaires et aides", classe: 4 },
  { compte: "411000", intitule: "Créances membres — Cotisations attendues", classe: 4 },
  { compte: "412000", intitule: "Créances membres — Prêts en cours", classe: 4 },
  { compte: "521000", intitule: "Banque et Mobile Money", classe: 5 },
  { compte: "571000", intitule: "Caisse espèces", classe: 5 },
  { compte: "658000", intitule: "Prestations, redistributions et aides versées", classe: 6 },
  { compte: "706000", intitule: "Cotisations statutaires et tontines", classe: 7 },
  { compte: "758000", intitule: "Pénalités, amendes et produits divers", classe: 7 },
  { compte: "771000", intitule: "Intérêts et produits financiers des prêts", classe: 7 },
];

const ACCOUNT_MAP = Object.fromEntries(SYSCOHADA_PLAN.map((a) => [a.compte, a]));

function treasuryAccount(method?: string | null): string {
  const m = (method ?? "CASH").toUpperCase();
  return m === "CASH" || m === "ESPECES" ? "571000" : "521000";
}

export async function generateFullSyscohadaReport(
  prisma: PrismaClient,
  associationId: string
) {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { id: true, name: true },
  });
  if (!association) throw new Error("ASSOCIATION_NOT_FOUND");

  const devise = "XAF";

  const [
    activities,
    paidContribs,
    pendingContribs,
    beneficiaries,
    loans,
    repayments,
    aids,
    sanctions,
  ] = await Promise.all([
    prisma.associationActivity.findMany({
      where: { associationId },
      select: { caisseBalance: true },
    }),
    prisma.activityContribution.findMany({
      where: { activity: { associationId }, status: "PAID" },
      include: {
        activity: { select: { name: true } },
        membership: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.activityContribution.findMany({
      where: { activity: { associationId }, status: { in: ["PENDING", "LATE"] } },
      select: { amount: true },
    }),
    prisma.activityBeneficiary.findMany({
      where: { session: { activity: { associationId } } },
      include: {
        session: { include: { activity: { select: { name: true } } } },
        membership: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assocLoan.findMany({
      where: { activity: { associationId } },
      include: {
        borrowerMembership: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assocLoanRepayment.findMany({
      where: { loan: { activity: { associationId } } },
      include: {
        loan: { include: { borrowerMembership: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: { paidAt: "asc" },
    }),
    prisma.assocSocialAidRequest.findMany({
      where: { associationId, status: { in: ["APPROVED", "PAID"] } },
      include: { membership: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assocSanction.findMany({
      where: { meeting: { associationId }, status: "APPLIED" },
      include: { membership: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const journal: SyscohadaJournalEntry[] = [];
  const pushEntry = (
    date: Date,
    piece: string,
    compteDebit: string,
    compteCredit: string,
    libelle: string,
    montant: number
  ) => {
    if (!Number.isFinite(montant) || montant <= 0) return;
    journal.push({
      date: date.toISOString().slice(0, 10),
      piece,
      compteDebit,
      libelleDebit: ACCOUNT_MAP[compteDebit]?.intitule ?? compteDebit,
      compteCredit,
      libelleCredit: ACCOUNT_MAP[compteCredit]?.intitule ?? compteCredit,
      libelle,
      montant: Math.round(montant * 100) / 100,
      devise,
    });
  };

  for (const c of paidContribs) {
    pushEntry(
      c.paidAt ?? c.createdAt,
      `COT-${c.id.slice(-6).toUpperCase()}`,
      treasuryAccount(c.paymentMethod),
      "706000",
      `Cotisation ${c.activity.name} — ${c.membership.user.name ?? "Membre"}`,
      c.amount
    );
  }

  for (const b of beneficiaries) {
    pushEntry(
      b.paidAt ?? b.createdAt,
      `BEN-${b.id.slice(-6).toUpperCase()}`,
      "658000",
      "571000",
      `Attribution ${b.session.activity.name} — ${b.membership.user.name ?? "Membre"}`,
      b.amount
    );
  }

  for (const l of loans) {
    pushEntry(
      l.disbursedAt ?? l.createdAt,
      `PRT-${l.id.slice(-6).toUpperCase()}`,
      "412000",
      "571000",
      `Décaissement prêt — ${l.borrowerMembership.user.name ?? "Membre"}`,
      l.amount
    );
  }

  for (const r of repayments) {
    const interestPart = r.interest ?? 0;
    const principalPart = Math.max(0, r.amount - interestPart);
    if (principalPart > 0) {
      pushEntry(
        r.paidAt,
        `RMB-${r.id.slice(-6).toUpperCase()}`,
        treasuryAccount(r.paymentMethod),
        "412000",
        `Remboursement capital prêt — ${r.loan.borrowerMembership.user.name ?? "Membre"}`,
        principalPart
      );
    }
    if (interestPart > 0) {
      pushEntry(
        r.paidAt,
        `INT-${r.id.slice(-6).toUpperCase()}`,
        treasuryAccount(r.paymentMethod),
        "771000",
        `Intérêts prêt — ${r.loan.borrowerMembership.user.name ?? "Membre"}`,
        interestPart
      );
    }
  }

  for (const a of aids) {
    const amt = a.approvedAmount ?? a.requestedAmount;
    if (a.status === "PAID") {
      pushEntry(
        a.paidAt ?? a.createdAt,
        `AID-${a.id.slice(-6).toUpperCase()}`,
        "658000",
        "571000",
        `Aide sociale (${a.category}) — ${a.membership.user.name ?? "Membre"}`,
        amt
      );
    } else {
      pushEntry(
        a.createdAt,
        `AID-${a.id.slice(-6).toUpperCase()}`,
        "658000",
        "401000",
        `Aide approuvée à payer (${a.category}) — ${a.membership.user.name ?? "Membre"}`,
        amt
      );
    }
  }

  for (const s of sanctions) {
    pushEntry(
      s.appliedAt ?? s.createdAt,
      `SAN-${s.id.slice(-6).toUpperCase()}`,
      "571000",
      "758000",
      `Sanction encaissée (${s.failureType}) — ${s.membership.user.name ?? "Membre"}`,
      s.penaltyAmount
    );
  }

  journal.sort((a, b) => a.date.localeCompare(b.date));

  const totalsByAccount = new Map<string, { debit: number; credit: number }>();
  for (const acc of SYSCOHADA_PLAN) {
    totalsByAccount.set(acc.compte, { debit: 0, credit: 0 });
  }
  for (const entry of journal) {
    const d = totalsByAccount.get(entry.compteDebit) ?? { debit: 0, credit: 0 };
    d.debit += entry.montant;
    totalsByAccount.set(entry.compteDebit, d);

    const c = totalsByAccount.get(entry.compteCredit) ?? { debit: 0, credit: 0 };
    c.credit += entry.montant;
    totalsByAccount.set(entry.compteCredit, c);
  }

  const balance: SyscohadaBalanceRow[] = SYSCOHADA_PLAN.map((acc) => {
    const t = totalsByAccount.get(acc.compte) ?? { debit: 0, credit: 0 };
    const diff = t.debit - t.credit;
    return {
      compte: acc.compte,
      intitule: acc.intitule,
      classe: acc.classe,
      debit: Math.round(t.debit * 100) / 100,
      credit: Math.round(t.credit * 100) / 100,
      soldeDebiteur: diff > 0 ? Math.round(diff * 100) / 100 : 0,
      soldeCrediteur: diff < 0 ? Math.round(-diff * 100) / 100 : 0,
    };
  }).filter((row) => row.debit > 0 || row.credit > 0);

  const treasury = activities.reduce((s, a) => s + a.caisseBalance, 0);
  const creancesCotisations = pendingContribs.reduce((s, c) => s + c.amount, 0);
  const creancesLoans =
    (totalsByAccount.get("412000")?.debit ?? 0) -
    (totalsByAccount.get("412000")?.credit ?? 0);
  const dettesAides =
    (totalsByAccount.get("401000")?.credit ?? 0) -
    (totalsByAccount.get("401000")?.debit ?? 0);

  const produits =
    (totalsByAccount.get("706000")?.credit ?? 0) +
    (totalsByAccount.get("758000")?.credit ?? 0) +
    (totalsByAccount.get("771000")?.credit ?? 0);
  const charges = totalsByAccount.get("658000")?.debit ?? 0;
  const resultat = produits - charges;

  return {
    type: "OHADA_SYSCOHADA_COMPLET",
    associationId,
    associationName: association.name,
    devise,
    generatedAt: new Date().toISOString(),
    conformite: "SYSCOHADA Révisé — Plan associatif (Classes 1 à 7)",
    planComptable: SYSCOHADA_PLAN,
    bilan: {
      actifNonCourant: 0,
      actifCourant: {
        creancesClients: Math.max(0, creancesCotisations + creancesLoans),
        tresorerie: treasury,
      },
      totalActif: treasury + Math.max(0, creancesCotisations + creancesLoans),
      capitauxPropres: Math.max(0, resultat),
      passifNonCourant: 0,
      passifCourant: {
        dettesFournisseurs: Math.max(0, dettesAides),
        autresDettes: 0,
      },
      totalPassif: Math.max(0, resultat) + Math.max(0, dettesAides),
    },
    compteResultat: {
      chiffreAffaires: produits,
      chargesExploitation: charges,
      resultatExploitation: resultat,
      resultatNet: resultat,
    },
    balance,
    journal,
  };
}

export function syscohadaJournalToCsv(
  report: Awaited<ReturnType<typeof generateFullSyscohadaReport>>
): string {
  const header = [
    "Date",
    "Pièce",
    "Compte Débit",
    "Intitulé Débit",
    "Compte Crédit",
    "Intitulé Crédit",
    "Libellé",
    "Montant",
    "Devise",
  ].join(";");

  const rows = report.journal.map((j) =>
    [
      j.date,
      j.piece,
      j.compteDebit,
      `"${j.libelleDebit.replace(/"/g, '""')}"`,
      j.compteCredit,
      `"${j.libelleCredit.replace(/"/g, '""')}"`,
      `"${j.libelle.replace(/"/g, '""')}"`,
      j.montant,
      j.devise,
    ].join(";")
  );

  return "\uFEFF" + [header, ...rows].join("\r\n");
}

export function syscohadaBalanceToCsv(
  report: Awaited<ReturnType<typeof generateFullSyscohadaReport>>
): string {
  const header = [
    "Classe",
    "Compte",
    "Intitulé",
    "Total Débit",
    "Total Crédit",
    "Solde Débiteur",
    "Solde Créditeur",
  ].join(";");

  const rows = report.balance.map((b) =>
    [
      b.classe,
      b.compte,
      `"${b.intitule.replace(/"/g, '""')}"`,
      b.debit,
      b.credit,
      b.soldeDebiteur,
      b.soldeCrediteur,
    ].join(";")
  );

  return "\uFEFF" + [header, ...rows].join("\r\n");
}
