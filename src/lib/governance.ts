import { prisma } from "@/lib/prisma";
import {
  DEFAULT_GOVERNANCE_CONFIG,
  mergeGovernance,
  type GovernanceConfig,
} from "@/lib/governance-types";

export const GOVERNANCE_KEY = "GOVERNANCE_CONFIG";

export async function getGovernanceConfig(): Promise<GovernanceConfig> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: GOVERNANCE_KEY } });
    if (!row) return structuredClone(DEFAULT_GOVERNANCE_CONFIG);
    return mergeGovernance(DEFAULT_GOVERNANCE_CONFIG, JSON.parse(row.value));
  } catch (error) {
    console.error("[GOVERNANCE] load failed", error);
    return structuredClone(DEFAULT_GOVERNANCE_CONFIG);
  }
}

export async function saveGovernanceConfig(
  patch: Record<string, any>,
  userId?: string
): Promise<GovernanceConfig> {
  const current = await getGovernanceConfig();
  const merged = mergeGovernance(current, patch);
  await prisma.systemSetting.upsert({
    where: { key: GOVERNANCE_KEY },
    update: { value: JSON.stringify(merged), updatedBy: userId ?? null },
    create: {
      key: GOVERNANCE_KEY,
      value: JSON.stringify(merged),
      description: "Gouvernance : KYC, confiance, quarantaine, messagerie, wallet, RBAC, notifications, OpenAPI",
      updatedBy: userId ?? null,
    },
  });
  return merged;
}
