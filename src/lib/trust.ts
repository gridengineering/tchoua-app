import { prisma } from "@/lib/prisma";
import { normalizeKycLevel } from "@/lib/kyc";
import { TRUST_LEVELS, trustLevelForScore, type TrustBreakdown, type TrustCriterion } from "@/lib/trust-levels";

export { TRUST_LEVELS, trustLevelForScore };
export type { TrustBreakdown, TrustCriterion };

export async function computeAssociationTrust(associationId: string): Promise<TrustBreakdown> {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    include: {
      documents: { select: { id: true, type: true } },
      accounts: { select: { id: true } },
      activities: { where: { status: { not: "ARCHIVED" } }, select: { id: true } },
      meetings: { orderBy: { scheduledAt: "desc" }, take: 8, select: { scheduledAt: true, status: true } },
      regulations: { select: { id: true } },
      memberships: {
        where: { status: "ACTIVE" },
        select: { reliabilityScore: true, user: { select: { kycLevel: true, quarantinedAt: true } } },
      },
      arpProfile: { select: { status: true } },
    },
  });

  if (!association) throw new Error("Association introuvable");

  const activeMembers = association.memberships;
  const memberCount = activeMembers.length;
  const avgReliability = memberCount
    ? activeMembers.reduce((sum, m) => sum + (m.reliabilityScore ?? 0), 0) / memberCount
    : 0;
  const avgKyc = memberCount
    ? activeMembers.reduce((sum, m) => sum + normalizeKycLevel(m.user.kycLevel), 0) / memberCount
    : 0;
  const quarantinedMembers = activeMembers.filter((m) => m.user.quarantinedAt).length;
  const recentMeetings = association.meetings.filter((meeting) => {
    const age = Date.now() - new Date(meeting.scheduledAt).getTime();
    return age >= 0 && age <= 90 * 24 * 60 * 60 * 1000;
  }).length;

  const criteria: TrustCriterion[] = [
    {
      key: "fiche",
      label: "Qualité de la fiche association",
      max: 10,
      score: Math.min(10, [association.description, association.website, association.email, association.phone, association.logo]
        .filter(Boolean).length * 2),
      detail: "Identité, contacts, présentation et logo renseignés.",
    },
    {
      key: "reglement",
      label: "Statuts et règlement intérieur",
      max: 15,
      score: association.regulations.length > 0 ? 15 : 0,
      detail: association.regulations.length > 0 ? `${association.regulations.length} article(s) publiés.` : "Aucun règlement intérieur publié.",
    },
    {
      key: "preuves",
      label: "Documents et autorisations",
      max: 10,
      score: Math.min(10, association.documents.length * 2),
      detail: `${association.documents.length} document(s) au dossier.`,
    },
    {
      key: "activite",
      label: "Niveau d'activité",
      max: 15,
      score: association.activities.length > 0 ? 10 + Math.min(5, association.activities.length) : 0,
      detail: `${association.activities.length} activité(s) configurée(s).`,
    },
    {
      key: "membres",
      label: "Membres actifs",
      max: 15,
      score: memberCount >= 10 ? 15 : memberCount >= 5 ? 10 : memberCount >= 2 ? 5 : memberCount === 1 ? 2 : 0,
      detail: `${memberCount} membre(s) actif(s).`,
    },
    {
      key: "reunions",
      label: "Régularité des réunions",
      max: 10,
      score: recentMeetings > 0 ? 10 : 0,
      detail: recentMeetings > 0 ? `${recentMeetings} réunion(s) sur 90 jours.` : "Aucune réunion récente.",
    },
    {
      key: "fiscal",
      label: "Conformité financière",
      max: 10,
      score: association.accounts.length > 0 ? 10 : 0,
      detail: association.accounts.length > 0 ? "Compte bancaire ou mobile money déclaré." : "Aucun compte financier déclaré.",
    },
    {
      key: "notation",
      label: "Notation et fiabilité des membres",
      max: 10,
      score: avgReliability > 0 ? Math.round(Math.min(10, avgReliability / 10)) : 0,
      detail: `Fiabilité moyenne : ${Math.round(avgReliability)} %.`,
    },
    {
      key: "kyc",
      label: "Couverture KYC / LBC-FT",
      max: 10,
      score: memberCount > 0 ? Math.round(Math.min(10, avgKyc * 3.4)) : 0,
      detail: `Niveau KYC moyen : ${avgKyc.toFixed(1)}.`,
    },
    {
      key: "signalements",
      label: "Absence de signalement",
      max: 5,
      score: quarantinedMembers === 0 ? 5 : 0,
      detail: quarantinedMembers === 0 ? "Aucun membre en quarantaine." : `${quarantinedMembers} membre(s) en quarantaine.`,
    },
  ];

  const score = Math.max(0, Math.min(100, criteria.reduce((sum, item) => sum + item.score, 0)));
  const level = trustLevelForScore(score);

  const breakdown: TrustBreakdown = {
    score,
    level: level.level,
    label: level.label,
    criteria,
    computedAt: new Date().toISOString(),
  };

  await prisma.association.update({
    where: { id: associationId },
    data: {
      trustScore: score,
      trustLevel: level.level,
      trustBreakdown: JSON.stringify(breakdown),
      trustComputedAt: new Date(),
    },
  });

  return breakdown;
}

export async function computeAllAssociationTrust() {
  const associations = await prisma.association.findMany({ select: { id: true } });
  const results = [];
  for (const association of associations) {
    results.push(await computeAssociationTrust(association.id));
  }
  return results;
}

export async function refreshTrustForUser(userId: string) {
  const memberships = await prisma.associationMembership.findMany({
    where: { userId, status: { not: "LEFT" } },
    select: { associationId: true },
  });
  for (const membership of memberships) {
    await computeAssociationTrust(membership.associationId);
  }
}
