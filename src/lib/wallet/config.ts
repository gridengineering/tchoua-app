import { prisma } from "@/lib/prisma";
import { getGovernanceConfig } from "@/lib/governance";
import type { KycAccess, PaymentProvider, WalletConfig } from "@/lib/governance-types";

/** Fusionne la configuration de gouvernance avec l'ancien WALLET_CONFIG. */
export async function getWalletConfig(): Promise<WalletConfig> {
  const governance = await getGovernanceConfig();
  const wallet = structuredClone(governance.wallet);
  try {
    const legacy = await prisma.systemSetting.findUnique({ where: { key: "WALLET_CONFIG" } });
    if (legacy) {
      const parsed = JSON.parse(legacy.value);
      const numericKeys = [
        "depositMaxTx", "depositMaxDay", "withdrawalMaxTx", "withdrawalMaxDay",
        "transferMaxTx", "transferMaxDay", "otpWithdrawalThreshold", "otpTransferThreshold",
      ] as const;
      for (const key of numericKeys) {
        if (Number.isFinite(Number(parsed[key]))) (wallet as any)[key] = Number(parsed[key]);
      }
    }
  } catch {
    /* La configuration de gouvernance reste la source de secours. */
  }
  return wallet;
}

export function walletProvider(config: WalletConfig, providerId?: string | null): PaymentProvider | null {
  if (!providerId) return null;
  return config.providers.find((provider) => provider.id === providerId) ?? null;
}

export function providerFee(provider: PaymentProvider, amount: number) {
  return Math.round((amount * provider.feePct) / 100 + provider.feeFixed);
}

export function walletAccess(level: number, access: KycAccess, operation: keyof KycAccess) {
  return access[operation];
}

