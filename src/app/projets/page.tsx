import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { prisma } from "@/lib/prisma";
import { projectTotals, FUNDRAISING_TYPE_LABELS, type FundraisingType } from "@/lib/fundraising";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) + " FCFA";
}

export default async function PublicProjectsPage() {
  const projects = await prisma.fundraisingProject.findMany({
    where: { scope: "PUBLIC", status: { in: ["PUBLISHED", "CLOSED"] } },
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }],
    take: 60,
    include: { contributions: { select: { id: true, amount: true, status: true, contributorUserId: true, contributorEmail: true } } },
  });
  const associations = await prisma.association.findMany({
    where: { id: { in: Array.from(new Set(projects.map((p) => p.associationId))) } },
    select: { id: true, name: true, logo: true },
  });
  const names = new Map(associations.map((a) => [a.id, a]));

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-[#dbe7dd] bg-gradient-to-br from-[#f6fbf7] via-white to-[#fbf8ef] p-7 sm:p-12">
          <span className="inline-flex rounded-full bg-[#0d3d28]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#0d3d28]">
            Projets solidaires · Tchoua
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-[#102019] sm:text-5xl">
            Soutenez les projets des associations.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#68766d]">
            Aides, projets collectifs, main levées : découvrez les cagnottes ouvertes au public,
            suivez leur progression et contribuez en quelques clics.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[#cfdcd1] bg-white p-10 text-center">
            <p className="text-sm font-bold text-[#102019]">Aucun projet public ouvert pour le moment.</p>
            <p className="mt-2 text-xs text-[#68766d]">Les associations peuvent publier leurs levées depuis l’application Fundraising.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const totals = projectTotals(project);
              const assoc = names.get(project.associationId);
              return (
                <Link key={project.id} href={`/projets/${project.id}`} className="group flex flex-col rounded-3xl border border-[#dfe8e1] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#9fbea7] hover:shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#eef5ef] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#0d3d28]">
                      {FUNDRAISING_TYPE_LABELS[project.type as FundraisingType] || project.type}
                    </span>
                    <span className="text-[10px] font-bold text-[#8a968e]">{totals.countdown}</span>
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-lg font-black tracking-[-0.03em] text-[#102019]">{project.title}</h2>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#68766d]">{project.contextJustification || project.objectives}</p>
                  <div className="mt-auto pt-5">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-[#8a968e]">Cagnotte</div>
                        <div className="text-base font-black text-[#0d3d28]">{money(project.targetAmount)}</div>
                      </div>
                      <div className="text-right text-[11px] font-black text-[#0d3d28]">{totals.progress}%</div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf2ee]">
                      <div className="h-full rounded-full bg-[#0d3d28]" style={{ width: `${totals.progress}%` }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-[#8a968e]">
                      <span>{assoc?.name || "Association Tchoua"}</span>
                      <span>{totals.contributions} contribution(s)</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
