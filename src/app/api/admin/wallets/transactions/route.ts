import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export async function GET() {
  const guard = await requireSystemAdmin("WALLETS", "READ");
  if (!guard.ok) return guard.response;
  const [member, association] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 100,
      include: { wallet: { include: { user: { select: { id: true, name: true, email: true } } } } },
    }),
    prisma.associationWalletTransaction.findMany({
      where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 100,
      include: { wallet: { include: { association: { select: { id: true, name: true } } } } },
    }),
  ]);
  return NextResponse.json({ member, association });
}

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin("WALLETS", "UPDATE");
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const id = String(body.transactionId ?? "");
  const decision = String(body.decision ?? "").toUpperCase();
  const walletType = String(body.walletType ?? "MEMBER").toUpperCase();
  if (!id || !["APPROVE", "REJECT"].includes(decision)) {
    return NextResponse.json({ error: "transactionId et decision (APPROVE|REJECT) requis" }, { status: 400 });
  }

  if (walletType === "ASSOCIATION") {
    const transaction = await prisma.associationWalletTransaction.findUnique({ where: { id }, include: { wallet: true } });
    if (!transaction || transaction.status !== "PENDING") return NextResponse.json({ error: "Transaction introuvable ou déjà traitée" }, { status: 404 });
    const updated = await prisma.$transaction(async (tx) => {
      if (decision === "APPROVE" && transaction.type === "DEPOSIT") {
        await tx.associationWallet.update({ where: { id: transaction.walletId }, data: { balance: { increment: transaction.netAmount } } });
      }
      if (decision === "REJECT" && transaction.type === "WITHDRAWAL") {
        await tx.associationWallet.update({ where: { id: transaction.walletId }, data: { balance: { increment: transaction.netAmount } } });
      }
      return tx.associationWalletTransaction.update({
        where: { id }, data: { status: decision === "APPROVE" ? "COMPLETED" : "FAILED" },
      });
    });
    await prisma.auditLog.create({ data: { userId: guard.user.id, action: `WALLET_${decision}`, entity: "ASSOCIATION_WALLET", entityId: transaction.walletId, details: `Transaction association ${id}` } }).catch(() => {});
    return NextResponse.json({ transaction: updated });
  }

  const transaction = await prisma.walletTransaction.findUnique({
    where: { id }, include: { wallet: { include: { user: { select: { id: true } } } } },
  });
  if (!transaction || transaction.status !== "PENDING") return NextResponse.json({ error: "Transaction introuvable ou déjà traitée" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    if (decision === "APPROVE" && transaction.type === "DEPOSIT") {
      await tx.wallet.update({ where: { id: transaction.walletId }, data: { balance: { increment: transaction.netAmount } } });
    }
    if (decision === "REJECT" && transaction.type === "WITHDRAWAL") {
      await tx.wallet.update({ where: { id: transaction.walletId }, data: { balance: { increment: transaction.netAmount } } });
    }
    return tx.walletTransaction.update({
      where: { id }, data: { status: decision === "APPROVE" ? "COMPLETED" : "FAILED" },
    });
  });

  await dispatchNotification({
    event: decision === "APPROVE" ? "WALLET_DEPOSIT" : "SECURITY_ALERT",
    userId: transaction.wallet.user.id,
    title: decision === "APPROVE" ? "Opération wallet confirmée" : "Opération wallet refusée",
    message: `Transaction ${transaction.type.toLowerCase()} — ${transaction.amount.toLocaleString("fr-FR")} ${transaction.wallet.currency}.`,
    link: "/dashboard/wallet",
    type: decision === "APPROVE" ? "SUCCESS" : "WARNING",
  }).catch(() => {});

  await prisma.auditLog.create({
    data: { userId: guard.user.id, action: `WALLET_${decision}`, entity: "WALLET", entityId: transaction.walletId, details: `Transaction ${id} ${decision}` },
  }).catch(() => {});
  return NextResponse.json({ transaction: updated });
}
