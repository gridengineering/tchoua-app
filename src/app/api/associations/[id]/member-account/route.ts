import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletConfig } from "@/lib/wallet/config";
import { notifyAssociationMovement } from "@/lib/notifications/funds";
import {
  accountCurrency,
  cashPolicy,
  ensureMemberAccount,
  isAssociationBureau,
  parseBankConfig,
} from "@/lib/association/member-account";

type TargetMembership = {
  id: string;
  associationId: string;
  userId: string;
  role: string;
  status: string;
  memberNumber?: string | null;
  user: { id: string; name: string; email: string | null; language: string; kycLevel: number };
};

async function getMembership(associationId: string, userId: string): Promise<TargetMembership | null> {
  return prisma.associationMembership.findFirst({
    where: { associationId, userId, status: { in: ["ACTIVE", "PENDING", "SUSPENDED"] } },
    select: {
      id: true, associationId: true, userId: true, role: true, status: true, memberNumber: true,
      user: { select: { id: true, name: true, email: true, language: true, kycLevel: true } },
    },
  }) as Promise<TargetMembership | null>;
}

async function targetFor(body: any, me: TargetMembership, canManage: boolean) {
  const requested = body?.membershipId ? String(body.membershipId) : me.id;
  if (requested === me.id) return me;
  if (!canManage) return null;
  return prisma.associationMembership.findFirst({
    where: { id: requested, associationId: me.associationId, status: { not: "LEFT" } },
    select: {
      id: true, associationId: true, userId: true, role: true, status: true, memberNumber: true,
      user: { select: { id: true, name: true, email: true, language: true, kycLevel: true } },
    },
  }) as Promise<TargetMembership | null>;
}

