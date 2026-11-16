import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONSENT_KEYS, CONSENT_VERSION } from "@/lib/consents";

type StepStatus = "DONE" | "CURRENT" | "UPCOMING" | "BLOCKED";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      kycLevel: true,
      kycStatus: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      whatsappVerifiedAt: true,
      assocMemberships: {
        include: {
          association: { select: { id: true, name: true, status: true } },
          activitySubs: { where: { status: "ACTIVE" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const consents = await prisma.platformConsent.findMany({
    where: { userId: user.id, version: CONSENT_VERSION, document: { in: [...CONSENT_KEYS] } },
    select: { document: true },
  });
  const acceptedConsents = new Set(consents.map((c) => c.document)).size;

  const activeMemberships = user.assocMemberships.filter((m) => m.status === "ACTIVE");
  const pendingMemberships = user.assocMemberships.filter((m) => m.status === "PENDING");
  const current = activeMemberships[0] ?? pendingMemberships[0] ?? null;
  const activeSubs = activeMemberships.reduce((sum, m) => sum + m.activitySubs.length, 0);
  const nextMeeting = current && current.status === "ACTIVE"
    ? await prisma.assocMeeting.findFirst({
        where: { associationId: current.associationId, status: "PLANNED", scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        select: { id: true, scheduledAt: true, title: true, associationId: true },
      })
    : null;

  const accountVerified = Boolean(user.emailVerifiedAt || user.phoneVerifiedAt || user.whatsappVerifiedAt);
  const kycDone = user.kycLevel >= 1;
  const consentsDone = acceptedConsents >= CONSENT_KEYS.length;

  const steps: {
    key: string;
    title: string;
    description: string;
    status: StepStatus;
    href: string;
    action: string;
    meta?: string;
  }[] = [
    {
      key: "account",
      title: "1. Compte et identité",
      description: "Votre compte est créé. Vérifiez votre e-mail ou votre téléphone pour sécuriser votre identité.",
      status: accountVerified ? "DONE" : "CURRENT",
      href: "/profil",
      action: accountVerified ? "Identité vérifiée" : "Vérifier mon e-mail / téléphone",
      meta: user.phone || user.email,
    },
    {
      key: "consents",
      title: "2. Termes et consentements",
      description: "Acceptez les CGU, la confidentialité, la protection des données et la non-divulgation.",
      status: consentsDone ? "DONE" : "CURRENT",
      href: "/consentements",
      action: consentsDone ? "Consentements à jour" : "Lire et accepter",
      meta: `${acceptedConsents}/${CONSENT_KEYS.length} documents acceptés`,
    },
    {
      key: "kyc",
      title: "3. Vérification KYC",
      description: "La vérification de votre identité conditionne l’accès aux opérations financières.",
      status: kycDone ? "DONE" : "CURRENT",
      href: "/kyc",
      action: kycDone ? `Niveau KYC ${user.kycLevel}` : "Commencer ma vérification",
      meta: user.kycStatus,
    },
    {
      key: "membership",
      title: "4. Rejoindre une association",
      description: "Choisissez une association, envoyez votre demande et faites valider votre adhésion par le bureau.",
      status: activeMemberships.length > 0 ? "DONE" : pendingMemberships.length > 0 ? "CURRENT" : "UPCOMING",
      href: "/associations",
      action: activeMemberships.length > 0 ? "Adhésion active" : pendingMemberships.length > 0 ? "Demande en attente" : "Choisir une association",
      meta: current ? current.association.name : undefined,
    },
    {
      key: "subscription",
      title: "5. Souscrire aux activités",
      description: "Choisissez vos parts de tontine, d’épargne, de solidarité et les autres activités de l’association.",
      status: activeSubs > 0 ? "DONE" : activeMemberships.length > 0 ? "CURRENT" : "UPCOMING",
      href: current ? `/associations/${current.associationId}` : "/associations",
      action: activeSubs > 0 ? `${activeSubs} activité(s) souscrite(s)` : "Choisir mes activités",
    },
    {
      key: "allocation",
      title: "6. Définir ma clé de répartition",
      description: "Indiquez comment votre versement unique se répartit entre les postes, et choisissez le mode de remboursement de prêt.",
      status: activeSubs > 0 ? "CURRENT" : "UPCOMING",
      href: current ? `/associations/${current.associationId}/my-profile` : "/associations",
      action: "Configurer ma clé",
    },
    {
      key: "session",
      title: "7. Participer à la session",
      description: "Présentez-vous à la réunion, effectuez votre versement et recevez le reçu de répartition.",
      status: nextMeeting ? "CURRENT" : "UPCOMING",
      href: current ? `/associations/${current.associationId}/reunions` : "/sessions",
      action: nextMeeting ? "Voir la prochaine session" : "Voir le calendrier",
      meta: nextMeeting ? new Date(nextMeeting.scheduledAt).toLocaleDateString("fr-FR") : undefined,
    },
  ];

  // Le parcours est séquentiel : une seule étape est « À faire » ; les
  // suivantes restent « À venir » tant que la précédente n'est pas terminée.
  const completed = [
    true, // le compte existe ; la vérification e-mail/téléphone est proposée mais non bloquante
    consentsDone,
    kycDone,
    activeMemberships.length > 0,
    activeSubs > 0,
    activeMemberships.some((m) => m.activitySubs.some((sub) => sub.allocationType !== "NONE")) ||
      activeMemberships.some((m) => m.loanRepaymentMode === "RESIDUAL"),
    Boolean(nextMeeting),
  ];
  const firstPending = completed.findIndex((value) => !value);
  steps.forEach((step, index) => {
    if (completed[index]) step.status = "DONE";
    else if (index === firstPending) step.status = "CURRENT";
    else step.status = index === 0 ? "CURRENT" : "UPCOMING";
  });

  const required = steps.slice(0, 4);
  const done = required.filter((s) => s.status === "DONE").length;
  const next = steps.find((s) => s.status === "CURRENT") ?? steps.find((s) => s.status === "UPCOMING") ?? steps[0];

  return NextResponse.json({
    progress: Math.round((done / required.length) * 100),
    steps,
    next,
    user: { name: user.name, email: user.email, phone: user.phone, kycLevel: user.kycLevel },
    currentAssociation: current ? { id: current.associationId, name: current.association.name, status: current.status } : null,
  });
}
