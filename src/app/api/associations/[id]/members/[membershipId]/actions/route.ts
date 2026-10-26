import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";
import {
  validateMemberCanLeave,
  calculateDeceasedLiquidation,
} from "@/lib/association/rules";

async function getMembership(userId: string, associationId: string) {
  return prisma.associationMembership.findFirst({
    where: { userId, associationId, status: { not: "LEFT" } },
  });
}

function canPerformAction(
  session: any,
  actorMembership: any
): boolean {
  if (isSuperAdmin(session)) return true;
  if (!actorMembership) return false;
  if (actorMembership.role === "FOUNDER") return true;
  return ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY"].includes(
    actorMembership.role
  );
}

type ActionType =
  | "ACCEPT"
  | "REJECT"
  | "SUSPEND"
  | "REACTIVATE"
  | "EXCLUDE"
  | "BLACKLIST"
  | "PROMOTE"
  | "RETROGRADE"
  | "CHANGE_ROLE"
  | "RESIGN"
  | "DECEASED"
  | "TRANSFER_OWNERSHIP";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: associationId, membershipId } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, reason, newRole, newOwnerId, solidarityAidAmount } = body as {
    action: ActionType;
    reason?: string;
    newRole?: string;
    newOwnerId?: string;
    solidarityAidAmount?: number;
  };

  if (!action) {
    return NextResponse.json({ error: "action requise" }, { status: 400 });
  }

  const actorMembership = await getMembership(session.user.id, associationId);
  const isSelfResign = action === "RESIGN" && actorMembership?.id === membershipId;

  if (!isSelfResign && !canPerformAction(session, actorMembership)) {
    return NextResponse.json(
      { error: "Permission insuffisante" },
      { status: 403 }
    );
  }

  const targetMembership = await prisma.associationMembership.findFirst({
    where: { id: membershipId, associationId },
  });

  if (!targetMembership) {
    return NextResponse.json(
      { error: "Membre introuvable" },
      { status: 404 }
    );
  }

  const now = new Date();
  let updateData: any = {};
  let auditAction = "";
  let auditDetails = "";
  let liquidationSummary: ReturnType<typeof calculateDeceasedLiquidation> | undefined;

  switch (action) {
    case "ACCEPT": {
      const existingCount = prisma.associationMembership.count
        ? (await prisma.associationMembership.count({ where: { associationId } })) ?? 0
        : 0;
      const memberNumber =
        targetMembership.memberNumber ??
        `M-${String(existingCount + 1).padStart(3, "0")}`;
      updateData = {
        status: "ACTIVE",
        joinedAt: targetMembership.joinedAt ?? now,
        memberNumber,
      };
      auditAction = "MEMBER_ACCEPT";
      auditDetails = reason
        ? `Adhésion acceptée : ${reason}`
        : "Adhésion acceptée par le bureau";
      break;
    }

    case "REJECT": {
      // §7.4 : Motif obligatoire (min. 20 caractères) pour refuser une demande
      if (!reason || reason.trim().length < 20) {
        return NextResponse.json(
          {
            error:
              "Un motif d'au moins 20 caractères est obligatoire pour refuser une demande d'adhésion",
          },
          { status: 400 }
        );
      }
      updateData = {
        status: "REJECTED",
        leftAt: now,
        excludeReason: reason.trim(),
      };
      auditAction = "MEMBER_REJECT";
      auditDetails = `Refus d'adhésion : ${reason.trim()}`;
      break;
    }

    case "SUSPEND":
      updateData = { status: "SUSPENDED" };
      auditAction = "MEMBER_SUSPEND";
      auditDetails = reason ? `Suspension : ${reason}` : "Suspension du membre";
      break;

    case "REACTIVATE":
      updateData = { status: "ACTIVE" };
      auditAction = "MEMBER_REACTIVATE";
      auditDetails = reason
        ? `Réactivation : ${reason}`
        : "Réactivation du membre";
      break;

    case "EXCLUDE":
      updateData = {
        status: "EXPELLED",
        excludedAt: now,
        excludeReason: reason ?? null,
      };
      auditAction = "MEMBER_EXCLUDE";
      auditDetails = reason ? `Exclusion : ${reason}` : "Exclusion du membre";
      break;

    case "BLACKLIST":
      updateData = {
        status: "BLACKLISTED",
        blacklistedAt: now,
        blacklistReason: reason ?? null,
      };
      auditAction = "MEMBER_BLACKLIST";
      auditDetails = reason
        ? `Blacklist : ${reason}`
        : "Mise en blacklist du membre";
      break;

    case "PROMOTE":
      if (!newRole) {
        return NextResponse.json(
          { error: "newRole requis pour PROMOTE" },
          { status: 400 }
        );
      }
      updateData = { role: newRole };
      auditAction = "MEMBER_PROMOTE";
      auditDetails = `Promotion vers ${newRole}`;
      break;

    case "RETROGRADE": {
      const targetRole = newRole || "MEMBER";
      updateData = { role: targetRole };
      auditAction = "MEMBER_RETROGRADE";
      auditDetails = `Rétrogradation vers ${targetRole}`;
      break;
    }

    case "CHANGE_ROLE": {
      if (actorMembership?.role !== "FOUNDER" && !isSuperAdmin(session)) {
        return NextResponse.json(
          { error: "Changement de rôle du bureau réservé au fondateur" },
          { status: 403 }
        );
      }
      if (!newRole) {
        return NextResponse.json(
          { error: "newRole requis pour CHANGE_ROLE" },
          { status: 400 }
        );
      }
      updateData = { role: newRole };
      auditAction = "MEMBER_CHANGE_ROLE";
      auditDetails = `Changement de rôle vers ${newRole}`;
      break;
    }

    case "RESIGN": {
      // R-020 : Vérifier l'absence de prêts actifs ou d'amendes impayées
      const leaveCheck = await validateMemberCanLeave(membershipId, prisma);
      if (!leaveCheck.valid) {
        return NextResponse.json({ error: leaveCheck.error }, { status: 400 });
      }
      updateData = {
        status: "LEFT",
        leftAt: now,
      };
      auditAction = "MEMBER_RESIGN";
      auditDetails = reason
        ? `Démission volontaire : ${reason}`
        : "Démission volontaire du membre";
      break;
    }

    case "DECEASED": {
      // SPECIFICATION.md §2.2 & §7.3 : Protocole Décès — blocage du compte, calcul balance finale, ventilation 75% enfants / 25% ayants droit
      const [paidContribs, activeLoans, unpaidSanctions] = await Promise.all([
        prisma.activityContribution?.findMany
          ? prisma.activityContribution.findMany({
              where: { membershipId, status: "PAID" },
              select: { amount: true },
            })
          : Promise.resolve([]),
        prisma.assocLoan?.findMany
          ? prisma.assocLoan.findMany({
              where: {
                borrowerMembershipId: membershipId,
                status: { in: ["APPROVED", "ACTIVE", "OVERDUE", "DEFAULTED"] },
              },
              include: { repayments: true },
            })
          : Promise.resolve([]),
        prisma.assocSanction?.findMany
          ? prisma.assocSanction.findMany({
              where: { membershipId, status: { in: ["PENDING", "APPLIED"] } },
              select: { penaltyAmount: true },
            })
          : Promise.resolve([]),
      ]);

      const totalAssets = (paidContribs ?? []).reduce(
        (sum: number, c: any) => sum + (c.amount ?? 0),
        0
      );
      const unpaidLoans = (activeLoans ?? []).reduce((sum: number, l: any) => {
        const repaid = (l.repayments ?? []).reduce(
          (rs: number, r: any) => rs + (r.amount ?? 0),
          0
        );
        return sum + Math.max(0, (l.totalDue ?? l.amount ?? 0) - repaid);
      }, 0);
      const unpaidFines = (unpaidSanctions ?? []).reduce(
        (sum: number, s: any) => sum + (s.penaltyAmount ?? s.amount ?? 0),
        0
      );

      liquidationSummary = calculateDeceasedLiquidation({
        totalAssets,
        unpaidLoans,
        unpaidFines,
        solidarityAidAmount: solidarityAidAmount ?? 0,
      });

      updateData = {
        status: "LEFT",
        leftAt: now,
        excludeReason: `DECEASED: ${reason ?? "Décès déclaré"}`,
      };
      auditAction = "MEMBER_DECEASED_LIQUIDATION";
      auditDetails = `Protocole décès activé — Balance nette: ${liquidationSummary.netBalance}, Enfants (75%): ${liquidationSummary.childrenShare75}, Ayants droit (25%): ${liquidationSummary.rightfulClaimantsShare25}`;
      break;
    }

    case "TRANSFER_OWNERSHIP":
      if (!newOwnerId) {
        return NextResponse.json(
          { error: "newOwnerId requis pour TRANSFER_OWNERSHIP" },
          { status: 400 }
        );
      }

      if (
        actorMembership?.role !== "FOUNDER" &&
        actorMembership?.role !== "PRESIDENT"
      ) {
        return NextResponse.json(
          { error: "Transfert réservé au président ou fondateur" },
          { status: 403 }
        );
      }

      const newOwner = await prisma.associationMembership.findFirst({
        where: {
          userId: newOwnerId,
          associationId,
          status: "ACTIVE",
        },
      });

      if (!newOwner) {
        return NextResponse.json(
          { error: "Nouveau propriétaire introuvable ou inactif" },
          { status: 404 }
        );
      }

      // Rétrograder l'ancien PRESIDENT s'il existe et que ce n'est pas le nouveau
      const currentPresident = await prisma.associationMembership.findFirst({
        where: { associationId, role: "PRESIDENT", status: "ACTIVE" },
      });

      if (currentPresident && currentPresident.id !== newOwner.id) {
        await prisma.associationMembership.update({
          where: { id: currentPresident.id },
          data: { role: "MEMBER" },
        });
      }

      // Promouvoir le nouveau propriétaire
      if (newOwner.id !== membershipId) {
        await prisma.associationMembership.update({
          where: { id: newOwner.id },
          data: { role: "PRESIDENT" },
        });
      }

      updateData = { role: "PRESIDENT" };
      auditAction = "TRANSFER_OWNERSHIP";
      auditDetails = `Transfert de présidence à ${newOwnerId}`;
      break;

    default:
      return NextResponse.json(
        { error: "Action non supportée" },
        { status: 400 }
      );
  }

  try {
    const updated = await prisma.associationMembership.update({
      where: { id: membershipId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.associationAuditLog.create({
      data: {
        associationId,
        userId: session.user.id,
        action: auditAction,
        entity: "MEMBERSHIP",
        entityId: membershipId,
        changes: JSON.stringify(
          liquidationSummary
            ? { ...updateData, liquidation: liquidationSummary }
            : updateData
        ),
        details: auditDetails,
      },
    });

    return NextResponse.json({
      success: true,
      membership: updated,
      ...(liquidationSummary ? { liquidation: liquidationSummary } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erreur lors de l'action" },
      { status: 500 }
    );
  }
}
