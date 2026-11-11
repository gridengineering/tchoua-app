import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BUREAU_ROLES = ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "CENSOR"];

async function membership(associationId: string, userId: string) {
  return prisma.associationMembership.findFirst({
    where: { associationId, userId },
    select: { id: true, role: true, status: true },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const me = await membership(id, session.user.id);
  if (!me) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const accounts = await prisma.assocBankAccount.findMany({
    where: { associationId: id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const me = await membership(id, session.user.id);
  if (!me || me.status !== "ACTIVE" || !BUREAU_ROLES.includes(me.role)) {
    return NextResponse.json({ error: "Seul le bureau peut gérer les comptes" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.label) return NextResponse.json({ error: "Libellé requis" }, { status: 400 });

  const account = await prisma.$transaction(async (tx) => {
    if (body.isDefault) {
      await tx.assocBankAccount.updateMany({ where: { associationId: id }, data: { isDefault: false } });
    }
    return tx.assocBankAccount.create({
      data: {
        associationId: id,
        label: body.label,
        type: body.type || "BANK",
        bankName: body.bankName || null,
        accountNumber: body.accountNumber || null,
        accountHolder: body.accountHolder || null,
        iban: body.iban || null,
        bic: body.bic || null,
        mobileNumber: body.mobileNumber || null,
        mobileOperator: body.mobileOperator || null,
        isDefault: !!body.isDefault,
        signatories: body.signatories ? JSON.stringify(body.signatories) : null,
        notes: body.notes || null,
      },
    });
  });

  return NextResponse.json({ account }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const me = await membership(id, session.user.id);
  if (!me || me.status !== "ACTIVE" || !BUREAU_ROLES.includes(me.role)) {
    return NextResponse.json({ error: "Seul le bureau peut gérer les comptes" }, { status: 403 });
  }

  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId requis" }, { status: 400 });

  await prisma.assocBankAccount.deleteMany({ where: { id: accountId, associationId: id } });
  return NextResponse.json({ ok: true });
}
