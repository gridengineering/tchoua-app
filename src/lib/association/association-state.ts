import { prisma } from "@/lib/prisma";

export type AssociationStateReport = Awaited<ReturnType<typeof buildAssociationState>>;

function dateFr(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function buildAssociationState(associationId: string) {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    include: {
      memberships: {
        where: { status: { not: "LEFT" } },
        include: { user: { select: { id: true, name: true, email: true, kycLevel: true } } },
        orderBy: [{ role: "asc" }, { memberNumber: "asc" }],
      },
      activities: { orderBy: [{ status: "asc" }, { createdAt: "asc" }] },
      wallet: true,
      accounts: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      meetings: {
        orderBy: { scheduledAt: "desc" },
        take: 8,
        select: { id: true, title: true, scheduledAt: true, status: true, modality: true, location: true },
      },
    },
  });
  if (!association) throw new Error("ASSOCIATION_NOT_FOUND");

  const [contributions, beneficiaries, loans, aids, memberAccountSum, dividendRuns, sessionsCount] = await Promise.all([
    prisma.activityContribution.groupBy({
      by: ["activityId"],
      where: { activity: { associationId }, status: "PAID" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.activityBeneficiary.findMany({
      where: { session: { activity: { associationId } } },
      select: { amount: true, session: { select: { activityId: true } } },
    }),
    prisma.assocLoan.findMany({
      where: { activity: { associationId }, status: { in: ["APPROVED", "ACTIVE", "REPAID", "DEFAULTED"] } },
      select: {
        id: true,
        activityId: true,
        amount: true,
        totalDue: true,
        status: true,
        interestRate: true,
        dueDate: true,
        repayments: { select: { amount: true, principal: true, interest: true } },
      },
    }),
    prisma.assocSocialAidRequest.findMany({
      where: { associationId },
      select: { status: true, requestedAmount: true, approvedAmount: true },
    }),
    prisma.associationMemberAccount.aggregate({
      where: { associationId, status: "ACTIVE" },
      _sum: { balance: true },
      _count: { _all: true },
    }),
    prisma.associationDividendRun.findMany({
      where: { associationId },
      include: { shares: { select: { interestShare: true, capital: true } } },
      orderBy: { year: "desc" },
    }),
    prisma.assocMeeting.count({ where: { associationId } }),
  ]);

  const contribMap = new Map(contributions.map((c) => [c.activityId, c]));
  const benefMap = new Map<string, number>();
  for (const b of beneficiaries) {
    benefMap.set(b.session.activityId, (benefMap.get(b.session.activityId) ?? 0) + Number(b.amount ?? 0));
  }
  const loanByActivity = new Map<string, { outstanding: number; count: number; disbursed: number }>();
  let loanOutstanding = 0;
  let loanDisbursed = 0;
  let interestGenerated = 0;
  for (const loan of loans) {
    const repaid = loan.repayments.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const outstanding = Math.max(0, Number(loan.totalDue ?? loan.amount ?? 0) - repaid);
    loanOutstanding += outstanding;
    loanDisbursed += Number(loan.amount ?? 0);
    interestGenerated += loan.repayments.reduce((s, r) => s + Number(r.interest ?? 0), 0);
    const prev = loanByActivity.get(loan.activityId) ?? { outstanding: 0, count: 0, disbursed: 0 };
    loanByActivity.set(loan.activityId, {
      outstanding: prev.outstanding + outstanding,
      count: prev.count + (["ACTIVE", "APPROVED", "DEFAULTED"].includes(loan.status) ? 1 : 0),
      disbursed: prev.disbursed + Number(loan.amount ?? 0),
    });
  }

  const aidsPaid = aids
    .filter((a) => a.status === "PAID")
    .reduce((s, a) => s + Number(a.approvedAmount ?? a.requestedAmount ?? 0), 0);
  const aidEngagements = aids
    .filter((a) => ["APPROVED", "PENDING"].includes(a.status))
    .reduce((s, a) => s + Number(a.approvedAmount ?? a.requestedAmount ?? 0), 0);

  const activitiesTreasury = association.activities.reduce((s, a) => s + Number(a.caisseBalance ?? 0), 0);
  const walletBalance = Number(association.wallet?.balance ?? 0);
  const memberAvoir = Number(memberAccountSum._sum.balance ?? 0);
  const totalContributions = contributions.reduce((s, c) => s + Number(c._sum.amount ?? 0), 0);
  const totalBenefits = beneficiaries.reduce((s, b) => s + Number(b.amount ?? 0), 0);
  const dividendInterest = dividendRuns.reduce((s, run) => s + Number(run.totalInterest ?? 0), 0);
  const netPosition = activitiesTreasury + walletBalance + loanOutstanding - memberAvoir - aidEngagements;

  const activities = association.activities.map((activity) => {
    const c = contribMap.get(activity.id);
    const l = loanByActivity.get(activity.id);
    return {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      status: activity.status,
      contributionAmount: Number(activity.contributionAmount ?? activity.partAmount ?? 0),
      caisseBalance: Number(activity.caisseBalance ?? 0),
      contributionsPaid: Number(c?._sum.amount ?? 0),
      contributionsCount: Number(c?._count._all ?? 0),
      benefitsPaid: benefMap.get(activity.id) ?? 0,
      activeLoans: l?.count ?? 0,
      outstandingLoans: l?.outstanding ?? 0,
      totalLoansDisbursed: l?.disbursed ?? 0,
    };
  });

  const activeMembers = association.memberships.filter((m) => m.status === "ACTIVE").length;
  const bureauRoles = new Set([
    "FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ",
    "TREASURER", "TREASURER_ADJ", "CENSOR", "AUDITOR", "SOLIDARITY_OFFICER",
  ]);
  const bureau = association.memberships
    .filter((m) => bureauRoles.has(m.role))
    .map((m) => ({ name: m.user.name, role: m.role, email: m.user.email, memberNumber: m.memberNumber }));

  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    members: { total: association.memberships.length, active: activeMembers, bureau: bureau.length },
    finance: {
      activitiesTreasury,
      walletBalance,
      memberAvoir,
      totalContributions,
      totalBenefits,
      loanOutstanding,
      loanDisbursed,
      interestGenerated,
      dividendInterest,
      aidsPaid,
      aidEngagements,
      netPosition,
      globalCash: activitiesTreasury + walletBalance,
    },
    activitiesCount: activities.length,
    openActivities: activities.filter((a) => a.status === "ACTIVE").length,
    closedActivities: activities.filter((a) => a.status !== "ACTIVE").length,
    sessionsCount,
  };

  const rows: Record<string, unknown>[] = [
    { Rubrique: "IDENTITÉ", Indicateur: "Association", Valeur: association.name, Détail: association.type },
    { Rubrique: "IDENTITÉ", Indicateur: "Statut", Valeur: association.status, Détail: `Créée le ${dateFr(association.createdAt)}` },
    { Rubrique: "IDENTITÉ", Indicateur: "Région / contact", Valeur: association.region ?? "—", Détail: [association.phone, association.email].filter(Boolean).join(" · ") || "—" },
    { Rubrique: "IDENTITÉ", Indicateur: "Confiance", Valeur: association.trustScore, Détail: `Niveau ${association.trustLevel}` },
    { Rubrique: "MEMBRES", Indicateur: "Membres suivis", Valeur: summary.members.total, Détail: `${activeMembers} actifs · ${bureau.length} au bureau` },
    { Rubrique: "TRÉSORERIE", Indicateur: "Caisse des activités", Valeur: activitiesTreasury, Détail: `${activities.length} activité(s)` },
    { Rubrique: "TRÉSORERIE", Indicateur: "Wallet association", Valeur: walletBalance, Détail: "Solde disponible" },
    { Rubrique: "TRÉSORERIE", Indicateur: "Trésorerie globale", Valeur: activitiesTreasury + walletBalance, Détail: "Caisse + wallet" },
    { Rubrique: "ENGAGEMENTS", Indicateur: "Avoirs des membres", Valeur: memberAvoir, Détail: `${memberAccountSum._count._all} compte(s) membre` },
    { Rubrique: "ENGAGEMENTS", Indicateur: "Aides à payer", Valeur: aidEngagements, Détail: "Demandes approuvées / en attente" },
    { Rubrique: "CRÉANCES", Indicateur: "Encours de prêts", Valeur: loanOutstanding, Détail: `${loans.filter((l) => ["ACTIVE", "APPROVED"].includes(l.status)).length} prêt(s) actif(s)` },
    { Rubrique: "CRÉANCES", Indicateur: "Prêts décaissés", Valeur: loanDisbursed, Détail: `${loans.length} prêt(s) suivis` },
    { Rubrique: "FLUX", Indicateur: "Cotisations encaissées", Valeur: totalContributions, Détail: `${contributions.reduce((s, c) => s + Number(c._count._all ?? 0), 0)} versement(s)` },
    { Rubrique: "FLUX", Indicateur: "Bénéfices distribués", Valeur: totalBenefits, Détail: `${beneficiaries.length} bénéficiaire(s)` },
    { Rubrique: "FLUX", Indicateur: "Intérêts générés", Valeur: interestGenerated, Détail: "Remboursements de prêts" },
    { Rubrique: "FLUX", Indicateur: "Dividendes calculés", Valeur: dividendInterest, Détail: `${dividendRuns.length} exercice(s)` },
    { Rubrique: "FLUX", Indicateur: "Aides payées", Valeur: aidsPaid, Détail: "Aides sociales réglées" },
    { Rubrique: "SYNTHÈSE", Indicateur: "Position nette", Valeur: netPosition, Détail: "Trésorerie + créances − avoirs − aides" },
    ...activities.map((activity) => ({
      Rubrique: "ACTIVITÉ",
      Indicateur: activity.name,
      Valeur: activity.caisseBalance,
      Détail: `${activity.status} · cotisations ${activity.contributionsPaid} · encours ${activity.outstandingLoans}`,
    })),
  ];

  return {
    association: {
      id: association.id,
      name: association.name,
      type: association.type,
      status: association.status,
      color: association.color,
      logo: association.logo,
      region: association.region,
      email: association.email,
      phone: association.phone,
      createdAt: association.createdAt,
      trustScore: association.trustScore,
      trustLevel: association.trustLevel,
      currency: association.wallet?.currency ?? "XAF",
    },
    bureau,
    accounts: association.accounts.map((a) => ({
      id: a.id,
      label: a.label,
      type: a.type,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      accountHolder: a.accountHolder,
      isDefault: a.isDefault,
    })),
    recentMeetings: association.meetings,
    summary,
    activities,
    rows,
    generatedAt,
  };
}
