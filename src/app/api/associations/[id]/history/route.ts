import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allocateInterest, loadCapitalEntries } from "@/lib/association/history";

const BUREAU = ["FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ"];

type HistEvent = {
  id: string;
  date: string;
  type: string;
  label: string;
  amount: number;
  direction: "IN" | "OUT";
  membershipId?: string | null;
  memberName?: string | null;
  activityId?: string | null;
  activityName?: string | null;
  meta?: Record<string, unknown>;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const membership = await prisma.associationMembership.findFirst({
    where: { associationId, userId: session.user.id, status: { not: "LEFT" } },
    include: { user: { select: { name: true } } },
  });
  if (!membership) return NextResponse.json({ error: "Accès réservé aux membres" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const scope = sp.get("scope") ?? "association";
  const typeFilter = (sp.get("type") ?? "ALL").toUpperCase();
  const activityId = sp.get("activityId") || undefined;
  const from = sp.get("from") ? new Date(sp.get("from") as string) : undefined;
  const to = sp.get("to") ? new Date(sp.get("to") as string) : undefined;
  const groupBy = (sp.get("groupBy") ?? "member").toLowerCase();
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(5, Number(sp.get("pageSize") ?? "25")));

  const isBureau = BUREAU.includes(membership.role);
  let membershipId = sp.get("membershipId") || undefined;
  if (scope === "member") {
    if (!isBureau) membershipId = membership.id;
    if (!membershipId) return NextResponse.json({ error: "membershipId requis" }, { status: 400 });
  }

  const [contributions, loans, repayments, beneficiaries, aids, capitalEntries, members, activities] = await Promise.all([
    prisma.activityContribution.findMany({
      where: { activity: { associationId, ...(activityId ? { id: activityId } : {}) }, ...(membershipId ? { membershipId } : {}) },
      include: { activity: { select: { id: true, name: true, type: true } }, membership: { include: { user: { select: { name: true } } } } },
    }),
    prisma.assocLoan.findMany({
      where: { activity: { associationId, ...(activityId ? { id: activityId } : {}) }, ...(membershipId ? { borrowerMembershipId: membershipId } : {}) },
      include: { activity: { select: { id: true, name: true } }, borrowerMembership: { include: { user: { select: { name: true } } } } },
    }),
    prisma.assocLoanRepayment.findMany({
      where: {
        loan: {
          activity: { associationId, ...(activityId ? { id: activityId } : {}) },
          ...(membershipId ? { borrowerMembershipId: membershipId } : {}),
        },
      },
      include: {
        loan: {
          include: {
            activity: { select: { id: true, name: true } },
            borrowerMembership: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.activityBeneficiary.findMany({
      where: {
        session: { activity: { associationId, ...(activityId ? { id: activityId } : {}) } },
        ...(membershipId ? { membershipId } : {}),
      },
      include: {
        session: { include: { activity: { select: { id: true, name: true, type: true } } } },
        membership: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.assocSocialAidRequest.findMany({
      where: { associationId, status: "PAID", ...(membershipId ? { membershipId } : {}) },
      include: { membership: { include: { user: { select: { name: true } } } } },
    }),
    loadCapitalEntries(prisma, associationId),
    prisma.associationMembership.findMany({
      where: { associationId, status: { not: "LEFT" } },
      select: { id: true, role: true, user: { select: { name: true } } },
    }),
    prisma.associationActivity.findMany({ where: { associationId }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }),
  ]);

  const events: HistEvent[] = [];

  for (const c of contributions) {
    events.push({
      id: `c-${c.id}`, date: (c.paidAt ?? c.dueAt ?? c.createdAt).toISOString(), type: "CONTRIBUTION",
      label: `Cotisation — ${c.activity.name}`, amount: Number(c.amount), direction: "IN",
      membershipId: c.membershipId, memberName: c.membership.user.name,
      activityId: c.activity.id, activityName: c.activity.name,
      meta: { statut: c.status, mode: c.paymentMethod, unité: c.unit, référence: c.reference },
    });
  }

  for (const l of loans) {
    events.push({
      id: `l-${l.id}`, date: (l.disbursedAt ?? l.createdAt).toISOString(), type: "LOAN",
      label: `Prêt décaissé — ${l.borrowerMembership.user.name}`, amount: Number(l.amount), direction: "OUT",
      membershipId: l.borrowerMembershipId, memberName: l.borrowerMembership.user.name,
      activityId: l.activity.id, activityName: l.activity.name,
      meta: { statut: l.status, taux: l.interestRate, durée: l.duration, totalDu: l.totalDue, échéance: l.dueDate?.toISOString() },
    });
  }

  for (const r of repayments) {
    const interest = Number(r.interest ?? Math.max(Number(r.amount) - Number(r.principal ?? 0), 0));
    events.push({
      id: `r-${r.id}`, date: r.paidAt.toISOString(), type: "REPAYMENT",
      label: `Remboursement — ${r.loan.borrowerMembership.user.name}`, amount: Number(r.amount), direction: "IN",
      membershipId: r.loan.borrowerMembershipId, memberName: r.loan.borrowerMembership.user.name,
      activityId: r.loan.activity.id, activityName: r.loan.activity.name,
      meta: { principal: r.principal, intérêt: interest, mode: r.paymentMethod, référence: r.reference },
    });

    if (interest > 0) {
      const date = r.loan.disbursedAt ?? r.loan.createdAt;
      if (scope === "member" && membershipId) {
        const alloc = allocateInterest(capitalEntries, interest, date).find((a) => a.membershipId === membershipId);
        if (alloc) {
          events.push({
            id: `i-${r.id}-${membershipId}`, date: r.paidAt.toISOString(), type: "INTEREST",
            label: `Part d'intérêts — prêt ${r.loan.borrowerMembership.user.name}`, amount: alloc.amount, direction: "IN",
            membershipId, memberName: alloc.memberName, activityId: r.loan.activity.id, activityName: r.loan.activity.name,
            meta: { intérêtTotal: interest, capital: alloc.capital, capitalTotal: alloc.totalCapital, quotePart: alloc.ratio },
          });
        }
      } else {
        events.push({
          id: `i-${r.id}`, date: r.paidAt.toISOString(), type: "INTEREST",
          label: `Intérêts répartis — prêt ${r.loan.borrowerMembership.user.name}`, amount: interest, direction: "IN",
          membershipId: null, memberName: "Répartition membres", activityId: r.loan.activity.id, activityName: r.loan.activity.name,
          meta: { prêt: r.loanId, emprunteur: r.loan.borrowerMembership.user.name },
        });
      }
    }
  }

  for (const b of beneficiaries) {
    events.push({
      id: `b-${b.id}`, date: (b.paidAt ?? b.session.heldAt ?? b.session.scheduledAt).toISOString(), type: "BENEFICIARY",
      label: `Bénéficiaire — ${b.session.activity.name}`, amount: Number(b.amount), direction: "OUT",
      membershipId: b.membershipId, memberName: b.membership.user.name,
      activityId: b.session.activity.id, activityName: b.session.activity.name,
      meta: { parts: b.partsCount, session: b.session.sessionNumber },
    });
  }

  for (const a of aids) {
    events.push({
      id: `a-${a.id}`, date: (a.paidAt ?? a.approvedAt ?? a.createdAt).toISOString(), type: "AID",
      label: `Aide sociale — ${a.category}`, amount: Number(a.approvedAmount ?? a.requestedAmount), direction: "OUT",
      membershipId: a.membershipId, memberName: a.membership.user.name,
      meta: { statut: a.status, urgence: a.urgencyLevel },
    });
  }

  const filtered = events
    .filter((e) => (typeFilter === "ALL" ? true : e.type === typeFilter))
    .filter((e) => (from ? new Date(e.date) >= from : true))
    .filter((e) => (to ? new Date(e.date) <= new Date(to.getTime() + 86_400_000 - 1) : true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const summary = filtered.reduce(
    (acc, e) => {
      if (e.direction === "IN") acc.in += e.amount; else acc.out += e.amount;
      return acc;
    },
    { in: 0, out: 0 }
  );

  const keys = new Map<string, { key: string; label: string; in: number; out: number; count: number; byType: Record<string, number> }>();
  const groupKey = (e: HistEvent): { key: string; label: string } => {
    if (groupBy === "activity") return { key: e.activityId ?? "none", label: e.activityName ?? "Sans activité" };
    if (groupBy === "type") return { key: e.type, label: e.type };
    if (groupBy === "month") return { key: e.date.slice(0, 7), label: e.date.slice(0, 7) };
    return { key: e.membershipId ?? "pool", label: e.memberName ?? "Répartition" };
  };
  for (const e of filtered) {
    const { key, label } = groupKey(e);
    const g = keys.get(key) ?? { key, label, in: 0, out: 0, count: 0, byType: {} };
    if (e.direction === "IN") g.in += e.amount; else g.out += e.amount;
    g.count += 1;
    g.byType[e.type] = (g.byType[e.type] ?? 0) + e.amount;
    keys.set(key, g);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageEvents = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    scope, typeFilter, activityId: activityId ?? null, membershipId: membershipId ?? null, groupBy,
    page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)),
    summary: { in: summary.in, out: summary.out, net: summary.in - summary.out },
    groups: Array.from(keys.values()).sort((a, b) => b.in + b.out - (a.in + a.out)),
    pivot: Array.from(keys.values()).sort((a, b) => b.in + b.out - (a.in + a.out)),
    events: pageEvents,
    members: members.map((m) => ({ id: m.id, name: m.user.name, role: m.role })),
    activities,
    canViewAll: isBureau,
  });
}
