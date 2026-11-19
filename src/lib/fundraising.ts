import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBureauRole } from "@/lib/apps";
import { isPlatformAdmin } from "@/lib/permissions";
import { verifyAppToken } from "@/lib/apps/token";

export const FUNDRAISING_APP_SLUG = "association-fundraising";

export const FUNDRAISING_TYPES = ["AIDE", "PROJET", "MAIN_LEVEE", "AUTRE"] as const;
export type FundraisingType = (typeof FUNDRAISING_TYPES)[number];

export const FUNDRAISING_TYPE_LABELS: Record<FundraisingType, string> = {
  AIDE: "Aide",
  PROJET: "Projet",
  MAIN_LEVEE: "Main levée",
  AUTRE: "Autre",
};

export const FUNDRAISING_SCOPES = ["ASSOCIATION", "ALL_ASSOCIATIONS", "PUBLIC"] as const;
export type FundraisingScope = (typeof FUNDRAISING_SCOPES)[number];

export const FUNDRAISING_SCOPE_LABELS: Record<FundraisingScope, string> = {
  ASSOCIATION: "Mon association",
  ALL_ASSOCIATIONS: "Toutes les associations",
  PUBLIC: "Espace public",
};

export const FUNDRAISING_CONTRIBUTION_MODES = ["FIXE", "LIBRE"] as const;
export const FUNDRAISING_CONTRIBUTOR_MODES = ["ANONYME", "IDENTIFIE", "AU_CHOIX"] as const;
export const FUNDRAISING_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"] as const;

export function isFundraisingType(value: unknown): value is FundraisingType {
  return typeof value === "string" && (FUNDRAISING_TYPES as readonly string[]).includes(value);
}
export function isFundraisingScope(value: unknown): value is FundraisingScope {
  return typeof value === "string" && (FUNDRAISING_SCOPES as readonly string[]).includes(value);
}
export function isContributionMode(value: unknown): value is "FIXE" | "LIBRE" {
  return value === "FIXE" || value === "LIBRE";
}
export function isContributorMode(value: unknown): value is "ANONYME" | "IDENTIFIE" | "AU_CHOIX" {
  return typeof value === "string" && (FUNDRAISING_CONTRIBUTOR_MODES as readonly string[]).includes(value);
}
export function isFundraisingStatus(value: unknown): value is "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" {
  return typeof value === "string" && (FUNDRAISING_STATUSES as readonly string[]).includes(value);
}

export type FundraisingActor = {
  userId: string;
  associationId: string;
  membershipId: string | null;
  role: string | null;
  isBureau: boolean;
  isPlatformAdmin: boolean;
  viaApp: boolean;
};

/**
 * Résout l'acteur d'une requête fundraising.
 * Deux voies :
 * - jeton de lancement Apps (iframe) : Authorization Bearer ;
 * - session NextAuth (espace web / appels serveur).
 * Le jeton doit être émis pour l'app association-fundraising et pour une association.
 */
export async function getFundraisingActor(
  req: NextRequest,
  associationIdOverride?: string | null
): Promise<FundraisingActor | null> {
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (bearer) {
    const payload = verifyAppToken(bearer);
    if (!payload || payload.slug !== FUNDRAISING_APP_SLUG) return null;
    const associationId = payload.associationId || associationIdOverride;
    if (!associationId) return null;
    const membership = await prisma.associationMembership.findUnique({
      where: { userId_associationId: { userId: payload.userId, associationId } },
      select: { id: true, role: true, status: true },
    });
    if (!membership || membership.status !== "ACTIVE") return null;
    return {
      userId: payload.userId,
      associationId,
      membershipId: membership.id,
      role: membership.role,
      isBureau: isBureauRole(membership.role),
      isPlatformAdmin: false,
      viaApp: true,
    };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const associationId = associationIdOverride || null;
  if (!associationId) return null;
  const membership = await prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId: session.user.id, associationId } },
    select: { id: true, role: true, status: true },
  });
  if (!membership || membership.status !== "ACTIVE") return null;
  return {
    userId: session.user.id,
    associationId,
    membershipId: membership.id,
    role: membership.role,
    isBureau: isBureauRole(membership.role) || isPlatformAdmin(session),
    isPlatformAdmin: isPlatformAdmin(session),
    viaApp: false,
  };
}

export function canManage(actor: FundraisingActor | null) {
  return Boolean(actor && (actor.isBureau || actor.isPlatformAdmin));
}

/**
 * Contexte de lecture : accepte un jeton Apps ou une session, même lorsque la
 * levée appartient à une autre association (portée ALL_ASSOCIATIONS).
 */
