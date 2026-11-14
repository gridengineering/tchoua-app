import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

type TimelineItem = {
  at: string;
  type: string;
  title: string;
  detail?: string | null;
  actor?: string | null;
  href?: string | null;
};

export async function GET(request: NextRequest) {
  const guard = await requireSystemAdmin("ASSOCIATIONS", "READ");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const id = searchParams.get("id");
  if (!id || !["association", "user"].includes(String(entity))) {
    return NextResponse.json({ error: "entity (association|user) et id sont requis" }, { status: 400 });
  }

  const items: TimelineItem[] = [];

  if (entity === "association") {
    const association = await prisma.association.findUnique({
      where: { id },
      select: {
        id: true, name: true, status: true, trustScore: true, trustLevel: true, quarantinedAt: true,
        createdAt: true,
        lifecycleEvents: { orderBy: { createdAt: "desc" }, take: 100 },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true } } } },
        memberships: { orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { id: true, name: true } } } },
        meetings: { orderBy: { scheduledAt: "desc" }, take: 50 },
        socialAidReqs: { orderBy: { createdAt: "desc" }, take: 50, include: { membership: { include: { user: { select: { name: true } } } } } },
      },
    });
    if (!association) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });

    association.lifecycleEvents.forEach((event) => items.push({
      at: event.createdAt.toISOString(), type: "CYCLE_DE_VIE", title: `${event.fromStatus ?? "—"} → ${event.toStatus}`,
      detail: event.reason, actor: event.triggeredBy,
    }));
    association.auditLogs.forEach((log) => items.push({
      at: log.createdAt.toISOString(), type: "AUDIT", title: log.action, detail: log.details, actor: log.user?.name ?? null,
    }));
    association.memberships.forEach((membership) => items.push({
      at: membership.createdAt.toISOString(), type: "MEMBRE", title: `Adhésion de ${membership.user.name}`,
      detail: `${membership.role} · ${membership.status}`, href: `/admin/kyc?q=${encodeURIComponent(membership.user.name)}`,
    }));
    association.meetings.forEach((meeting) => items.push({
      at: meeting.scheduledAt.toISOString(), type: "REUNION", title: meeting.title ?? meeting.type,
      detail: `${meeting.status}${meeting.location ? ` · ${meeting.location}` : ""}`,
    }));
    association.socialAidReqs.forEach((aid) => items.push({
      at: aid.createdAt.toISOString(), type: "AIDE_SOCIALE", title: `Demande ${aid.category}`,
      detail: `${aid.status} · ${aid.requestedAmount} · ${aid.membership.user.name}`,
    }));

    const [contributions, loans] = await Promise.all([
      prisma.activityContribution.findMany({
        where: { activity: { associationId: id } },
        orderBy: { createdAt: "desc" }, take: 100,
        include: { membership: { include: { user: { select: { name: true } } } }, activity: { select: { name: true } } },
      }),
      prisma.assocLoan.findMany({
        where: { activity: { associationId: id } },
        orderBy: { createdAt: "desc" }, take: 100,
        include: { borrowerMembership: { include: { user: { select: { name: true } } } }, activity: { select: { name: true } } },
      }),
    ]);

    contributions.forEach((c) => items.push({
      at: c.createdAt.toISOString(), type: "COTISATION", title: `${c.activity.name} · ${c.amount}`,
      detail: `${c.status} · ${c.membership.user.name}`,
    }));
    loans.forEach((l) => items.push({
      at: l.createdAt.toISOString(), type: "PRET", title: `${l.activity.name} · ${l.amount}`,
      detail: `${l.status} · ${l.borrowerMembership.user.name}`,
    }));

    items.sort((a, b) => b.at.localeCompare(a.at));
    return NextResponse.json({ entity, id, header: association, items: items.slice(0, 300) });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, kycLevel: true, kycStatus: true, kycVerifiedAt: true,
      quarantinedAt: true, quarantineReason: true, createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const [kycRequests, consents, memberships, auditLogs, contributions, loans, socialAids] = await Promise.all([
    prisma.kycRequest.findMany({
      where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50,
      include: { documents: { select: { id: true, label: true, type: true, status: true } } },
    }),
    prisma.platformConsent.findMany({ where: { userId: id }, orderBy: { acceptedAt: "desc" }, take: 20 }),
    prisma.associationMembership.findMany({
      where: { userId: id }, orderBy: { createdAt: "desc" },
      include: { association: { select: { id: true, name: true, trustLevel: true } } },
    }),
    prisma.auditLog.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.contribution.findMany({
      where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100,
      include: { tontine: { select: { name: true } } },
    }),
    prisma.loan.findMany({
      where: { borrowerId: id }, orderBy: { createdAt: "desc" }, take: 100,
      include: { tontine: { select: { name: true } } },
    }),
    prisma.socialAid.findMany({ where: { requesterId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  kycRequests.forEach((request) => items.push({
    at: request.createdAt.toISOString(), type: "KYC", title: `Demande KYC ${request.requestedLevel}`,
    detail: `${request.status}${request.reviewNote ? ` · ${request.reviewNote}` : ""}`,
  }));
  consents.forEach((consent) => items.push({
    at: consent.acceptedAt.toISOString(), type: "CONSENTEMENT", title: consent.document,
    detail: `Version ${consent.version}`,
  }));
  memberships.forEach((membership) => items.push({
    at: membership.createdAt.toISOString(), type: "ADHESION", title: membership.association.name,
    detail: `${membership.role} · ${membership.status}`,
  }));
  auditLogs.forEach((log) => items.push({
    at: log.createdAt.toISOString(), type: "AUDIT", title: log.action, detail: log.details,
  }));
  contributions.forEach((c) => items.push({
    at: c.createdAt.toISOString(), type: "COTISATION", title: c.tontine.name, detail: `${c.amount} · ${c.status}`,
  }));
  loans.forEach((l) => items.push({
    at: l.createdAt.toISOString(), type: "PRET", title: l.tontine.name, detail: `${l.amount} · ${l.status}`,
  }));
  socialAids.forEach((a) => items.push({
    at: a.createdAt.toISOString(), type: "AIDE_SOCIALE", title: `${a.type} · ${a.description}`, detail: `${a.cashAmount} · ${a.status}`,
  }));

  items.sort((a, b) => b.at.localeCompare(a.at));
  return NextResponse.json({ entity, id, header: user, items: items.slice(0, 300) });
}
