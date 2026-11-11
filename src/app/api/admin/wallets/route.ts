import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const guard = await requireSystemAdmin("WALLETS", "READ");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const wallets = await prisma.wallet.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { balance: "desc" },
      take: limit,
    });

    const totalBalanceResult = await prisma.wallet.aggregate({
      _sum: { balance: true }
    });

    const totalBalance = totalBalanceResult._sum.balance || 0;

    return NextResponse.json({ wallets, totalBalance });
  } catch (error: any) {
    console.error("Erreur GET /api/admin/wallets:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireSystemAdmin("WALLETS", "READ");
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { walletId, action } = body;

    if (!walletId || !["SUSPEND", "ACTIVATE"].includes(action)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { status: action === "SUSPEND" ? "SUSPENDED" : "ACTIVE" },
      include: { user: { select: { name: true } } }
    });

    return NextResponse.json({ wallet: updatedWallet });
  } catch (error: any) {
    console.error("Erreur POST /api/admin/wallets:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