export async function getFundraisingViewer(req: NextRequest): Promise<FundraisingActor | null> {
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (bearer) {
    const payload = verifyAppToken(bearer);
    if (!payload || payload.slug !== FUNDRAISING_APP_SLUG || !payload.associationId) return null;
    const membership = await prisma.associationMembership.findUnique({
      where: { userId_associationId: { userId: payload.userId, associationId: payload.associationId } },
      select: { id: true, role: true, status: true },
    });
    if (!membership || membership.status !== "ACTIVE") return null;
    return {
      userId: payload.userId,
      associationId: payload.associationId,
      membershipId: membership.id,
      role: membership.role,
      isBureau: isBureauRole(membership.role),
      isPlatformAdmin: false,
      viaApp: true,
    };
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { id: true, role: true, associationId: true },
  });
  if (!membership) return null;
  return {
    userId: session.user.id,
    associationId: membership.associationId,
    membershipId: membership.id,
    role: membership.role,
    isBureau: isBureauRole(membership.role) || isPlatformAdmin(session),
    isPlatformAdmin: isPlatformAdmin(session),
    viaApp: false,
  };
}

export function dateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function cleanText(value: unknown, max = 12000) {
  return String(value ?? "").trim().slice(0, max);
}

export function safeAmount(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

export type ProjectTotals = {
  pledged: number;
  received: number;
  cancelled: number;
  contributions: number;
  uniqueContributors: number;
  progress: number;
  daysRemaining: number;
  countdown: string;
  state: "upcoming" | "open" | "closed";
};

export function projectTotals(project: any): ProjectTotals {
  const contributions = Array.isArray(project?.contributions) ? project.contributions : [];
  const active = contributions.filter((c: any) => c.status !== "CANCELLED");
  const received = active.filter((c: any) => c.status === "RECEIVED");
  const pledged = active.filter((c: any) => c.status === "PLEDGED");
  const sum = (rows: any[]) => rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
  const collected = sum(active);
  const target = Number(project?.targetAmount) || 0;
  const now = Date.now();
  const start = project?.startDate ? new Date(project.startDate).getTime() : now;
  const end = project?.endDate ? new Date(project.endDate).getTime() : now;
  const daysRemaining = Math.ceil((end - now) / 86_400_000);
  const state = now < start ? "upcoming" : now > end ? "closed" : "open";
  const countdown = state === "upcoming"
    ? `Démarre dans ${Math.max(0, Math.ceil((start - now) / 86_400_000))} j`
    : state === "closed"
      ? "Campagne terminée"
      : `${Math.max(0, daysRemaining)} j restants`;
  return {
    pledged: sum(pledged),
    received: sum(received),
    cancelled: sum(contributions.filter((c: any) => c.status === "CANCELLED")),
    contributions: active.length,
    uniqueContributors: new Set(active.map((c: any) => c.contributorUserId || c.contributorEmail || c.id)).size,
    progress: target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0,
    daysRemaining,
    countdown,
    state,
  };
}

export function serializeProject(project: any, options: { includeContributions?: boolean; isManager?: boolean } = {}) {
  const totals = projectTotals(project);
  const contributions = Array.isArray(project?.contributions) ? project.contributions : [];
  return {
    ...project,
    contributions: options.includeContributions
      ? contributions.map(serializeContribution(project, options.isManager))
      : undefined,
    totals,
    canManage: Boolean(options.isManager),
  };
}

export function serializeContribution(project: any, isManager?: boolean) {
  return (contribution: any) => ({
    id: contribution.id,
    projectId: contribution.projectId,
    amount: contribution.amount,
    currency: contribution.currency || project?.currency || "XAF",
    isAnonymous: contribution.isAnonymous,
    contributorName: contribution.isAnonymous ? "Contributeur anonyme" : contribution.contributorName || "Membre",
    contributorEmail: isManager ? contribution.contributorEmail : undefined,
    contributorPhone: isManager ? contribution.contributorPhone : undefined,
    message: contribution.message || null,
    status: contribution.status,
    paymentMethod: contribution.paymentMethod || null,
    createdAt: contribution.createdAt,
    confirmedAt: contribution.confirmedAt || null,
  });
}

export function projectVisibilityWhere(actor: FundraisingActor | null) {
  if (!actor) return { scope: "PUBLIC", status: { in: ["PUBLISHED", "CLOSED"] } };
  return {
    OR: [
      { associationId: actor.associationId },
      { scope: { in: ["ALL_ASSOCIATIONS", "PUBLIC"] }, status: { in: ["PUBLISHED", "CLOSED"] } },
    ],
  };
}
