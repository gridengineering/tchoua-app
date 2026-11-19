import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowLeft, CalendarDays, Target, Users } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { PublicContributionForm } from "@/components/fundraising/public-contribution-form";
import { prisma } from "@/lib/prisma";
import { projectTotals, FUNDRAISING_TYPE_LABELS, FUNDRAISING_SCOPE_LABELS, type FundraisingType, type FundraisingScope } from "@/lib/fundraising";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) + " FCFA";
}
function date(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(value);
}

export default async function PublicProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.fundraisingProject.findUnique({
    where: { id },
    include: { contributions: { where: { status: { not: "CANCELLED" } }, select: { id: true, amount: true, status: true, contributorUserId: true, contributorEmail: true } } },
  });
  if (!project) notFound();

  if (project.scope !== "PUBLIC") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/projets/${id}`)}`);
    if (!["PUBLISHED", "CLOSED"].includes(project.status)) notFound();
    const membership = await prisma.associationMembership.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        ...(project.scope === "ASSOCIATION" ? { associationId: project.associationId } : {}),
      },
      select: { id: true },
    });
    if (!membership) notFound();
  } else if (!["PUBLISHED", "CLOSED"].includes(project.status)) {
    notFound();
  }

  const association = await prisma.association.findUnique({ where: { id: project.associationId }, select: { name: true, logo: true, region: true } });
  const totals = projectTotals(project);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl">
        <Link href="/projets" className="inline-flex items-center gap-2 text-xs font-bold text-[#0d3d28] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Tous les projets
        </Link>

        <div className="mt-4 overflow-hidden rounded-[2rem] border border-[#dbe7dd] bg-white">
          <div className="bg-gradient-to-br from-[#0d3d28] via-[#174f36] to-[#2f6b47] p-7 text-white sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]">{FUNDRAISING_TYPE_LABELS[project.type as FundraisingType] || project.type}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]">{FUNDRAISING_SCOPE_LABELS[project.scope as FundraisingScope] || project.scope}</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">{project.title}</h1>
            <p className="mt-3 text-sm text-white/70">{association?.name || "Association Tchoua"}{association?.region ? ` · ${association.region}` : ""}</p>
          </div>

          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.45fr_0.85fr]">
            <div className="space-y-7">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.14em] text-[#8a968e]">Contexte & justification</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#3f4e45]">{project.contextJustification}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><h2 className="text-xs font-black uppercase tracking-[0.14em] text-[#8a968e]">Objectifs</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#3f4e45]">{project.objectives}</p></div>
                <div><h2 className="text-xs font-black uppercase tracking-[0.14em] text-[#8a968e]">Résultats attendus</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#3f4e45]">{project.expectedResults}</p></div>
              </div>
              <div><h2 className="text-xs font-black uppercase tracking-[0.14em] text-[#8a968e]">Bénéficiaires</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#3f4e45]">{project.beneficiaries}</p></div>
              <div className="flex flex-wrap gap-4 rounded-2xl bg-[#f5f8f4] p-4 text-xs text-[#3f4e45]">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#0d3d28]" /> {date(project.startDate)} → {date(project.endDate)}</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#0d3d28]" /> {totals.uniqueContributors} contributeur(s)</span>
                <span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-[#0d3d28]" /> {project.contributionMode === "FIXE" ? `Contribution fixe : ${money(project.fixedAmount || 0)}` : "Contribution libre"}</span>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#dfe8e1] bg-[#fbfcf9] p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8a968e]">Cagnotte cible</div>
                <div className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#0d3d28]">{money(project.targetAmount)}</div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e7eee8]"><div className="h-full rounded-full bg-[#0d3d28]" style={{ width: `${totals.progress}%` }} /></div>
                <div className="mt-2 flex justify-between text-[11px] font-bold text-[#5f7065]"><span>{money(totals.pledged + totals.received)} collectés</span><span>{totals.progress}%</span></div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#0d3d28]"><span>{totals.countdown}</span><span>{totals.contributions} contributions</span></div>
              </div>
              {project.status === "PUBLISHED" ? (
                <PublicContributionForm
                  projectId={project.id}
                  currency={project.currency}
                  contributionMode={project.contributionMode}
                  fixedAmount={project.fixedAmount}
                  contributorMode={project.contributorMode}
                />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900">Cette levée est clôturée. Les contributions ne sont plus acceptées.</div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
