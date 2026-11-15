import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGovernanceConfig } from "@/lib/governance";
import { getWalletConfig, providerFee, walletProvider } from "@/lib/wallet/config";
import { kycRuleForLevel, type PaymentProvider } from "@/lib/governance-types";
import { confirmVerificationCode } from "@/lib/verification";
import { dispatchNotification } from "@/lib/notifications/dispatch";

function startOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function resolveProvider(config: Awaited<ReturnType<typeof getWalletConfig>>, input: unknown): PaymentProvider | null {
  const value = String(input ?? "");
  const aliases: Record<string, string> = {
    MOBILE_MONEY: "MTN_MOMO",
    BANK_CARD: "VISA",
  };
  return walletProvider(config, aliases[value] ?? value);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();
    const type = String(body.type ?? "");
    const amount = Number(body.amount);
    const description = body.description ? String(body.description) : undefined;
    const receiverId = body.receiverId ? String(body.receiverId) : undefined;
    const otpCode = body.otpCode ? String(body.otpCode) : undefined;
    const idempotencyKey = req.headers.get("idempotency-key")?.trim() || undefined;

    if (idempotencyKey) {
      const existing = await prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
        include: { wallet: true },
      });
      if (existing) {
        return NextResponse.json({ wallet: existing.wallet, transaction: existing, replayed: true });
      }
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
    if (!["DEPOSIT", "WITHDRAWAL", "TRANSFER"].includes(type)) {
      return NextResponse.json({ error: "Type de transaction invalide" }, { status: 400 });
    }

    const [governance, config, user] = await Promise.all([
      getGovernanceConfig(),
      getWalletConfig(),
      prisma.user.findUnique({
        where: { id: userId },
        select: { kycLevel: true, email: true, name: true },
      }),
    ]);
    if (!config.enabled || !user) return NextResponse.json({ error: "Wallet indisponible" }, { status: 503 });

    const level = Number(user.kycLevel) || 0;
    const rule = kycRuleForLevel(governance, level);
    const operation = type === "DEPOSIT" ? "deposit" : type === "WITHDRAWAL" ? "withdrawal" : "transfer";
    if (!rule.access[operation]) {
      return NextResponse.json({
        error: `Votre niveau KYC (${level}) ne permet pas cette opération.`,
        code: "KYC_ACCESS_DENIED",
        requiredLevel: governance.kyc.levels.find((item) => item.access[operation] && item.level > level)?.level ?? 1,
      }, { status: 403 });
    }
    if (type === "DEPOSIT" && !config.allowDeposit) return NextResponse.json({ error: "Les dépôts sont désactivés." }, { status: 403 });
    if (type === "WITHDRAWAL" && !config.allowWithdrawal) return NextResponse.json({ error: "Les retraits sont désactivés." }, { status: 403 });
    if (type === "TRANSFER" && !config.allowTransfer) return NextResponse.json({ error: "Les virements sont désactivés." }, { status: 403 });

    const provider = type === "TRANSFER" ? null : resolveProvider(config, body.provider ?? body.reference);
    if (type !== "TRANSFER") {
      if (!provider || !provider.enabled) {
        return NextResponse.json({ error: "Moyen de paiement indisponible." }, { status: 400 });
      }
      if (level < provider.requiresKycLevel) {
        return NextResponse.json({ error: `Ce moyen de paiement exige KYC ${provider.requiresKycLevel}.` }, { status: 403 });
      }
      if (amount < provider.min || amount > provider.max) {
        return NextResponse.json({ error: `Montant hors limites du moyen de paiement (${provider.min}–${provider.max}).` }, { status: 400 });
      }
    }

    const transactionLimit = type === "DEPOSIT" ? config.depositMaxTx : type === "WITHDRAWAL" ? config.withdrawalMaxTx : config.transferMaxTx;
    const dailyLimit = type === "DEPOSIT" ? config.depositMaxDay : type === "WITHDRAWAL" ? config.withdrawalMaxDay : config.transferMaxDay;
    const maxTx = rule.maxAmountPerTx > 0 ? Math.min(transactionLimit, rule.maxAmountPerTx) : transactionLimit;
    if (amount > maxTx) {
      return NextResponse.json({ error: `Montant maximum par transaction : ${maxTx.toLocaleString("fr-FR")} ${config.currency}.` }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
    if (wallet.status !== "ACTIVE") return NextResponse.json({ error: "Portefeuille suspendu" }, { status: 403 });

    const dayStart = startOfDay();
    const monthStart = startOfMonth();
    const relevantTypes = type === "DEPOSIT" ? ["DEPOSIT"] : type === "WITHDRAWAL" ? ["WITHDRAWAL"] : ["TRANSFER_OUT"];
    const [daily, monthly] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: { in: relevantTypes }, status: { in: ["COMPLETED", "PENDING"] }, createdAt: { gte: dayStart } },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: { in: relevantTypes }, status: { in: ["COMPLETED", "PENDING"] }, createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);
    if (Number(daily._sum.amount ?? 0) + amount > dailyLimit) {
      return NextResponse.json({ error: `Plafond journalier atteint (${dailyLimit.toLocaleString("fr-FR")} ${config.currency}).` }, { status: 400 });
    }
    if (rule.maxDaily > 0 && Number(daily._sum.amount ?? 0) + amount > rule.maxDaily) {
      return NextResponse.json({ error: `Plafond journalier KYC atteint (${rule.maxDaily.toLocaleString("fr-FR")} ${config.currency}).` }, { status: 400 });
    }
    if (rule.maxMonthly > 0 && Number(monthly._sum.amount ?? 0) + amount > rule.maxMonthly) {
      return NextResponse.json({ error: `Plafond mensuel KYC atteint (${rule.maxMonthly.toLocaleString("fr-FR")} ${config.currency}).` }, { status: 400 });
    }

    const otpThreshold = type === "WITHDRAWAL" ? config.otpWithdrawalThreshold : type === "TRANSFER" ? config.otpTransferThreshold : 0;
    if (otpThreshold > 0 && amount >= otpThreshold) {
      if (!otpCode) {
        return NextResponse.json({
          requiresOTP: true,
          channel: "EMAIL",
          message: "Un code de confirmation est requis. Utilisez « Envoyer le code ».",
        });
      }
      const verified = await confirmVerificationCode(userId, "EMAIL", otpCode);
      if (!verified.ok) {
        return NextResponse.json({ error: verified.error, code: verified.code }, { status: 400 });
      }
    }

    const feeAmount = provider && type !== "TRANSFER" ? providerFee(provider, amount) : 0;
    const netAmount = type === "DEPOSIT" ? amount : amount + feeAmount;
    const status = type === "TRANSFER" ? "COMPLETED" : "PENDING";

    if (type === "WITHDRAWAL" || type === "TRANSFER") {
      if (wallet.balance < netAmount) {
        return NextResponse.json({ error: `Solde insuffisant (${wallet.balance.toLocaleString("fr-FR")} ${wallet.currency}).` }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (type === "DEPOSIT") {
        // Le dépôt externe reste PENDING tant que le prestataire n'a pas confirmé.
        const transaction = await tx.walletTransaction.create({
          data: {
            idempotencyKey,
            walletId: wallet.id,
            amount, feeAmount, netAmount: amount, type: "DEPOSIT", status,
            description: description || `Dépôt ${provider?.label ?? ""}`.trim(),
            reference: provider?.id ?? null,
          },
        });
        return { wallet, transaction, pending: status === "PENDING" };
      }

      if (type === "WITHDRAWAL") {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: netAmount } },
        });
        const transaction = await tx.walletTransaction.create({
          data: {
            idempotencyKey,
            walletId: wallet.id,
            amount, feeAmount, netAmount, type: "WITHDRAWAL", status,
            description: description || `Retrait ${provider?.label ?? ""}`.trim(),
            reference: provider?.id ?? null,
          },
        });
        return { wallet: updatedWallet, transaction, pending: status === "PENDING" };
      }

      if (!receiverId) throw new Error("Bénéficiaire manquant");
      if (receiverId === userId) throw new Error("Vous ne pouvez pas vous transférer de l'argent à vous-même");
      const receiver = await prisma.user.findFirst({
        where: { OR: [{ id: receiverId }, { email: receiverId.toLowerCase() }] },
        select: { id: true, name: true },
      });
      if (!receiver) throw new Error("Bénéficiaire introuvable");
      const receiverWallet = await tx.wallet.findUnique({ where: { userId: receiver.id } });
      if (!receiverWallet || receiverWallet.status !== "ACTIVE") throw new Error("Le portefeuille du bénéficiaire est introuvable ou suspendu");

      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: netAmount } } });
      await tx.wallet.update({ where: { id: receiverWallet.id }, data: { balance: { increment: amount } } });
      const txOut = await tx.walletTransaction.create({
        data: {
          idempotencyKey,
          walletId: wallet.id, amount, feeAmount: 0, netAmount: amount, type: "TRANSFER_OUT", status: "COMPLETED",
          description: description || `Virement à ${receiver.name}`,
        },
      });
      const txIn = await tx.walletTransaction.create({
        data: {
          idempotencyKey: idempotencyKey ? `${idempotencyKey}:in` : undefined,
          walletId: receiverWallet.id, amount, feeAmount: 0, netAmount: amount, type: "TRANSFER_IN", status: "COMPLETED",
          description: description || `Virement de ${user.name}`, relatedTxId: txOut.id,
        },
      });
      await tx.walletTransaction.update({ where: { id: txOut.id }, data: { relatedTxId: txIn.id } });
      return { wallet: updatedWallet, transaction: txOut, pending: false };
    });

    const event = type === "DEPOSIT" ? "WALLET_DEPOSIT" : type === "WITHDRAWAL" ? "WALLET_WITHDRAWAL" : "WALLET_TRANSFER";
    await dispatchNotification({
      event,
      userId,
      title: type === "DEPOSIT" ? "Dépôt enregistré" : type === "WITHDRAWAL" ? "Retrait enregistré" : "Virement effectué",
      message: `${amount.toLocaleString("fr-FR")} ${config.currency} — ${result.pending ? "en attente de confirmation" : "opération confirmée"}.`,
      link: "/dashboard/wallet",
      type: "SUCCESS",
    }).catch(() => null);

    return NextResponse.json({
      ...result,
      message: result.pending
        ? "Opération enregistrée. Elle sera créditée après confirmation du prestataire."
        : "Opération effectuée.",
    });
  } catch (error: any) {
    console.error("Erreur POST /api/wallet/transactions:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 400 });
  }
}
