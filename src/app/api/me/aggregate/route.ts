import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Vue agrégée multi-associations.
// Renvoie les activités / prêts / séances / aides sociales du membre connecté
// à travers toutes ses associations, enrichies de l'info association.
//
//   ?resource=activities[&type=TONTINE|EPARGNE|PRET|INVESTISSEMENT|NATURE|AIDE_SOLIDAIRE|...]
//   ?resource=loans
//   ?resource=sessions
//   ?resource=aids

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") ?? "activities";
  const typeFilter = searchParams.get("type"); // ex: TONTINE → match TONTINE_ROTATIVE, TONTINE_ASCA…
  const assocFilter = searchParams.get("associationId");

  const BUREAU_ROLES = ["FOUNDER", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ", "TREASURER", "TREASURER_ADJ"];
  const memberships = await prisma.associationMembership.findMany({
    where: { userId: session.user.id, status: { not: "LEFT" } },
    select: { id: true, associationId: true, role: true },
  });
  const bureauAssocIds = memberships.filter((m) => BUREAU_ROLES.includes(m.role)).map((m) => m.associationId);
  const membershipIds = memberships.map((m) => m.id);
  const assocIds = assocFilter
    ? memberships.filter((m) => m.associationId === assocFilter).map((m) => m.associationId)
    : memberships.map((m) => m.associationId);

  const associations = await prisma.association.findMany({
    where: { id: { in: assocIds } },
    select: { id: true, name: true, color: true, type: true },
  });
  const assocById = new Map(associations.map((a) => [a.id, a]));

  if (resource === "activities") {
    const where: Record<string, unknown> = { associationId: { in: assocIds } };
    if (typeFilter) where.type = { startsWith: typeFilter };

    const activities = await prisma.associationActivity.findMany({
      where,
      include: {
        _count: { select: { subscriptions: true, actSessions: true } },
        subscriptions: {
          where: { membershipId: { in: membershipIds } },
          select: { id: true, status: true, partsCount: true },
        },
      },
      orderBy: [{ associationId: "asc" }, { sortOrder: "asc" }],
    });

    const items = activities.map((a) => ({
      ...a,
      association: assocById.get(a.associationId) ?? null,
      mySubscription: a.subscriptions[0] ?? null,
      subscriptions: undefined,
    }));
    return NextResponse.json({ resource, associations, items });
  }

  if (resource === "loans") {
    const loans = await prisma.assocLoan.findMany({
      where: {
        AND: [
          assocFilter
            ? { activity: { associationId: assocFilter } }
            : { activity: { associationId: { in: assocIds } } },
          {
            OR: [
              { activity: { associationId: { in: bureauAssocIds } } },
              { borrowerMembership: { userId: session.user.id } },
            ],
          },
        ],
      },
      include: {
        activity: { select: { id: true, name: true, type: true, associationId: true } },
        repayments: true,
        borrowerMembership: {
          select: { id: true, userId: true, user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = loans.map((l) => ({
      ...l,
      association: assocById.get(l.activity.associationId) ?? null,
      isMine: l.borrowerMembership.userId === session.user.id,
    }));
    return NextResponse.json({ resource, associations, items });
  }

  if (resource === "sessions") {
    const sessions = await prisma.activitySession.findMany({
      where: assocFilter
        ? { activity: { associationId: assocFilter } }
        : { activity: { associationId: { in: assocIds } } },
      include: {
        activity: { select: { id: true, name: true, type: true, associationId: true } },
        _count: { select: { contributions: true, beneficiaries: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 200,
    });

    const items = sessions.map((s) => ({
      ...s,
      association: assocById.get(s.activity.associationId) ?? null,
    }));
    return NextResponse.json({ resource, associations, items });
  }

  if (resource === "aids") {
    const aids = await prisma.assocSocialAidRequest.findMany({
      where: {
        AND: [
          assocFilter
            ? { associationId: assocFilter }
            : { associationId: { in: assocIds } },
          {
            OR: [
              { associationId: { in: bureauAssocIds } },
              { membership: { userId: session.user.id } },
            ],
          },
        ],
      },
      include: {
        membership: {
          select: { id: true, userId: true, user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = aids.map((a) => ({
      ...a,
      association: assocById.get(a.associationId) ?? null,
      isMine: a.membership.userId === session.user.id,
    }));
    return NextResponse.json({ resource, associations, items });
  }

  return NextResponse.json({ error: "resource invalide" }, { status: 400 });
}
