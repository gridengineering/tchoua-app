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
    const parsed = JSON.parse(row.value);
    const merged = mergeGovernance(DEFAULT_GOVERNANCE_CONFIG, parsed);
    // Les nouvelles catégories de notifications doivent apparaître dans
    // l'administration même si la configuration a été enregistrée avant leur
    // ajout. On conserve les réglages existants et on complète uniquement les
    // événements manquants.
    const savedEvents = Array.isArray(parsed?.notifications?.events) ? parsed.notifications.events : [];
    const defaults = DEFAULT_GOVERNANCE_CONFIG.notifications.events;
    merged.notifications.events = [
      ...defaults.map((event) => {
        const saved = savedEvents.find((item: any) => item?.key === event.key);
        return saved ? { ...event, ...saved } : event;
      }),
      ...savedEvents.filter((item: any) => item?.key && !defaults.some((event) => event.key === item.key)),
    ];
    return merged;
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
