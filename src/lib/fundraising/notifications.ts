import { prisma } from "@/lib/prisma";
import { isBureauRole } from "@/lib/apps";
import { FUNDRAISING_SCOPE_LABELS, FUNDRAISING_TYPE_LABELS, type FundraisingScope, type FundraisingType } from "@/lib/fundraising";

function fmtAmount(amount: number, currency = "XAF") {
  return `${Math.round(amount).toLocaleString("fr-FR")} ${currency}`;
}

function fmtDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

/**
 * Diffuse un projet publié dans le groupe de chaque association cible.
 * - ASSOCIATION : uniquement l'association porteuse ;
 * - ALL_ASSOCIATIONS : toutes les associations actives ;
 * - PUBLIC : toutes les associations actives + visibilité publique.
 *
 * Chaque membre actif reçoit une AssociationNotification et un message SYSTEM
 * est publié dans le canal GENERAL du groupe de l'association.
 */
export async function notifyFundraisingProject(project: {
  id: string;
  associationId: string;
  title: string;
  type: string;
  scope: string;
  targetAmount: number;
  currency: string;
  endDate: Date;
}) {
  const scope = project.scope as FundraisingScope;
  const typeLabel = FUNDRAISING_TYPE_LABELS[project.type as FundraisingType] || project.type;
  let targetIds: string[] = [project.associationId];

  if (scope === "ALL_ASSOCIATIONS" || scope === "PUBLIC") {
    const associations = await prisma.association.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    targetIds = Array.from(new Set([project.associationId, ...associations.map((a) => a.id)]));
  }

  const title = "Nouveau projet de levée de fonds";
  const body = `${typeLabel} : ${project.title} — objectif ${fmtAmount(project.targetAmount, project.currency)} — clôture le ${fmtDate(project.endDate)}. Portée : ${FUNDRAISING_SCOPE_LABELS[scope] || scope}.`;
  const link = `/projets/${project.id}`;
  let notified = 0;

  for (const associationId of targetIds) {
    try {
      const members = await prisma.associationMembership.findMany({
        where: { associationId, status: "ACTIVE" },
        select: { id: true, role: true },
        orderBy: { createdAt: "asc" },
      });
      if (members.length === 0) continue;

      const author = members.find((m) => isBureauRole(m.role)) || members[0];
      await prisma.assocMessage.create({
        data: {
          associationId,
          membershipId: author.id,
          type: "SYSTEM",
          channel: "GENERAL",
          content: `📣 ${title}\n${body}\nContribuer : ${link}`,
        },
      });

      await prisma.associationNotification.createMany({
        data: members.map((member) => ({
          associationId,
          membershipId: member.id,
          title,
          message: body,
          type: "ACTION_REQUIRED",
          link,
        })),
      });
      notified += 1;
    } catch (error) {
      // Une association ne doit pas bloquer la publication pour les autres.
      console.error("fundraising notification failed", associationId, error);
    }
  }

  await prisma.fundraisingProject.update({
    where: { id: project.id },
    data: { notificationCount: notified },
  }).catch(() => null);

  return notified;
}
