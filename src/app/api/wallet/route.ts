import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGovernanceConfig } from "@/lib/governance";
import { getWalletConfig } from "@/lib/wallet/config";
import { kycRuleForLevel } from "@/lib/governance-types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const [governance, config] = await Promise.all([getGovernanceConfig(), getWalletConfig()]);
    if (!config.enabled) return NextResponse.json({ error: "Le wallet est désactivé." }, { status: 503 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycLevel: true, kycStatus: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const level = Number(user.kycLevel) || 0;
    const rule = kycRuleForLevel(governance, level);

    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id, balance: 0, currency: config.currency, status: "ACTIVE" },
        include: { transactions: true },
      });
    }

    const providers = config.providers
      .filter((provider) => provider.enabled && level >= provider.requiresKycLevel)
      .map((provider) => ({
        id: provider.id,
        label: provider.label,
        type: provider.type,
        feePct: provider.feePct,
        feeFixed: provider.feeFixed,
        min: provider.min,
        max: provider.max,
        instructions: provider.instructions,
      }));

    return NextResponse.json({
      wallet,
      kyc: {
        level,
        status: user.kycStatus,
        label: rule.label,
        maxAmountPerTx: rule.maxAmountPerTx,
        maxDaily: rule.maxDaily,
        maxMonthly: rule.maxMonthly,
        access: rule.access,
      },
      providers,
      canDeposit: config.allowDeposit && rule.access.deposit,
      canWithdraw: config.allowWithdrawal && rule.access.withdrawal,
      canTransfer: config.allowTransfer && rule.access.transfer,
      associationFunding: config.allowAssociationFunding,
      oneWalletPerMember: config.oneWalletPerMember,
    });
  } catch (error: any) {
    console.error("Erreur GET /api/wallet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
