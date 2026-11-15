import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGovernanceConfig } from "@/lib/governance";
import { getWalletConfig, providerFee, walletProvider } from "@/lib/wallet/config";
import { kycRuleForLevel } from "@/lib/governance-types";

const BUREAU_ROLES = ["FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ"];

async function membership(associationId: string, userId: string) {
  return prisma.associationMembership.findUnique({
    where: { userId_associationId: { userId, associationId } },
    select: { id: true, role: true, status: true, user: { select: { kycLevel: true, email: true } } },
  });
}

async function ensureWallet(associationId: string, currency = "XAF") {
  return prisma.associationWallet.upsert({
    where: { associationId },
    update: {},
    create: { associationId, balance: 0, currency, status: "ACTIVE" },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const me = await membership(id, session.user.id);
  if (!me || me.status === "LEFT") return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const config = await getWalletConfig();
  if (!config.associationWalletEnabled) return NextResponse.json({ error: "Wallet association désactivé" }, { status: 503 });

  const wallet = await ensureWallet(id, config.currency);
  return NextResponse.json({
    wallet,
    canManage: BUREAU_ROLES.includes(me.role),
    providers: config.providers.filter((provider) => provider.enabled).map((provider) => ({
      id: provider.id, label: provider.label, type: provider.type, min: provider.min, max: provider.max, instructions: provider.instructions,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const me = await membership(id, session.user.id);
  if (!me || me.status === "LEFT") return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "FUND").toUpperCase();
  const amount = Number(body.amount);
  const providerId = String(body.provider ?? "");
  const description = body.description ? String(body.description) : undefined;

  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });

  const [governance, config] = await Promise.all([getGovernanceConfig(), getWalletConfig()]);
  if (!config.associationWalletEnabled) return NextResponse.json({ error: "Wallet association désactivé" }, { status: 503 });

  const wallet = await ensureWallet(id, config.currency);
  if (wallet.status !== "ACTIVE") return NextResponse.json({ error: "Wallet association suspendu" }, { status: 403 });

  if (action === "FUND") {
    if (!config.allowAssociationFunding) return NextResponse.json({ error: "Alimentation désactivée" }, { status: 403 });
    const level = Number(me.user.kycLevel) || 0;
    const rule = kycRuleForLevel(governance, level);
    if (!rule.access.transfer) return NextResponse.json({ error: `KYC ${level} insuffisant pour alimenter l'association.` }, { status: 403 });
    const memberWallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
    if (!memberWallet || memberWallet.status !== "ACTIVE") return NextResponse.json({ error: "Wallet membre introuvable ou suspendu" }, { status: 404 });
    if (memberWallet.balance < amount) return NextResponse.json({ error: "Solde insuffisant dans votre wallet." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: memberWallet.id }, data: { balance: { decrement: amount } } });
      await tx.walletTransaction.create({
        data: { walletId: memberWallet.id, amount, feeAmount: 0, netAmount: amount, type: "TRANSFER_OUT", status: "COMPLETED", description: description || `Alimentation ${id}` },
      });
      const updated = await tx.associationWallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
      const transaction = await tx.associationWalletTransaction.create({
        data: { walletId: wallet.id, amount, feeAmount: 0, netAmount: amount, type: "TRANSFER_IN", status: "COMPLETED", memberId: me.id, createdById: session.user.id, description: description || "Alimentation depuis le wallet membre" },
      });
      return { wallet: updated, transaction };
    });
    return NextResponse.json(result, { status: 201 });
  }

  if (!BUREAU_ROLES.includes(me.role)) return NextResponse.json({ error: "Seul le bureau peut retirer ou enregistrer un dépôt externe." }, { status: 403 });

  if (action === "WITHDRAWAL") {
    if (wallet.balance < amount) return NextResponse.json({ error: "Solde insuffisant dans le wallet association." }, { status: 400 });
    const updated = await prisma.associationWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
    const transaction = await prisma.associationWalletTransaction.create({
      data: { walletId: wallet.id, amount, feeAmount: 0, netAmount: amount, type: "WITHDRAWAL", status: "PENDING", provider: providerId || null, memberId: me.id, createdById: session.user.id, description: description || "Retrait association" },
    });
    return NextResponse.json({ wallet: updated, transaction, pending: true }, { status: 201 });
  }

  if (action === "DEPOSIT") {
    const provider = walletProvider(config, providerId);
    if (!provider || !provider.enabled) return NextResponse.json({ error: "Moyen de paiement indisponible." }, { status: 400 });
    if (amount < provider.min || amount > provider.max) return NextResponse.json({ error: "Montant hors limites du moyen de paiement." }, { status: 400 });
    const transaction = await prisma.associationWalletTransaction.create({
      data: {
        walletId: wallet.id, amount, feeAmount: providerFee(provider, amount), netAmount: amount,
        type: "DEPOSIT", status: "PENDING", provider: provider.id, memberId: me.id,
        createdById: session.user.id, description: description || `Dépôt ${provider.label}`,
      },
    });
    return NextResponse.json({ wallet, transaction, pending: true, instructions: provider.instructions }, { status: 201 });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
