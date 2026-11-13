import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { deriveCapabilities, normalizeArpConfig } from "@/lib/arp/profile";
import { ARP_CATALOGUE_SIZE } from "@/lib/arp/catalogue";
import { ARP_DOMAIN_STATS } from "@/lib/arp/domains";
import type { ArpValidation } from "@/lib/arp/types";

export async function GET() {
  const guard = await requireSystemAdmin("ASSOCIATIONS", "READ");
  if (!guard.ok) return guard.response;

  const associations = await prisma.association.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      parentId: true,
      createdAt: true,
      arpProfile: {
        select: {
          id: true,
          status: true,
          origin: true,
          version: true,
          structure: true,
          checks: true,
          effectiveAt: true,
          updatedAt: true,
          config: true,
          draftConfig: true,
        },
      },
      _count: { select: { memberships: true, activities: true, arpFunds: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = associations.map((association) => {
    const profile = association.arpProfile;
    const checks = (profile?.checks as unknown as ArpValidation | null) ?? null;
    const config = profile ? normalizeArpConfig(profile.draftConfig ?? profile.config) : null;
    const capabilities = config ? deriveCapabilities(config) : null;
    return {
      id: association.id,
      name: association.name,
      type: association.type,
      status: association.status,
      parentId: association.parentId,
      createdAt: association.createdAt.toISOString(),
      members: association._count.memberships,
      activities: association._count.activities,
      funds: association._count.arpFunds,
      arp: profile
        ? {
            status: profile.status,
            origin: profile.origin,
            version: profile.version,
            structure: profile.structure,
            effectiveAt: profile.effectiveAt?.toISOString() ?? null,
            updatedAt: profile.updatedAt.toISOString(),
            hasDraft: Boolean(profile.draftConfig),
            completeness: checks?.completeness ?? 0,
            errors: checks?.errors.length ?? 0,
            warnings: checks?.warnings.length ?? 0,
            conditions: checks?.conditions ?? [],
            capabilities,
            currency: config?.identity.currency ?? "XAF",
            dimensions: config?.dimensions ?? null,
          }
        : null,
    };
  });

  const versionCount = await prisma.arpProfileVersion.count();
  const active = rows.filter((r) => r.arp?.status === "ACTIVE").length;
  const draft = rows.filter((r) => !r.arp || r.arp.status === "DRAFT").length;
  const backfill = rows.filter((r) => r.arp?.origin === "BACKFILL").length;
  const averageCompleteness = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + (r.arp?.completeness ?? 0), 0) / rows.length)
    : 0;

  return NextResponse.json({
    rows,
    stats: {
      associations: rows.length,
      active,
      draft,
      backfill,
      versions: versionCount,
      averageCompleteness,
      domains: ARP_DOMAIN_STATS.domains,
      invariants: ARP_DOMAIN_STATS.invariants,
      catalogueSize: ARP_CATALOGUE_SIZE,
    },
  });
}
