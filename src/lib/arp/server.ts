import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultArpConfig,
  deriveCapabilities,
  normalizeArpConfig,
  validateArpConfig,
  type ArpSeed,
} from "./profile";
import type {
  ArpCapabilities,
  ArpCapability,
  ArpConfig,
  ArpOrigin,
  ArpProfilePayload,
  ArpValidation,
  ArpValidationContext,
} from "./types";

export class ArpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, code: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ArpError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export function hashArpConfig(config: ArpConfig): string {
  return createHash("sha256")
    .update(JSON.stringify(sortValue(config)))
    .digest("hex");
}

export function arpContextFromAssociation(association: {
  bureauConfig?: string | null;
  reglementHtml?: string | null;
  parentId?: string | null;
  status?: string;
}): ArpValidationContext {
  return {
    hasBureau: Boolean(association.bureauConfig && association.bureauConfig.trim().length > 2),
    hasRegulation: Boolean(association.reglementHtml && association.reglementHtml.trim().length > 20),
    hasParent: Boolean(association.parentId),
  };
}

function seedFromAssociation(association: {
  type: string;
  parentId: string | null;
  currency?: string | null;
  bureauConfig?: string | null;
  activities?: Array<{ type: string; distributionMode?: string | null; contributionUnit?: string | null }>;
}): ArpSeed {
  return {
    type: association.type,
    parentId: association.parentId,
    currency: association.currency ?? "XAF",
    bureauConfig: association.bureauConfig,
    activities: association.activities ?? [],
  };
}

async function findAssociationForArp(associationId: string) {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    include: {
      activities: {
        select: { type: true, distributionMode: true, contributionUnit: true },
      },
    },
  });
  if (!association) throw new ArpError("Association introuvable.", "ARP_NOT_FOUND", 404);
  return association;
}

/**
 * Garantit l'existence d'un profil ARP. Les associations déjà actives reçoivent
 * un profil ACTIVE d'origine BACKFILL, signalé comme à valider dans l'interface.
 */
export type EnsureArpOptions = {
  config?: unknown;
  origin?: ArpOrigin;
  activate?: boolean;
};

export async function ensureArpProfile(
  associationId: string,
  options: EnsureArpOptions = {}
) {
  const existing = await prisma.arpProfile.findUnique({
    where: { associationId },
  });
  if (existing) return existing;

  const association = await findAssociationForArp(associationId);
  const seed = seedFromAssociation(association);
  const config = options.config
    ? normalizeArpConfig(options.config, seed)
    : defaultArpConfig(seed);
  const context = arpContextFromAssociation(association);
  const checks = validateArpConfig(config, context);
  const active = options.activate ?? association.status === "ACTIVE";
  const origin: ArpOrigin = options.origin ?? (active ? "BACKFILL" : "MANUAL");

  try {
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.arpProfile.create({
        data: {
          associationId,
          structure: config.dimensions.organisation.toUpperCase(),
          status: active ? "ACTIVE" : "DRAFT",
          origin,
          version: 1,
          config: config as unknown as Prisma.InputJsonValue,
          checks: checks as unknown as Prisma.InputJsonValue,
          effectiveAt: active ? new Date() : null,
        },
      });
      await tx.arpProfileVersion.create({
        data: {
          profileId: profile.id,
          associationId,
          version: 1,
          status: profile.status,
          origin: profile.origin,
          config: config as unknown as Prisma.InputJsonValue,
          checks: checks as unknown as Prisma.InputJsonValue,
          hash: hashArpConfig(config),
          effectiveAt: active ? new Date() : null,
        },
      });
      return profile;
    });
  } catch (error) {
    // Course entre deux requêtes : relire le profil créé par l'autre transaction.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const profile = await prisma.arpProfile.findUnique({ where: { associationId } });
      if (profile) return profile;
    }
    throw error;
  }
}

export function configFromProfile(profile: {
  config: Prisma.JsonValue;
  draftConfig?: Prisma.JsonValue | null;
  structure?: string;
}): ArpConfig {
  return normalizeArpConfig(profile.draftConfig ?? profile.config, {
    type: profile.structure,
  });
}

export function activeConfigFromProfile(profile: { config: Prisma.JsonValue }): ArpConfig {
  return normalizeArpConfig(profile.config);
}

export type ArpProfileView = {
  profile: ArpProfilePayload;
  config: ArpConfig;
  activeConfig: ArpConfig;
  hasDraft: boolean;
  checks: ArpValidation;
  capabilities: ArpCapabilities;
  context: ArpValidationContext;
};

export async function loadArpProfileView(
  associationId: string
): Promise<ArpProfileView> {
  const association = await findAssociationForArp(associationId);
  const profile = await ensureArpProfile(associationId);
  const config = configFromProfile(profile);
  const activeConfig = activeConfigFromProfile(profile);
  const context = arpContextFromAssociation(association);
  const checks = validateArpConfig(config, context);
  const capabilities = deriveCapabilities(activeConfig);

  return {
    profile: {
      id: profile.id,
      associationId: profile.associationId,
      structure: profile.structure,
      status: profile.status as ArpProfilePayload["status"],
      origin: profile.origin as ArpProfilePayload["origin"],
      version: profile.version,
      config: activeConfig,
      checks: (profile.checks as unknown as ArpValidation) ?? null,
      effectiveAt: profile.effectiveAt?.toISOString() ?? null,
      approvedAt: profile.approvedAt?.toISOString() ?? null,
      approvedById: profile.approvedById,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    },
    config,
    activeConfig,
    hasDraft: Boolean(profile.draftConfig),
    checks,
    capabilities,
    context,
  };
}

