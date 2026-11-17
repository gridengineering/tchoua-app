import { prisma } from "@/lib/prisma";

export const MEMBER_ACCOUNT_BUREAU_ROLES = [
  "FOUNDER",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
] as const;

export function isAssociationBureau(role?: string | null): boolean {
  return MEMBER_ACCOUNT_BUREAU_ROLES.includes((role ?? "") as (typeof MEMBER_ACCOUNT_BUREAU_ROLES)[number]);
}

export type BankConfigLike = {
  cashEnabled?: boolean;
  cashMaxAmount?: number;
  cashLimit?: number;
  bankName?: string;
  rib?: string;
  accountHolder?: string;
  paymentMode?: string;
};

export function parseBankConfig(value?: string | null): BankConfigLike {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function cashPolicy(bankConfig: BankConfigLike, providerMax?: number | null): { enabled: boolean; max: number } {
  const enabled = bankConfig.cashEnabled !== false;
  const local = Number(bankConfig.cashMaxAmount ?? bankConfig.cashLimit ?? 0);
  const global = Number(providerMax ?? 0);
  const candidates = [local, global].filter((n) => Number.isFinite(n) && n > 0);
  return { enabled, max: candidates.length ? Math.min(...candidates) : 0 };
}

export async function ensureMemberAccount(
  tx: any,
  membership: { id: string; associationId: string },
  currency = "XAF"
) {
  return tx.associationMemberAccount.upsert({
    where: { membershipId: membership.id },
    update: { updatedAt: new Date() },
    create: {
      membershipId: membership.id,
      associationId: membership.associationId,
      balance: 0,
      currency,
      status: "ACTIVE",
    },
  });
}

export function accountCurrency(value?: string | null): string {
  return value === "FCFA" ? "XAF" : value || "XAF";
}

export async function memberAccountForMembership(membershipId: string) {
  const account = await prisma.associationMemberAccount.findUnique({
    where: { membershipId },
  });
  return account;
}

/**
 * Crédite l'AVOIR d'un membre pour un versement interne (tontine, prêt,
 * transfert d'activité). Utilisable dans une transaction Prisma.
 */
export async function creditMemberAccount(
  tx: any,
  params: {
    membershipId: string;
    associationId: string;
    amount: number;
    type: string;
    method?: string;
    activityId?: string | null;
    sessionId?: string | null;
    reference?: string | null;
    note?: string | null;
    createdById?: string | null;
    currency?: string;
    idempotencyKey?: string | null;
  }
) {
  const account = await tx.associationMemberAccount.upsert({
    where: { membershipId: params.membershipId },
    update: { updatedAt: new Date() },
    create: {
      membershipId: params.membershipId,
      associationId: params.associationId,
      balance: 0,
      currency: params.currency ?? "XAF",
      status: "ACTIVE",
    },
  });
  const nextBalance = Number(account.balance) + Number(params.amount);
  await tx.associationMemberAccount.update({ where: { id: account.id }, data: { balance: nextBalance } });
  const transaction = await tx.associationMemberTransaction.create({
    data: {
      idempotencyKey: params.idempotencyKey ?? undefined,
      accountId: account.id,
      membershipId: params.membershipId,
      associationId: params.associationId,
      activityId: params.activityId ?? null,
      sessionId: params.sessionId ?? null,
      type: params.type,
      direction: "IN",
      method: params.method ?? "SYSTEM",
      amount: Number(params.amount),
      balanceAfter: nextBalance,
      status: "COMPLETED",
      reference: params.reference ?? null,
      note: params.note ?? null,
      createdById: params.createdById ?? null,
    },
  });
  return { account: { ...account, balance: nextBalance }, transaction };
}
