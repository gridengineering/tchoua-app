import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/permissions";
import { dispatchNotification } from "@/lib/notifications/dispatch";

const BUREAU_ROLES = [
  "PRESIDENT", "FOUNDER", "VICE_PRESIDENT", "SECRETARY", "SECRETARY_ADJ",
  "TREASURER", "TREASURER_ADJ", "SOLIDARITY_OFFICER", "NATURE_OFFICER",
  "AUDITOR", "CENSOR", "ADVISOR",
];

type AssociationMember = {
  id: string;
  userId: string;
  role: string;
  status: string;
  founderRevokedAt: Date | null;
  user: { name: string; email: string };
};

async function loadContext(associationId: string) {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: {
      id: true,
      name: true,
      creatorId: true,
      memberships: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          userId: true,
          role: true,
          status: true,
          founderRevokedAt: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!association) return null;

  const memberships = association.memberships as AssociationMember[];
  const founder = memberships.find((m) => m.userId === association.creatorId && m.role === "FOUNDER")
    ?? memberships.find((m) => m.role === "FOUNDER" && !m.founderRevokedAt)
    ?? null;

  return { association, memberships, founder };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const context = await loadContext(id);
  if (!context) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });

  const me = context.memberships.find((m) => m.userId === session.user!.id) ?? null;
  if (!me && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Accès réservé aux membres de l'association" }, { status: 403 });
  }

  const request = await prisma.founderRevocationRequest.findFirst({
    where: { associationId: id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      proposedBy: { include: { user: { select: { name: true } } } },
      confirmedBy: { include: { user: { select: { name: true } } } },
    },
  });

  const isFounder = Boolean(me && context.founder && me.id === context.founder.id);
  const isBureau = Boolean(me && BUREAU_ROLES.includes(me.role));
  return NextResponse.json({
    founder: context.founder
      ? { membershipId: context.founder.id, name: context.founder.user.name, email: context.founder.user.email }
      : null,
    request: request
      ? {
          id: request.id,
          proposedById: request.proposedById,
          proposedByName: request.proposedBy.user.name,
          createdAt: request.createdAt,
          confirmedByName: request.confirmedBy?.user.name ?? null,
        }
      : null,
    isFounder,
    isBureau,
    isProposer: Boolean(request && me?.id === request.proposedById),
    canPropose: Boolean(isBureau && !isFounder && context.founder && !request),
    canConfirm: Boolean(isBureau && !isFounder && request && me?.id !== request.proposedById),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "PROPOSE" | "CONFIRM" | "CANCEL" | undefined;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  const context = await loadContext(id);
  if (!context) return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
  if (!context.founder) {
    return NextResponse.json({ error: "Aucun fondateur actif à révoquer" }, { status: 404 });
  }

  const me = context.memberships.find((m) => m.userId === session.user!.id) ?? null;
  if (!me) return NextResponse.json({ error: "Vous n'êtes pas membre actif de cette association" }, { status: 403 });
  if (me.id === context.founder.id || me.role === "FOUNDER") {
    return NextResponse.json({ error: "Le fondateur ne peut pas initier ou confirmer sa propre révocation" }, { status: 403 });
  }
  if (!BUREAU_ROLES.includes(me.role) && !isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Seul un membre du bureau peut agir" }, { status: 403 });
  }

  const pending = await prisma.founderRevocationRequest.findFirst({
    where: { associationId: id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (action === "CANCEL") {
    if (!pending) return NextResponse.json({ error: "Aucune demande en attente" }, { status: 404 });
    if (pending.proposedById !== me.id && !isPlatformAdmin(session)) {
      return NextResponse.json({ error: "Seul l'auteur de la proposition peut l'annuler" }, { status: 403 });
    }
    const cancelled = await prisma.founderRevocationRequest.update({
      where: { id: pending.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ success: true, request: cancelled });
  }

  if (action === "PROPOSE") {
    if (pending) {
      return NextResponse.json(
        { error: "Une proposition est déjà en attente. Un autre membre du bureau doit la confirmer." },
        { status: 409 }
      );
    }
    const proposal = await prisma.founderRevocationRequest.create({
      data: {
        associationId: id,
        founderMembershipId: context.founder.id,
        proposedById: me.id,
        reason: reason || null,
      },
    });

    await notifyBureau(context, me, "PROPOSED");
    await dispatchNotification({
      event: "SECURITY_ALERT",
      userId: context.founder.userId,
      associationId: id,
      title: "Proposition de retrait du privilège de fondateur",
      message: `${me.user.name} propose de retirer votre privilège de fondateur. Un autre membre du bureau doit confirmer.`,
      type: "ACTION_REQUIRED",
      link: `/associations/${id}/parametres`,
    });

    return NextResponse.json({ success: true, requiresConfirmation: true, proposal }, { status: 201 });
  }

  // CONFIRM — deuxième membre distinct du bureau
  if (!pending) {
    return NextResponse.json({ error: "Aucune proposition à confirmer" }, { status: 404 });
  }
  if (pending.proposedById === me.id) {
    return NextResponse.json(
      { error: "Un autre membre du bureau que le proposeur doit confirmer le retrait" },
      { status: 403 }
    );
  }

  const confirmed = await prisma.$transaction(async (tx) => {
    const request = await tx.founderRevocationRequest.update({
      where: { id: pending.id },
      data: { status: "CONFIRMED", confirmedById: me.id },
    });
    await tx.associationMembership.update({
      where: { id: context.founder!.id },
      data: { role: "MEMBER", founderRevokedAt: new Date() },
    });
    return request;
  });

  await notifyBureau(context, me, "CONFIRMED");
  await dispatchNotification({
    event: "SECURITY_ALERT",
    userId: context.founder.userId,
    associationId: id,
    title: "Privilège de fondateur retiré",
    message: `Deux membres du bureau ont confirmé le retrait de votre privilège de fondateur. Vous restez membre de l'association.`,
    type: "WARNING",
    link: `/associations/${id}`,
  });

  return NextResponse.json({
    success: true,
    revoked: true,
    request: confirmed,
    newRole: "MEMBER",
  });
}

async function notifyBureau(
  context: { association: { id: string; name: string }; memberships: AssociationMember[]; founder: AssociationMember | null },
  actor: AssociationMember,
  stage: "PROPOSED" | "CONFIRMED"
) {
  const recipients = context.memberships.filter(
    (m) => m.id !== actor.id && m.id !== context.founder?.id && BUREAU_ROLES.includes(m.role)
  );
  await Promise.all(
    recipients.map((member) =>
      dispatchNotification({
        event: "SECURITY_ALERT",
        userId: member.userId,
        associationId: context.association.id,
        title: stage === "PROPOSED" ? "Révocation du fondateur à confirmer" : "Révocation du fondateur confirmée",
        message:
          stage === "PROPOSED"
            ? `${actor.user.name} propose de retirer le privilège de fondateur. Un second membre du bureau doit confirmer.`
            : `${actor.user.name} a confirmé le retrait du privilège de fondateur.`,
        type: "ACTION_REQUIRED",
        link: `/associations/${context.association.id}/parametres`,
      }).catch(() => null)
    )
  );
}
