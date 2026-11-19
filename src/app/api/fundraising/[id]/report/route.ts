import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManage, getFundraisingActor, serializeProject } from "@/lib/fundraising";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.fundraisingProject.findUnique({
    where: { id },
    include: { contributions: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  const actor = await getFundraisingActor(req, project.associationId);
  if (!actor || !canManage(actor) || (actor.associationId !== project.associationId && !actor.isPlatformAdmin)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const totals = serializeProject(project).totals;
  const byStatus = project.contributions.reduce<Record<string, { count: number; amount: number }>>((acc, c) => {
    const row = acc[c.status] || { count: 0, amount: 0 };
    row.count += 1;
    row.amount += c.amount;
    acc[c.status] = row;
    return acc;
  }, {});

  if (new URL(req.url).searchParams.get("format") === "csv") {
    const rows = [
      ["Projet", project.title],
      ["Type", project.type],
      ["Portée", project.scope],
      ["Statut", project.status],
      ["Cagnotte cible", project.targetAmount],
      ["Total promis/reçu", totals.pledged + totals.received],
      ["Progression %", totals.progress],
      ["Date début", project.startDate.toISOString()],
      ["Date fin", project.endDate.toISOString()],
      [],
      ["Date", "Contributeur", "Montant", "Statut", "Anonyme", "Message"],
      ...project.contributions.map((c) => [
        c.createdAt.toISOString(),
        c.isAnonymous ? "Anonyme" : c.contributorName || "",
        c.amount,
        c.status,
        c.isAnonymous ? "oui" : "non",
        c.message || "",
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="suivi-${project.id}.csv"`,
      },
    });
  }

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      type: project.type,
      scope: project.scope,
      status: project.status,
      targetAmount: project.targetAmount,
      currency: project.currency,
      startDate: project.startDate,
      endDate: project.endDate,
    },
    totals,
    byStatus,
    contributions: project.contributions.length,
    generatedAt: new Date().toISOString(),
  });
}
