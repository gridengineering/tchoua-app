import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAssociationBureau } from "@/lib/association/member-account";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/association/reports";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id: associationId } = await params;
  const me = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId, status: { not: "LEFT" } },
    select: { id: true, role: true, user: { select: { name: true } } },
  });
  if (!me) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const search = new URL(req.url).searchParams;
  const canManage = isAssociationBureau(me.role);
  const scopeAll = canManage && search.get("scope") === "association";
  const membershipId = search.get("membershipId") && canManage ? String(search.get("membershipId")) : scopeAll ? null : me.id;
  const where: any = { associationId, ...(membershipId ? { membershipId } : {}) };
  const activityId = search.get("activityId");
  const sessionId = search.get("sessionId");
  const method = search.get("method");
  const from = search.get("from");
  const to = search.get("to");
  if (activityId) where.activityId = activityId;
  if (sessionId) where.sessionId = sessionId;
  if (method) where.method = method.toUpperCase();
  if (from || to) where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(new Date(to).getTime() + 86_399_999) } : {}) };

  const transactions = await prisma.associationMemberTransaction.findMany({
    where,
    include: { activity: { select: { name: true } }, bankAccount: { select: { label: true, bankName: true, accountNumber: true } }, membership: { select: { memberNumber: true, user: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const rows = transactions.map((t) => ({
    Date: t.createdAt.toISOString().slice(0, 10),
    Membre: t.membership.user.name,
    Matricule: t.membership.memberNumber ?? "",
    Activité: t.activity?.name ?? "Compte membre",
    Type: t.type,
    Sens: t.direction === "IN" ? "Entrée" : "Sortie",
    Compte: t.method,
    Montant: t.amount,
    Solde: t.balanceAfter,
    Statut: t.status,
    Référence: t.reference ?? "",
    Banque: t.bankAccount?.bankName ?? "",
    Compte_bancaire: t.bankAccount?.accountNumber ?? "",
    Preuve: t.proofUrl ?? "",
  }));
  const format = (search.get("format") ?? "PDF").toUpperCase();
  const title = `Relevé compte association — ${me.user.name} — ${new Date().toISOString().slice(0, 10)}`;
  const filename = `releve-compte-${associationId}-${Date.now()}`;
  if (format === "EXCEL" || format === "XLS") {
    return new NextResponse(new Uint8Array(exportToExcel(rows)), { headers: { "Content-Type": "application/vnd.ms-excel", "Content-Disposition": `attachment; filename="${filename}.xls"` } });
  }
  if (format === "CSV") {
    return new NextResponse(exportToCSV(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.csv"` } });
  }
  const pdf = await exportToPDF(rows, title);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}.pdf"` } });
}