function dateFilter(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function txWhere(associationId: string, membershipId: string | null, search: URLSearchParams) {
  const where: any = { associationId };
  if (membershipId) where.membershipId = membershipId;
  const activityId = search.get("activityId");
  const sessionId = search.get("sessionId");
  const method = search.get("method");
  const status = search.get("status");
  const from = dateFilter(search.get("from"));
  const to = dateFilter(search.get("to"));
  if (activityId) where.activityId = activityId;
  if (sessionId) where.sessionId = sessionId;
  if (method) where.method = method.toUpperCase();
  if (status) where.status = status.toUpperCase();
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: new Date(to.getTime() + 86_399_999) } : {}) };
  return where;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId } = await params;
  const me = await getMembership(associationId, session.user.id);
  if (!me) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const canManage = isAssociationBureau(me.role);
  const search = new URL(req.url).searchParams;
  const requestedMembershipId = search.get("membershipId");
  let target = me;
  if (requestedMembershipId && requestedMembershipId !== me.id) {
    if (!canManage) return NextResponse.json({ error: "Accès réservé au bureau" }, { status: 403 });
    const found = await prisma.associationMembership.findFirst({
      where: { id: requestedMembershipId, associationId, status: { not: "LEFT" } },
      select: { id: true, associationId: true, userId: true, role: true, status: true, memberNumber: true, user: { select: { id: true, name: true, email: true, kycLevel: true } } },
    });
    if (!found) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    target = found as TargetMembership;
  }

  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { bankConfig: true, name: true },
  });
  const walletConfig = await getWalletConfig();
  const cashProvider = walletConfig.providers.find((p) => p.type === "CASH");
  const cash = cashPolicy(parseBankConfig(association?.bankConfig), cashProvider?.max);
  const currency = accountCurrency(walletConfig.currency);

  const account = await ensureMemberAccount(prisma, target, currency);
  const where = txWhere(associationId, canManage && search.get("scope") === "association" ? null : target.id, search);
  const [transactions, wallet, activities, bankAccounts, aggregate, members, sessions] = await Promise.all([
    prisma.associationMemberTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(search.get("limit") ?? 100) || 100, 500),
      include: {
        activity: { select: { id: true, name: true, type: true } },
        bankAccount: { select: { id: true, label: true, bankName: true, accountNumber: true } },
        membership: { select: { id: true, memberNumber: true, role: true, user: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.wallet.findUnique({ where: { userId: target.userId } }),
    prisma.associationActivity.findMany({ where: { associationId }, select: { id: true, name: true, type: true, caisseBalance: true }, orderBy: { sortOrder: "asc" } }),
    prisma.assocBankAccount.findMany({ where: { associationId }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.associationMemberTransaction.groupBy({ by: ["direction"], where, _sum: { amount: true } }).catch(() => []),
    canManage
      ? prisma.associationMembership.findMany({
          where: { associationId, status: { not: "LEFT" } },
          select: { id: true, memberNumber: true, role: true, user: { select: { id: true, name: true, email: true } } },
          orderBy: [{ joinedAt: "asc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
    prisma.assocMeeting.findMany({
      where: { associationId },
      select: { id: true, title: true, scheduledAt: true, type: true },
      orderBy: { scheduledAt: "desc" },
      take: 24,
    }),
  ]);

  const totalIn = Number((aggregate as any[]).find((x) => x.direction === "IN")?._sum?.amount ?? 0);
  const totalOut = Number((aggregate as any[]).find((x) => x.direction === "OUT")?._sum?.amount ?? 0);
  const pending = await prisma.associationMemberTransaction.count({
    where: { associationId, status: "PENDING", ...(canManage ? {} : { membershipId: target.id }) },
  });

  return NextResponse.json({
    association: { id: associationId, name: association?.name, currency, cash },
    me: { id: me.id, role: me.role },
    target: { id: target.id, name: target.user.name, email: target.user.email, memberNumber: (target as any).memberNumber ?? null },
    account,
    wallet: wallet ? { balance: wallet.balance, currency: accountCurrency(wallet.currency) } : null,
    transactions,
    activities,
    bankAccounts,
    members,
    sessions,
    canManage,
    cashProvider: cashProvider ? { enabled: cashProvider.enabled, max: cashProvider.max } : null,
    summary: { totalIn, totalOut, count: transactions.length, pending },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId } = await params;
  const me = await getMembership(associationId, session.user.id);
  if (!me) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  if (me.status !== "ACTIVE") return NextResponse.json({ error: "Adhésion active requise" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "").toUpperCase();
  const motif = String(body.motif ?? body.libelle ?? body.note ?? "").trim();
  const canManage = isAssociationBureau(me.role);
  const target = await targetFor(body, me, canManage);
  if (!target) return NextResponse.json({ error: "Membre cible invalide" }, { status: 403 });

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  const requiresMotif = ["DEPOSIT_WALLET", "DEPOSIT_BANK", "DEPOSIT_CASH", "WITHDRAW", "SETTLE", "ACTIVITY_TO_MEMBER"].includes(action);
  if (requiresMotif && !motif) return NextResponse.json({ error: "Le libellé ou motif est obligatoire" }, { status: 400 });
  const idempotencyKey = req.headers.get("idempotency-key")?.trim() || body.idempotencyKey || undefined;
  if (idempotencyKey) {
    const existing = await prisma.associationMemberTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.membershipId !== target.id || existing.amount !== amount || existing.type !== action) {
        return NextResponse.json({ error: "Clé d'idempotence déjà utilisée" }, { status: 409 });
      }
      const account = await prisma.associationMemberAccount.findUnique({ where: { membershipId: target.id } });
      return NextResponse.json({ transaction: existing, account, replayed: true });
    }
  }

  const association = await prisma.association.findUnique({ where: { id: associationId }, select: { bankConfig: true, name: true } });
  const walletConfig = await getWalletConfig();
  const cashProvider = walletConfig.providers.find((p) => p.type === "CASH");
  const cash = cashPolicy(parseBankConfig(association?.bankConfig), cashProvider?.max);
  const currency = accountCurrency(walletConfig.currency);

  const announce = (kind: Parameters<typeof notifyAssociationMovement>[0]["kind"], opts: {
    method: string;
    balance?: number | null;
    proofUrl?: string | null;
    activityName?: string | null;
    actorName?: string;
  }) => notifyAssociationMovement({
    associationId,
    associationName: association?.name ?? "Association",
    actorMembershipId: me.id,
    actorName: me.user.name,
    target: {
      id: target.userId,
      name: target.user.name,
      email: target.user.email,
      language: target.user.language,
    },
    amount,
    currency,
    motif: motif || "Mouvement de fonds",
    method: opts.method,
    balance: opts.balance ?? null,
    proofUrl: opts.proofUrl ?? null,
    activityName: opts.activityName ?? null,
    kind,
  }).catch(() => null);

  try {
    if (action === "DEPOSIT_WALLET") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: target.userId } });
      if (!wallet || wallet.status !== "ACTIVE") throw new Error("Wallet membre introuvable ou suspendu");
      if (wallet.balance < amount) throw new Error("Solde insuffisant dans votre wallet");
      const result = await prisma.$transaction(async (tx) => {
        const account = await ensureMemberAccount(tx, target, currency);
        const nextBalance = account.balance + amount;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
        await tx.walletTransaction.create({ data: { walletId: wallet.id, amount, feeAmount: 0, netAmount: amount, type: "TRANSFER_OUT", status: "COMPLETED", description: motif || `Versement compte association ${associationId}`, associationId } });
        await tx.associationMemberAccount.update({ where: { id: account.id }, data: { balance: nextBalance } });
        const transaction = await tx.associationMemberTransaction.create({ data: { idempotencyKey, accountId: account.id, membershipId: target.id, associationId, type: "DEPOSIT_WALLET", direction: "IN", method: "WALLET", amount, balanceAfter: nextBalance, status: "COMPLETED", reference: body.reference || null, note: motif || null, createdById: session.user.id } });
        return { account: { ...account, balance: nextBalance }, transaction };
      });
      await announce("ASSOC_DEPOSIT", { method: "WALLET", balance: result.account.balance });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "DEPOSIT_BANK") {
      const bankAccountId = String(body.bankAccountId ?? "");
      if (!bankAccountId) throw new Error("Sélectionnez le compte bancaire de l'association");
      const bank = await prisma.assocBankAccount.findFirst({ where: { id: bankAccountId, associationId } });
      if (!bank) throw new Error("Compte bancaire étranger à l'association");
      if (!body.proofUrl) throw new Error("La preuve de transaction est obligatoire pour un versement bancaire");
      const account = await ensureMemberAccount(prisma, target, currency);
      const transaction = await prisma.associationMemberTransaction.create({ data: { idempotencyKey, accountId: account.id, membershipId: target.id, associationId, bankAccountId, type: "DEPOSIT_BANK", direction: "IN", method: "BANK", amount, balanceAfter: account.balance, status: "PENDING", reference: body.reference || null, proofUrl: String(body.proofUrl), note: motif || null, createdById: session.user.id } });
      await announce("ASSOC_PENDING", { method: "BANK", proofUrl: transaction.proofUrl });
      return NextResponse.json({ account, transaction, pending: true, message: "Preuve enregistrée. Le bureau doit confirmer le rapprochement." }, { status: 201 });
    }

    if (["DEPOSIT_CASH", "WITHDRAW", "CONFIRM_BANK", "ACTIVITY_TO_MEMBER", "RECONCILE"].includes(action) && !canManage) {
      return NextResponse.json({ error: "Seul le bureau peut effectuer cette opération" }, { status: 403 });
    }

    if (action === "DEPOSIT_CASH") {
      if (!cashProvider?.enabled || !cash.enabled) throw new Error("Les espèces sont désactivées par l'administration");
      if (cash.max > 0 && amount > cash.max) throw new Error(`Montant espèces maximum : ${cash.max.toLocaleString("fr-FR")} ${currency}`);
      const result = await prisma.$transaction(async (tx) => {
        const account = await ensureMemberAccount(tx, target, currency);
        const nextBalance = account.balance + amount;
        await tx.associationMemberAccount.update({ where: { id: account.id }, data: { balance: nextBalance } });
        const transaction = await tx.associationMemberTransaction.create({ data: { idempotencyKey, accountId: account.id, membershipId: target.id, associationId, type: "DEPOSIT_CASH", direction: "IN", method: "CASH", amount, balanceAfter: nextBalance, status: "COMPLETED", reference: body.reference || null, proofUrl: body.proofUrl || null, note: motif || null, createdById: session.user.id, reconciledAt: new Date(), reconciledById: session.user.id } });
        return { account: { ...account, balance: nextBalance }, transaction };
      });
      await announce("ASSOC_DEPOSIT", { method: "CASH", balance: result.account.balance, proofUrl: result.transaction.proofUrl });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "CONFIRM_BANK" || action === "RECONCILE") {
      const transactionId = String(body.transactionId ?? "");
      if (!transactionId) throw new Error("transactionId requis");
      const pending = await prisma.associationMemberTransaction.findFirst({ where: { id: transactionId, associationId } });
      if (!pending) throw new Error("Transaction introuvable");
      if (pending.status !== "PENDING") throw new Error("Transaction déjà traitée");
      if (pending.membershipId !== target.id) throw new Error("Cette transaction appartient à un autre membre");
      if (pending.type !== "DEPOSIT_BANK") throw new Error("Seuls les versements bancaires en attente peuvent être confirmés");
      const result = await prisma.$transaction(async (tx) => {
        const account = await ensureMemberAccount(tx, target, currency);
        const nextBalance = account.balance + pending.amount;
        await tx.associationMemberAccount.update({ where: { id: account.id }, data: { balance: nextBalance } });
        const transaction = await tx.associationMemberTransaction.update({ where: { id: pending.id }, data: { status: "COMPLETED", balanceAfter: nextBalance, reconciledAt: new Date(), reconciledById: session.user.id } });
        return { account: { ...account, balance: nextBalance }, transaction };
      });
      await announce("ASSOC_CONFIRM", { method: pending.method, balance: result.account.balance, proofUrl: pending.proofUrl });
      return NextResponse.json(result);
    }

    if (action === "WITHDRAW") {
      const method = String(body.method ?? "WALLET").toUpperCase();
      if (!["WALLET", "BANK", "CASH"].includes(method)) throw new Error("Moyen de retrait invalide");
      if (method === "CASH" && (!cashProvider?.enabled || !cash.enabled)) throw new Error("Les espèces sont désactivées");
      if (method === "BANK" && !body.bankAccountId) throw new Error("Compte bancaire requis");
      if (method === "BANK" && !body.proofUrl) throw new Error("Preuve de virement obligatoire");
      const account = await ensureMemberAccount(prisma, target, currency);
      if (account.balance < amount) throw new Error("Solde AVOIR insuffisant");
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.associationMemberAccount.findUnique({ where: { id: account.id } });
        if (!current || current.balance < amount) throw new Error("Solde AVOIR insuffisant");
        const nextBalance = current.balance - amount;
        await tx.associationMemberAccount.update({ where: { id: account.id }, data: { balance: nextBalance } });
        if (method === "WALLET") {
          const wallet = await tx.wallet.findUnique({ where: { userId: target.userId } });
          if (!wallet || wallet.status !== "ACTIVE") throw new Error("Wallet membre introuvable ou suspendu");
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
          await tx.walletTransaction.create({ data: { walletId: wallet.id, amount, feeAmount: 0, netAmount: amount, type: "TRANSFER_IN", status: "COMPLETED", description: motif || `Retrait AVOIR association ${associationId}`, associationId } });
        }
        const transaction = await tx.associationMemberTransaction.create({ data: { idempotencyKey, accountId: account.id, membershipId: target.id, associationId, bankAccountId: body.bankAccountId || null, type: `WITHDRAWAL_${method}`, direction: "OUT", method, amount, balanceAfter: nextBalance, status: "COMPLETED", reference: body.reference || null, proofUrl: body.proofUrl || null, note: motif || null, createdById: session.user.id, reconciledAt: method === "BANK" ? null : new Date(), reconciledById: session.user.id } });
        return { account: { ...current, balance: nextBalance }, transaction };
      });
      await announce("ASSOC_PAYOUT", { method, balance: result.account.balance, proofUrl: result.transaction.proofUrl });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "SETTLE") {
      const account = await ensureMemberAccount(prisma, target, currency);
      if (account.balance < amount) throw new Error("Solde AVOIR insuffisant");
      const activityId = body.activityId ? String(body.activityId) : null;
      const loanId = body.loanId ? String(body.loanId) : null;
      if (!activityId && !loanId) throw new Error("Choisissez une activité ou un prêt à régler");
      let activityLabel: string | null = null;
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.associationMemberAccount.findUnique({ where: { id: account.id } });
        if (!current || current.balance < amount) throw new Error("Solde AVOIR insuffisant");
        const nextBalance = current.balance - amount;
        let label = "Règlement engagement";
        if (activityId) {
          const activity = await tx.associationActivity.findFirst({ where: { id: activityId, associationId } });
          if (!activity) throw new Error("Activité étrangère à l'association");
          await tx.associationActivity.update({ where: { id: activityId }, data: { caisseBalance: { increment: amount } } });
          await tx.activityContribution.create({ data: { activityId, membershipId: target.id, amount, unit: "CASH", status: "PAID", paymentMethod: "MEMBER_ACCOUNT", reference: body.reference || null, notes: motif || "Règlement depuis le compte association", paidAt: new Date() } });
          label = `Règlement ${activity.name}`;
          activityLabel = activity.name;
        }
        if (loanId) {
          const loan = await tx.assocLoan.findFirst({ where: { id: loanId, activity: { associationId } } });
          if (!loan) throw new Error("Prêt introuvable");
          await tx.assocLoanRepayment.create({ data: { loanId, amount, paymentMethod: "MEMBER_ACCOUNT", reference: body.reference || null } });
          const paid = await tx.assocLoanRepayment.aggregate({ where: { loanId }, _sum: { amount: true } });
          if (Number(paid._sum.amount ?? 0) >= loan.totalDue) await tx.assocLoan.update({ where: { id: loanId }, data: { status: "REPAID", repaidAt: new Date() } });
          label = "Remboursement prêt";
        }
        await tx.associationMemberAccount.update({ where: { id: account.id }, data: { balance: nextBalance } });
        const transaction = await tx.associationMemberTransaction.create({ data: { idempotencyKey, accountId: account.id, membershipId: target.id, associationId, activityId, type: "SETTLEMENT", direction: "OUT", method: "ACTIVITY", amount, balanceAfter: nextBalance, status: "COMPLETED", reference: body.reference || null, note: motif || label, createdById: session.user.id } });
        return { account: { ...current, balance: nextBalance }, transaction };
      });
      await announce("ASSOC_SETTLE", { method: "ACTIVITY", balance: result.account.balance, activityName: activityLabel });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "ACTIVITY_TO_MEMBER") {
      const activityId = String(body.activityId ?? "");
      const activity = await prisma.associationActivity.findFirst({ where: { id: activityId, associationId } });
      if (!activity) throw new Error("Activité étrangère à l'association");
      if (activity.caisseBalance < amount) throw new Error("Solde de l'activité insuffisant");
      const result = await prisma.$transaction(async (tx) => {
        const account = await ensureMemberAccount(tx, target, currency);
        const nextBalance = account.balance + amount;
        await tx.associationActivity.update({ where: { id: activityId }, data: { caisseBalance: { decrement: amount } } });
        await tx.associationMemberAccount.update({ where: { id: account.id }, data: { balance: nextBalance } });
        const transaction = await tx.associationMemberTransaction.create({ data: { idempotencyKey, accountId: account.id, membershipId: target.id, associationId, activityId, type: "ACTIVITY_TRANSFER", direction: "IN", method: "ACTIVITY", amount, balanceAfter: nextBalance, status: "COMPLETED", reference: body.reference || null, note: motif || `Transfert depuis ${activity.name}`, createdById: session.user.id } });
        return { account: { ...account, balance: nextBalance }, transaction };
      });
      await announce("ASSOC_ACTIVITY", { method: "ACTIVITY", balance: result.account.balance, activityName: activity.name });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Opération impossible" }, { status: 400 });
  }
}
