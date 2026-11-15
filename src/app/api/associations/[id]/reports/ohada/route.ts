import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import {
  generateFullSyscohadaReport,
  syscohadaBalanceToCsv,
  syscohadaJournalToCsv,
} from "@/lib/association/syscohada";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const membership = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId: id, status: { not: "LEFT" } },
  });

  if (!membership && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });
  }

  try {
    const report = await generateFullSyscohadaReport(prisma, id);
    const format = req.nextUrl.searchParams.get("format") ?? "json";

    if (format === "csv" || format === "journal-csv") {
      return new NextResponse(syscohadaJournalToCsv(report), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="journal-syscohada-${id}.csv"`,
        },
      });
    }

    if (format === "balance-csv") {
      return new NextResponse(syscohadaBalanceToCsv(report), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="balance-syscohada-${id}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (err: any) {
    if (err?.message === "ASSOCIATION_NOT_FOUND") {
      return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
    }
    console.error("SYSCOHADA report error:", err);
    return NextResponse.json({ error: "Erreur lors de l'export SYSCOHADA" }, { status: 500 });
  }
}
