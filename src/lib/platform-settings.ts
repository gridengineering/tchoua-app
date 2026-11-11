import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PLATFORM_SETTINGS,
  mergeSettings,
  type PlatformSettings,
} from "@/lib/platform-settings-shared";

export { DEFAULT_PLATFORM_SETTINGS, mergeSettings, toPublicSettings } from "@/lib/platform-settings-shared";
export type { PlatformSettings } from "@/lib/platform-settings-shared";

export const SETTINGS_KEY = "PLATFORM_CONFIG";

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) return { ...DEFAULT_PLATFORM_SETTINGS };
    const parsed = JSON.parse(row.value);
    return mergeSettings(DEFAULT_PLATFORM_SETTINGS, parsed);
  } catch {
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }
}

export async function getPlatformSettingsMeta() {
  const row = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
  return {
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

export async function savePlatformSettings(
  patch: Record<string, any>,
  userId?: string
): Promise<PlatformSettings> {
  const current = await getPlatformSettings();
  const merged = mergeSettings(current, patch);
  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(merged), updatedBy: userId ?? null },
    create: {
      key: SETTINGS_KEY,
      value: JSON.stringify(merged),
      description: "Configuration globale de la plateforme",
      updatedBy: userId ?? null,
    },
  });
  return merged;
}
