import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertSameCurrency, formatMoney, toMinor } from "./money";
import { computeFundAvailable } from "./finance";
import { ArpError } from "./server";
import type { ArpFundPayload, ArpFundType, ArpMovementPayload, ArpReservationPayload } from "./types";

const ZERO = BigInt(0);

export type FundRow = {
  id: string;
  associationId: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  activityId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FundMovementRow = {
  id: string;
  direction: string;
  amountMinor: bigint;
  currency: string;
  valueDate: Date;
  occurredAt: Date;
  sourceType: string;
  sourceId: string | null;
  description: string;
  createdAt: Date;
};

export type FundReservationRow = {
  id: string;
  amountMinor: bigint;
  currency: string;
  purpose: string;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
};

export function parseMajorToMinor(raw: unknown, currency: string): bigint {
  if (raw === undefined || raw === null || raw === "") {
    throw new ArpError("Le montant est requis.", "ARP_AMOUNT_REQUIRED", 400);
  }
  try {
    const value = toMinor(raw as number | string, currency);
    if (value <= ZERO) throw new Error("Le montant doit être strictement positif.");
    return value;
  } catch (error) {
    throw new ArpError(
      error instanceof Error ? error.message : "Montant invalide.",
      "ARP_AMOUNT_INVALID",
      400
    );
  }
}

async function lockFund(tx: Prisma.TransactionClient, fundId: string): Promise<FundRow> {
  const rows = await tx.$queryRaw<FundRow[]>`
    SELECT id, "associationId", code, name, type, currency, "activityId", status,
           "createdAt", "updatedAt"
    FROM arp_funds WHERE id = ${fundId} FOR UPDATE
  `;
  if (!rows[0]) throw new ArpError("Fonds introuvable.", "ARP_FUND_NOT_FOUND", 404);
  return rows[0];
}

export async function getFundState(
  fund: FundRow,
  db: Prisma.TransactionClient | typeof prisma = prisma,
  includeDetails = false
) {
  const [inflow, outflow, reserved, movements, reservations] = await Promise.all([
    db.arpFundMovement.aggregate({
      where: { fundId: fund.id, direction: "IN" },
      _sum: { amountMinor: true },
    }),
    db.arpFundMovement.aggregate({
      where: { fundId: fund.id, direction: "OUT" },
      _sum: { amountMinor: true },
    }),
    db.arpFundReservation.aggregate({
      where: { fundId: fund.id, status: "ACTIVE" },
      _sum: { amountMinor: true },
    }),
    includeDetails
      ? db.arpFundMovement.findMany({
          where: { fundId: fund.id },
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
          take: 60,
        })
      : Promise.resolve([]),
    includeDetails
      ? db.arpFundReservation.findMany({
          where: { fundId: fund.id },
          orderBy: [{ createdAt: "desc" }],
          take: 40,
        })
      : Promise.resolve([]),
  ]);

  const balance = (inflow._sum.amountMinor ?? ZERO) - (outflow._sum.amountMinor ?? ZERO);
  const reservedMinor = reserved._sum.amountMinor ?? ZERO;
  const available = computeFundAvailable({ balanceMinor: balance, reservedMinor });

  return { balance, reservedMinor, available, movements, reservations };
}

export async function serializeFund(
  fund: FundRow,
  includeDetails = false
): Promise<ArpFundPayload> {
  const state = await getFundState(fund, prisma, includeDetails);
  return {
    id: fund.id,
    associationId: fund.associationId,
    code: fund.code,
    name: fund.name,
    type: fund.type as ArpFundType,
    currency: fund.currency,
    activityId: fund.activityId,
    status: fund.status,
    balanceMinor: state.balance.toString(),
    reservedMinor: state.reservedMinor.toString(),
    availableMinor: state.available.toString(),
    movements: includeDetails
      ? state.movements.map((m) => serializeMovement(m as FundMovementRow))
      : undefined,
    reservations: includeDetails
      ? state.reservations.map((r) => serializeReservation(r as FundReservationRow))
      : undefined,
  };
}

export function serializeMovement(m: FundMovementRow): ArpMovementPayload {
  return {
    id: m.id,
    direction: m.direction as "IN" | "OUT",
    amountMinor: m.amountMinor.toString(),
    currency: m.currency,
    valueDate: m.valueDate.toISOString(),
    occurredAt: m.occurredAt.toISOString(),
    sourceType: m.sourceType,
    sourceId: m.sourceId,
    description: m.description,
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeReservation(r: FundReservationRow): ArpReservationPayload {
  return {
    id: r.id,
    amountMinor: r.amountMinor.toString(),
    currency: r.currency,
    purpose: r.purpose,
    status: r.status as ArpReservationPayload["status"],
    expiresAt: r.expiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function createFund(input: {
  associationId: string;
  code: string;
  name: string;
  type: ArpFundType;
  currency: string;
  activityId?: string | null;
  userId: string;
}) {
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(code)) {
    throw new ArpError(
      "Le code du fonds doit comporter 2 à 32 caractères (lettres, chiffres, tiret, souligné).",
      "ARP_FUND_CODE_INVALID",
      400
    );
  }
  if (!input.name.trim()) {
    throw new ArpError("Le nom du fonds est requis.", "ARP_FUND_NAME_REQUIRED", 400);
  }
  if (!["LIBRE", "AFFECTE", "RESERVE", "DEPOT"].includes(input.type)) {
    throw new ArpError("Type de fonds inconnu.", "ARP_FUND_TYPE_INVALID", 400);
  }
  if (!/^[A-Z]{3}$/.test(input.currency)) {
    throw new ArpError("Devise du fonds invalide.", "ARP_FUND_CURRENCY_INVALID", 400);
  }
  if (input.activityId) {
    const activity = await prisma.associationActivity.findFirst({
      where: { id: input.activityId, associationId: input.associationId },
      select: { id: true },
    });
    if (!activity) {
      throw new ArpError(
        "L'activité rattachée n'appartient pas à cette association.",
        "ARP_FUND_ACTIVITY_INVALID",
        400
      );
    }
  }
  const existing = await prisma.arpFund.findUnique({
    where: { associationId_code: { associationId: input.associationId, code } },
  });
  if (existing) {
    throw new ArpError("Un fonds porte déjà ce code.", "ARP_FUND_CODE_DUPLICATE", 409);
  }
  return prisma.arpFund.create({
    data: {
      associationId: input.associationId,
      code,
      name: input.name.trim(),
      type: input.type,
      currency: input.currency,
      activityId: input.activityId ?? null,
      createdById: input.userId,
    },
  });
}

export async function postFundMovement(input: {
  associationId: string;
  fundId: string;
  direction: "IN" | "OUT";
  amountMinor: bigint;
  valueDate: Date;
  description: string;
  sourceType?: string;
  sourceId?: string | null;
  userId: string;
}) {
  if (input.amountMinor <= ZERO) {
    throw new ArpError("Le montant doit être strictement positif.", "ARP_AMOUNT_INVALID", 400);
  }
  if (!input.description.trim()) {
    throw new ArpError("La description du mouvement est requise.", "ARP_DESCRIPTION_REQUIRED", 400);
  }

  return prisma.$transaction(
    async (tx) => {
      const fund = await lockFund(tx, input.fundId);
      if (fund.associationId !== input.associationId) {
        throw new ArpError("Fonds hors périmètre de l'association.", "ARP_FUND_SCOPE", 403);
      }
      if (fund.status !== "ACTIVE") {
        throw new ArpError("Ce fonds est clôturé.", "ARP_FUND_CLOSED", 409);
      }
      assertSameCurrency(fund.currency, fund.currency);
      const state = await getFundState(fund, tx);
      if (input.direction === "OUT" && input.amountMinor > state.available) {
        throw new ArpError(
          `Disponible insuffisant : ${formatMoney(state.available, fund.currency)} réservables, ${formatMoney(input.amountMinor, fund.currency)} demandés.`,
          "ARP_FUND_INSUFFICIENT",
          409,
          {
            availableMinor: state.available.toString(),
            reservedMinor: state.reservedMinor.toString(),
            balanceMinor: state.balance.toString(),
          }
        );
      }
      return tx.arpFundMovement.create({
        data: {
          fundId: fund.id,
          direction: input.direction,
          amountMinor: input.amountMinor,
          currency: fund.currency,
          valueDate: input.valueDate,
          description: input.description.trim(),
          sourceType: input.sourceType ?? "MANUAL",
          sourceId: input.sourceId ?? null,
          createdById: input.userId,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function reserveFund(input: {
  associationId: string;
  fundId: string;
  amountMinor: bigint;
  purpose: string;
  expiresAt?: Date | null;
  userId: string;
}) {
  if (input.amountMinor <= ZERO) {
    throw new ArpError("Le montant de la réservation doit être positif.", "ARP_AMOUNT_INVALID", 400);
  }
  if (!input.purpose.trim()) {
    throw new ArpError("Le motif de la réservation est requis.", "ARP_PURPOSE_REQUIRED", 400);
  }

  return prisma.$transaction(
    async (tx) => {
      const fund = await lockFund(tx, input.fundId);
      if (fund.associationId !== input.associationId) {
        throw new ArpError("Fonds hors périmètre de l'association.", "ARP_FUND_SCOPE", 403);
      }
      const state = await getFundState(fund, tx);
      if (input.amountMinor > state.available) {
        throw new ArpError(
          `Disponible insuffisant : ${formatMoney(state.available, fund.currency)} disponibles.`,
          "ARP_FUND_INSUFFICIENT",
          409,
          { availableMinor: state.available.toString() }
        );
      }
      return tx.arpFundReservation.create({
        data: {
          fundId: fund.id,
          amountMinor: input.amountMinor,
          currency: fund.currency,
          purpose: input.purpose.trim(),
          expiresAt: input.expiresAt ?? null,
          createdById: input.userId,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function releaseReservation(input: {
  associationId: string;
  fundId: string;
  reservationId: string;
  userId: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      const fund = await lockFund(tx, input.fundId);
      if (fund.associationId !== input.associationId) {
        throw new ArpError("Fonds hors périmètre.", "ARP_FUND_SCOPE", 403);
      }
      const reservation = await tx.arpFundReservation.findFirst({
        where: { id: input.reservationId, fundId: fund.id },
      });
      if (!reservation) {
        throw new ArpError("Réservation introuvable.", "ARP_RESERVATION_NOT_FOUND", 404);
      }
      if (reservation.status !== "ACTIVE") {
        throw new ArpError("Cette réservation n'est plus active.", "ARP_RESERVATION_CLOSED", 409);
      }
      return tx.arpFundReservation.update({
        where: { id: reservation.id },
        data: { status: "RELEASED", releasedAt: new Date() },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function consumeReservation(input: {
  associationId: string;
  fundId: string;
  reservationId: string;
  userId: string;
  description?: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      const fund = await lockFund(tx, input.fundId);
      if (fund.associationId !== input.associationId) {
        throw new ArpError("Fonds hors périmètre.", "ARP_FUND_SCOPE", 403);
      }
      const reservation = await tx.arpFundReservation.findFirst({
        where: { id: input.reservationId, fundId: fund.id },
      });
      if (!reservation) {
        throw new ArpError("Réservation introuvable.", "ARP_RESERVATION_NOT_FOUND", 404);
      }
      if (reservation.status !== "ACTIVE") {
        throw new ArpError("Cette réservation n'est plus active.", "ARP_RESERVATION_CLOSED", 409);
      }
      const state = await getFundState(fund, tx);
      if (reservation.amountMinor > state.balance) {
        throw new ArpError(
          "Le solde du fonds ne couvre plus la réservation.",
          "ARP_FUND_INSUFFICIENT",
          409
        );
      }
      const movement = await tx.arpFundMovement.create({
        data: {
          fundId: fund.id,
          direction: "OUT",
          amountMinor: reservation.amountMinor,
          currency: reservation.currency,
          valueDate: new Date(),
          description: input.description?.trim() || `Consommation — ${reservation.purpose}`,
          sourceType: "RESERVATION",
          sourceId: reservation.id,
          createdById: input.userId,
        },
      });
      await tx.arpFundReservation.update({
        where: { id: reservation.id },
        data: { status: "CONSUMED", consumedAt: new Date() },
      });
      return movement;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