export async function saveArpDraft(input: {
  associationId: string;
  rawConfig: unknown;
  userId: string;
}): Promise<ArpProfileView> {
  const association = await findAssociationForArp(input.associationId);
  const profile = await ensureArpProfile(input.associationId);
  const seed = seedFromAssociation(association);
  const config = normalizeArpConfig(input.rawConfig, seed);
  const context = arpContextFromAssociation(association);
  const checks = validateArpConfig(config, context);

  const isActive = profile.status === "ACTIVE";
  await prisma.arpProfile.update({
    where: { id: profile.id },
    data: isActive
      ? {
          draftConfig: config as unknown as Prisma.InputJsonValue,
          draftChecks: checks as unknown as Prisma.InputJsonValue,
        }
      : {
          config: config as unknown as Prisma.InputJsonValue,
          checks: checks as unknown as Prisma.InputJsonValue,
          structure: config.dimensions.organisation.toUpperCase(),
        },
  });

  return loadArpProfileView(input.associationId);
}

export async function publishArpProfile(input: {
  associationId: string;
  userId: string;
  rawConfig?: unknown;
}): Promise<ArpProfileView> {
  const association = await findAssociationForArp(input.associationId);
  const profile = await ensureArpProfile(input.associationId);
  const seed = seedFromAssociation(association);
  const candidate = normalizeArpConfig(
    input.rawConfig ?? profile.draftConfig ?? profile.config,
    seed
  );
  const context = arpContextFromAssociation(association);
  const checks = validateArpConfig(candidate, context, { forActivation: true });
  if (!checks.ok) {
    throw new ArpError(
      "Le profil ARP ne peut pas être publié : des contrôles bloquants subsistent.",
      "ARP_VALIDATION_FAILED",
      422,
      checks
    );
  }

  const effectiveAt = new Date();
  const hash = hashArpConfig(candidate);

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM arp_profiles WHERE "associationId" = ${input.associationId} FOR UPDATE`;
    const current = await tx.arpProfile.findUnique({ where: { id: profile.id } });
    if (!current) throw new ArpError("Profil ARP introuvable.", "ARP_NOT_FOUND", 404);

    const nextVersion = current.version + 1;
    await tx.arpProfileVersion.create({
      data: {
        profileId: current.id,
        associationId: input.associationId,
        version: nextVersion,
        status: "ACTIVE",
        origin: current.origin,
        config: candidate as unknown as Prisma.InputJsonValue,
        checks: checks as unknown as Prisma.InputJsonValue,
        hash,
        createdById: input.userId,
        approvedById: input.userId,
        effectiveAt,
      },
    });
    await tx.arpProfile.update({
      where: { id: current.id },
      data: {
        status: "ACTIVE",
        version: nextVersion,
        structure: candidate.dimensions.organisation.toUpperCase(),
        config: candidate as unknown as Prisma.InputJsonValue,
        checks: checks as unknown as Prisma.InputJsonValue,
        draftConfig: Prisma.DbNull,
        draftChecks: Prisma.DbNull,
        effectiveAt,
        approvedById: input.userId,
        approvedAt: effectiveAt,
      },
    });
  });

  return loadArpProfileView(input.associationId);
}

const CAPABILITY_LABELS: Record<ArpCapability, string> = {
  TONTINE: "Tontine",
  SAVINGS: "Épargne",
  CREDIT: "Crédit",
  SOCIAL_AID: "Aides sociales",
  NATURE: "Contributions en nature",
  MEETINGS: "Réunions",
  PROJECTS: "Projets",
  STOCKS: "Achats et stocks",
  EVENTS: "Événements",
  COMMUNITY: "Communauté",
  INVESTMENT: "Investissement",
  COLLATION: "Collation",
};

/** Refuse une nouvelle souscription si le cadre ARP ne l'autorise pas. */
export async function requireArpCapability(
  associationId: string,
  capability: ArpCapability
): Promise<void> {
  const profile = await ensureArpProfile(associationId);
  if (profile.status !== "ACTIVE") {
    throw new ArpError(
      "Le cadre ARP de cette association n'est pas encore publié. Publiez la version initiale avant de créer des engagements financiers.",
      "ARP_PROFILE_NOT_ACTIVE",
      409
    );
  }
  const capabilities = deriveCapabilities(activeConfigFromProfile(profile));
  if (!capabilities[capability]) {
    throw new ArpError(
      `Le module « ${CAPABILITY_LABELS[capability]} » n'est pas activé dans le cadre ARP de l'association.`,
      "ARP_CAPABILITY_DISABLED",
      409,
      { capability, capabilities }
    );
  }
}

/** Sérialise un profil pour une réponse JSON (sans secret). */
export function arpErrorResponse(error: unknown) {
  if (error instanceof ArpError) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code, details: error.details },
    };
  }
  return null;
}
