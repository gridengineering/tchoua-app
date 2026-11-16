import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { checkAssociationEligibility, eligibilityJson } from "@/lib/association/eligibility";
import { arpErrorResponse, requireArpCapability } from "@/lib/arp/server";
import { bankOnlyPaymentError, isBankOnlyPaymentMode, isBankPaymentMethod } from "@/lib/payment-policy";
import {
  validateLoanToFundRatio,
  validateInterestRateCap,
  calculateLoanPriorityScore,
  API_ERROR_CODES,
} from "@/lib/association/rules";

const BUREAU_ROLES = ["PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "TREASURER"];

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: "ACTIVE" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership && !isPlatformAdmin(session)) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const isBureau = Boolean(membership && BUREAU_ROLES.includes(membership.role)) || isPlatformAdmin(session);

  const loans = await prisma.assocLoan.findMany({
    where: {
      activity: { associationId: id },
      ...(!isBureau && { borrowerMembershipId: membership?.id }),
    },
    include: {
      borrowerMembership: { include: { user: { select: { name: true, email: true } } } },
      activity: { select: { name: true, type: true } },
      repayments: { orderBy: { paidAt: "desc" } },
      approvals: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const loansWithStatus = loans.map((l) => {
    const isLate = l.status === "ACTIVE" && l.dueDate && new Date(l.dueDate) < now;
    const currentRate = isLate ? l.interestRate * 2 : l.interestRate;
    const joinedAt = l.borrowerMembership?.joinedAt
      ? new Date(l.borrowerMembership.joinedAt)
      : now;
    const seniorityMonths = Math.max(
      0,
      Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    const reliabilityScore = l.borrowerMembership?.reliabilityScore ?? 100;

    // SPECIFICATION.md §6.2 : Score d'arbitrage et de priorisation des demandes
    const priorityScore = calculateLoanPriorityScore({
      reliabilityScore,
      regularityRate: reliabilityScore,
      seniorityMonths,
      capitalContributed: 1,
      totalFundCapital: 1,
    });

    return {
      ...l,
      isLate,
      currentRate,
      priorityScore,
      repaidAmount: l.repayments.reduce((sum, r) => sum + r.amount, 0),
    };
  });

  return NextResponse.json({ loans: loansWithStatus });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  try {
    await requireArpCapability(id, "CREDIT");
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    throw error;
  }

  const body = await req.json();
  const { activityId, amount, duration, purpose, customRate } = body;

  if (!activityId || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(duration) || duration <= 0) {
    return NextResponse.json({ error: "activityId, amount et duration sont requis" }, { status: 400 });
  }

  // Simplified interest calculation: Amount * (1 + Rate * Duration / 100)
  const idempotencyKey = req.headers.get("idempotency-key")?.trim() || undefined;
  if (idempotencyKey) {
    const existing = await prisma.assocLoan.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.borrowerMembershipId !== membership.id || existing.activityId !== activityId ||
          existing.amount !== amount || existing.duration !== duration ||
          (existing.purpose ?? null) !== (purpose ?? null) ||
          (customRate !== undefined && existing.interestRate !== Number(customRate))) {
        return NextResponse.json({ error: "Clé de requête déjà utilisée pour une autre opération" }, { status: 409 });
      }
      return NextResponse.json({ loan: existing, replayed: true });
    }
  }

  const eligibility = await checkAssociationEligibility(session.user.id, id, { amount: Number(amount) });
  if (!eligibility.ok) {
    return NextResponse.json(eligibilityJson(eligibility), { status: 403 });
  }

  const activity = await prisma.associationActivity.findFirst({
    where: { id: activityId, associationId: id },
  });
  if (!activity) return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });

  const rate =
    customRate !== undefined
      ? Number(customRate)
      : duration <= 3
      ? (activity.loanRate1 ?? activity.caisseLoanRate ?? 5)
      : (activity.loanRate2 ?? activity.caisseLoanRate ?? 8);

  // R-022 : Taux d'intérêt plafonné à 10%/mois par défaut
  if (!Number.isFinite(rate) || rate < 0) return NextResponse.json({ error: "Taux invalide" }, { status: 400 });
  const rateCheck = validateInterestRateCap(rate);
  if (!rateCheck.valid) {
    return NextResponse.json({ error: rateCheck.error }, { status: 400 });
  }

  // R-021 : Le montant total des prêts actifs ne peut dépasser 80% des fonds totaux
  const ratioCheck = await validateLoanToFundRatio(id, prisma, Number(amount));
  if (!ratioCheck.valid) {
    return NextResponse.json(
      { error: ratioCheck.error, code: API_ERROR_CODES.ASSOC_006.code },
      { status: API_ERROR_CODES.ASSOC_006.httpStatus }
    );
  }

  if (activity.loanMaxActive) {
    const activeCount = await prisma.assocLoan.count({
      where: { borrowerMembershipId: membership.id, activityId, status: { in: ["ACTIVE", "APPROVED"] } },
    });
    if (activeCount >= activity.loanMaxActive) {
      return NextResponse.json({ error: `Maximum ${activity.loanMaxActive} prêt(s) actif(s) autorisé(s)` }, { status: 400 });
    }
  }

  // Simplified interest calculation: Amount * (1 + Rate * Duration / 100)
  const totalDue = Math.round(amount * (1 + (rate * duration) / 100));
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + duration);

  const loan = await prisma.assocLoan.create({
    data: {
      idempotencyKey,
      activityId,
      borrowerMembershipId: membership.id,
      amount,
      interestRate: rate,
      duration,
      totalDue,
      purpose,
      status: "PENDING",
      dueDate,
    },
    include: {
      borrowerMembership: { include: { user: { select: { name: true, email: true } } } },
      activity: { select: { name: true } },
    },
  });

  return NextResponse.json({ loan }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const membership = await getMembership(session.user.id, id);
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const body = await req.json();
  const { loanId, action, amount, paymentMethod } = body;
  const idempotencyKey = req.headers.get("idempotency-key")?.trim() || undefined;

  if (!loanId || !action) return NextResponse.json({ error: "loanId et action requis" }, { status: 400 });

  const loan = await prisma.assocLoan.findFirst({
    where: { id: loanId, activity: { associationId: id } },
    include: {
      activity: {
        select: {
          loanApprovalMode: true,
          association: { select: { bankConfig: true } },
        },
      },
    },
  });
  if (!loan) return NextResponse.json({ error: "Prêt introuvable" }, { status: 404 });

  if (action === "APPROVE") {
    const canApprove = BUREAU_ROLES.includes(membership.role) || isPlatformAdmin(session);
    if (!canApprove) {
      return NextResponse.json({ error: "Réservé aux membres du bureau" }, { status: 403 });
    }
    if (loan.status !== "PENDING") {
      return NextResponse.json({ error: "Ce prêt n'est plus en attente d'approbation" }, { status: 409 });
    }
    if (loan.borrowerMembershipId === membership.id && !isPlatformAdmin(session)) {
      return NextResponse.json({ error: "Un membre ne peut pas approuver son propre prêt" }, { status: 403 });
    }

    // R-021 : Vérifier le ratio prêts / fonds avant approbation
    const ratioCheck = await validateLoanToFundRatio(id, prisma, loan.amount);
    if (!ratioCheck.valid) {
      return NextResponse.json(
        { error: ratioCheck.error, code: API_ERROR_CODES.ASSOC_006.code },
        { status: API_ERROR_CODES.ASSOC_006.httpStatus }
      );
    }

    // R-023 : au-dessus de 500 000 FCFA, deux décisions réelles et distinctes
    // sont exigées. Le client ne peut plus contourner le contrôle en omettant
    // simplement le tableau `validators`.
    const requiredApprovals = loan.amount > 500_000 ? 2 : 1;

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM assoc_loans WHERE id = ${loanId} FOR UPDATE`;
        const current = await tx.assocLoan.findUnique({
          where: { id: loanId },
          include: { approvals: true },
        });
        if (!current) throw new Error("LOAN_NOT_FOUND");
        if (current.status !== "PENDING") throw new Error("LOAN_NOT_PENDING");

        const already = current.approvals.find((a) => a.membershipId === membership.id);
        if (already) throw new Error("LOAN_ALREADY_APPROVED_BY_ACTOR");

        await tx.assocLoanApproval.create({
          data: { loanId, membershipId: membership.id, decision: "APPROVE" },
        });
        const approvalCount = current.approvals.length + 1;

        if (approvalCount >= requiredApprovals) {
          await tx.assocLoan.update({
            where: { id: loanId },
            data: {
              status: "ACTIVE",
              approvedAt: new Date(),
              approvedById: session.user.id,
              disbursedAt: new Date(),
            },
          });
        }

        return { approvalCount, requiredApprovals, activated: approvalCount >= requiredApprovals };
      });

      return NextResponse.json({
        ok: true,
        ...result,
        requiresMoreApprovals: !result.activated,
        message: result.activated
          ? "Prêt approuvé et décaissé."
          : `Approbation enregistrée (${result.approvalCount}/${result.requiredApprovals}). Une autre décision du bureau est requise.`,
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return NextResponse.json({ error: "Vous avez déjà approuvé ce prêt" }, { status: 409 });
      }
      if (error?.message === "LOAN_NOT_PENDING") {
        return NextResponse.json({ error: "Ce prêt n'est plus en attente d'approbation" }, { status: 409 });
      }
      if (error?.message === "LOAN_ALREADY_APPROVED_BY_ACTOR") {
        return NextResponse.json({ error: "Vous avez déjà approuvé ce prêt" }, { status: 409 });
      }
      throw error;
    }
  }

  if (action === "REPAY") {
    const bankOnly = isBankOnlyPaymentMode(loan.activity.association?.bankConfig);
    const effectivePaymentMethod = paymentMethod ?? (bankOnly ? "BANK_TRANSFER" : "CASH");
    if (bankOnly && !isBankPaymentMethod(effectivePaymentMethod)) {
      return NextResponse.json(bankOnlyPaymentError(), { status: 422 });
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Le montant doit être strictement positif" }, { status: 400 });
    }

    const isBorrower = loan.borrowerMembershipId === membership.id;
    const canRepay = isBorrower || BUREAU_ROLES.includes(membership.role) || isPlatformAdmin(session);
    if (!canRepay) {
      return NextResponse.json({ error: "Vous ne pouvez pas rembourser ce prêt" }, { status: 403 });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM assoc_loans WHERE id = ${loanId} FOR UPDATE`;
        const current = await tx.assocLoan.findUnique({
          where: { id: loanId },
          include: { repayments: true },
        });
        if (!current) throw new Error("LOAN_NOT_FOUND");
        if (idempotencyKey) {
          const replay = await tx.assocLoanRepayment.findUnique({ where: { idempotencyKey } });
          if (replay) {
            if (replay.loanId !== loanId || replay.amount !== numericAmount || replay.paymentMethod !== effectivePaymentMethod) {
              throw new Error("IDEMPOTENCY_CONFLICT");
            }
            const paid = current.repayments.reduce((sum, r) => sum + r.amount, 0);
            return { remaining: current.status === "REPAID" ? 0 : Math.max(0, current.totalDue - paid), repaidNow: replay.amount, replayed: true };
          }
        }
        if (current.status !== "ACTIVE") throw new Error("LOAN_NOT_ACTIVE");

        const alreadyPaid = current.repayments.reduce((sum, r) => sum + r.amount, 0);
        const isLate = current.dueDate && new Date(current.dueDate) < new Date();
        const initialInterest = current.totalDue - current.amount;
        const effectiveTotalDue = isLate ? current.totalDue + initialInterest : current.totalDue;
        const remaining = Math.max(0, effectiveTotalDue - alreadyPaid);
        if (remaining <= 0) throw new Error("LOAN_ALREADY_REPAID");
        if (numericAmount > remaining) throw new Error("LOAN_OVERPAY");

        const principal = Math.round(numericAmount * (current.amount / effectiveTotalDue));
        const interest = numericAmount - principal;

        await tx.assocLoanRepayment.create({
          data: {
            idempotencyKey,
            loanId,
            amount: numericAmount,
            principal,
            interest,
            paymentMethod: effectivePaymentMethod,
            paidAt: new Date(),
          },
        });

        const newTotal = alreadyPaid + numericAmount;
        if (newTotal >= effectiveTotalDue) {
          await tx.assocLoan.update({
            where: { id: loanId },
            data: { status: "REPAID", repaidAt: new Date() },
          });
        }

        return { remaining: Math.max(0, effectiveTotalDue - newTotal), repaidNow: numericAmount };
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (error: any) {
      if (error?.message === "IDEMPOTENCY_CONFLICT") return NextResponse.json({ error: "Clé de requête déjà utilisée pour une autre opération" }, { status: 409 });
      if (error?.message === "LOAN_OVERPAY") {
        return NextResponse.json({ error: "Le montant dépasse le solde restant du prêt" }, { status: 400 });
      }
      if (error?.message === "LOAN_ALREADY_REPAID") {
        return NextResponse.json({ error: "Ce prêt est déjà entièrement remboursé" }, { status: 409 });
      }
      if (error?.message === "LOAN_NOT_ACTIVE") {
        return NextResponse.json({ error: "Seul un prêt actif peut être remboursé" }, { status: 409 });
      }
      throw error;
    }
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
