export type RepaymentAllocation = {
  ok: boolean;
  error?: string;
  interestPaid: number;
  principalPaid: number;
  remainingDue: number;
};

/**
 * REC01 : Impute un paiement confirmé sans jamais dépasser le montant reçu non affecté.
 * Les intérêts exigibles sont imputés en priorité avant le principal.
 */
export function allocateLoanRepayment(params: {
  dueAmount: number;
  interestDue: number;
  receivedAmount: number;
  alreadyAllocated?: number;
}): RepaymentAllocation {
  const { dueAmount, interestDue, receivedAmount, alreadyAllocated = 0 } = params;
  const available = receivedAmount - alreadyAllocated;
  if (available <= 0) {
    return {
      ok: false,
      error: "PAYMENT_ALREADY_ALLOCATED",
      interestPaid: 0,
      principalPaid: 0,
      remainingDue: dueAmount,
    };
  }

  const toApply = Math.min(available, dueAmount);
  const interestPaid = Math.min(interestDue, toApply);
  const principalPaid = Math.max(0, toApply - interestPaid);
  const remainingDue = Math.max(0, dueAmount - toApply);

  return {
    ok: true,
    interestPaid,
    principalPaid,
    remainingDue,
  };
}

/**
 * REC02 : Calcule une pénalité contractuelle avec plafond explicite.
 */
export function calculateCappedPenalty(params: {
  baseAmount: number;
  ratePct: number;
  capAmount?: number;
}): number {
  const { baseAmount, ratePct, capAmount } = params;
  const raw = Math.round((baseAmount * ratePct) / 100);
  if (capAmount !== undefined && capAmount >= 0) {
    return Math.min(raw, capAmount);
  }
  return raw;
}

export type RestructuredSchedule = {
  version: number;
  restructuredAt: string;
  original: {
    dueDate: string;
    amount: number;
    paidSoFar: number;
    arrears: number;
  };
  newSchedule: {
    dueDate: string;
    remainingPrincipal: number;
    interestRate: number;
    extensionMonths: number;
  };
};

/**
 * REC03 : Restructure un prêt en conservant l'ancien échéancier, les retards et les paiements réels.
 */
export function buildRestructuredSchedule(params: {
  previousVersion?: number;
  originalDueDate: string;
  originalAmount: number;
  paidSoFar: number;
  arrears: number;
  extensionMonths: number;
  newRate: number;
  nowIso?: string;
}): RestructuredSchedule {
  const baseDate = new Date(params.originalDueDate);
  const nextDue = new Date(baseDate);
  nextDue.setMonth(nextDue.getMonth() + params.extensionMonths);

  return {
    version: (params.previousVersion ?? 1) + 1,
    restructuredAt: params.nowIso ?? new Date().toISOString(),
    original: {
      dueDate: params.originalDueDate,
      amount: params.originalAmount,
      paidSoFar: params.paidSoFar,
      arrears: params.arrears,
    },
    newSchedule: {
      dueDate: nextDue.toISOString(),
      remainingPrincipal: Math.max(0, params.originalAmount - params.paidSoFar),
      interestRate: params.newRate,
      extensionMonths: params.extensionMonths,
    },
  };
}

/**
 * REC04 : Enregistre un recouvrement après passage en perte de manière tracée.
 */
export function recordPostLossRecovery(params: {
  loanId: string;
  writtenOffAmount: number;
  recoveredAmount: number;
  reference: string;
  nowIso?: string;
}) {
  if (params.recoveredAmount <= 0) {
    throw new Error("INVALID_RECOVERY_AMOUNT");
  }
  return {
    type: "POST_LOSS_RECOVERY" as const,
    loanId: params.loanId,
    amount: params.recoveredAmount,
    remainingWrittenOff: Math.max(0, params.writtenOffAmount - params.recoveredAmount),
    reference: params.reference,
    recordedAt: params.nowIso ?? new Date().toISOString(),
  };
}
