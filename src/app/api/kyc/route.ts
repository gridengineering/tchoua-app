import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KYC_LEVELS, normalizeKycLevel } from "@/lib/kyc";
import { CONSENT_KEYS, CONSENT_VERSION } from "@/lib/consents";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [user, latestRequest, consents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, phone: true, profession: true, location: true,
        kycLevel: true, kycStatus: true, kycVerifiedAt: true, kycData: true,
        emailVerifiedAt: true, phoneVerifiedAt: true, whatsappVerifiedAt: true,
        quarantinedAt: true,
      },
    }),
    prisma.kycRequest.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        documents: {
          select: { id: true, type: true, label: true, mimeType: true, size: true, status: true, createdAt: true },
        },
      },
    }),
    prisma.platformConsent.findMany({
      where: { userId: session.user.id, version: CONSENT_VERSION },
      select: { document: true, acceptedAt: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  return NextResponse.json({
    level: normalizeKycLevel(user.kycLevel),
    status: user.kycStatus,
    verifiedAt: user.kycVerifiedAt,
    verification: {
      email: Boolean(user.emailVerifiedAt),
      phone: Boolean(user.phoneVerifiedAt),
      whatsapp: Boolean(user.whatsappVerifiedAt),
    },
    profile: (() => {
      if (!user.kycData) return null;
      try { return JSON.parse(user.kycData); } catch { return null; }
    })(),
    user,
    latestRequest,
    levels: KYC_LEVELS,
    platformConsentsComplete: CONSENT_KEYS.every((key) =>
      consents.some((c) => c.document === key)
    ),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const requestedLevel = Number(body.requestedLevel);

  if (![1, 2, 3].includes(requestedLevel)) {
    return NextResponse.json({ error: "Niveau KYC invalide" }, { status: 400 });
  }

  const [user, pending, consents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, phone: true, kycLevel: true, kycStatus: true,
        emailVerifiedAt: true, phoneVerifiedAt: true, whatsappVerifiedAt: true,
      },
    }),
    prisma.kycRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
    }),
    prisma.platformConsent.findMany({
      where: { userId: session.user.id, version: CONSENT_VERSION },
      select: { document: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (pending) {
    return NextResponse.json(
      { error: "Une demande KYC est déjà en cours de vérification", code: "KYC_ALREADY_PENDING" },
      { status: 409 }
    );
  }

  const allConsents = CONSENT_KEYS.every((key) => consents.some((c) => c.document === key));
  if (!allConsents) {
    return NextResponse.json(
      { error: "Acceptez d'abord les conditions et politiques de la plateforme", code: "CONSENT_REQUIRED" },
      { status: 403 }
    );
  }

  const current = normalizeKycLevel(user.kycLevel);
  if (requestedLevel <= current) {
    return NextResponse.json({ error: "Ce niveau est déjà acquis" }, { status: 400 });
  }

  if (!user.emailVerifiedAt && !user.phoneVerifiedAt && !user.whatsappVerifiedAt) {
    return NextResponse.json(
      {
        error: "Vérifiez d'abord votre e-mail, votre téléphone ou votre WhatsApp avec un code à 6 chiffres.",
        code: "VERIFICATION_REQUIRED",
      },
      { status: 403 }
    );
  }

  const fullName = String(body.fullName ?? user.name ?? "").trim();
  const phone = String(body.phone ?? user.phone ?? "").trim();
  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "Cameroun").trim();

  if (fullName.length < 3) {
    return NextResponse.json({ error: "Le nom légal complet est requis" }, { status: 400 });
  }
  if (requestedLevel === 1 && !phone) {
    return NextResponse.json({ error: "Un numéro de téléphone est requis" }, { status: 400 });
  }

  if (requestedLevel >= 2) {
    const idType = String(body.idType ?? "").trim();
    const idNumber = String(body.idNumber ?? "").trim();
    const address = String(body.address ?? "").trim();
    if (!idType || !idNumber || !address) {
      return NextResponse.json(
        { error: "Type de pièce, numéro de pièce et adresse sont requis pour ce niveau" },
        { status: 400 }
      );
    }
  }

  if (requestedLevel === 3 && !String(body.sourceOfFunds ?? "").trim()) {
    return NextResponse.json({ error: "L'origine des fonds est requise pour la vigilance renforcée" }, { status: 400 });
  }

  const data = {
    fullName,
    dateOfBirth: body.dateOfBirth ? String(body.dateOfBirth) : null,
    nationality: body.nationality ? String(body.nationality) : "Camerounaise",
    idType: body.idType ? String(body.idType) : null,
    idNumber: body.idNumber ? String(body.idNumber) : null,
    address: body.address ? String(body.address) : null,
    city: city || null,
    country,
    occupation: body.occupation ? String(body.occupation) : null,
    sourceOfFunds: body.sourceOfFunds ? String(body.sourceOfFunds) : null,
    documentRef: body.documentRef ? String(body.documentRef) : null,
  };

  const documentIds: string[] = Array.isArray(body.documentIds)
    ? body.documentIds.map(String).filter(Boolean)
    : [];
  const documents = documentIds.length > 0
    ? await prisma.kycDocument.findMany({ where: { id: { in: documentIds }, userId: user.id } })
    : [];

  if (requestedLevel >= 2) {
    const types = new Set(documents.map((doc) => doc.type));
    if (!types.has("ID_DOCUMENT") && !types.has("PASSPORT_PHOTO")) {
      return NextResponse.json(
        { error: "Ajoutez une pièce d'identité (CNI, passeport ou titre de séjour) avant de demander ce niveau.", code: "DOCUMENTS_REQUIRED" },
        { status: 400 }
      );
    }
    if (!types.has("PASSPORT_PHOTO")) {
      return NextResponse.json(
        { error: "Ajoutez une photo récente de type passeport pour vérifier votre identité.", code: "DOCUMENTS_REQUIRED" },
        { status: 400 }
      );
    }
    if (requestedLevel === 3 && !types.has("LOCATION_PROOF") && !types.has("UTILITY_BILL") && !types.has("GOOGLE_MAPS")) {
      return NextResponse.json(
        { error: "Ajoutez une preuve de localisation (plan, facture ou lien Google Maps) pour la vigilance renforcée.", code: "DOCUMENTS_REQUIRED" },
        { status: 400 }
      );
    }
  }

  const now = new Date();

  if (requestedLevel === 1) {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.kycRequest.create({
        data: {
          userId: user.id,
          requestedLevel: 1,
          status: "APPROVED",
          ...data,
          reviewedById: user.id,
          reviewedAt: now,
          reviewNote: "Vérification automatique des informations de base",
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          kycLevel: 1,
          kycStatus: "VERIFIED",
          kycVerifiedAt: now,
          kycData: JSON.stringify({ level: 1, ...data, verifiedAt: now.toISOString() }),
        },
      });
      return request;
    });
    return NextResponse.json({ request: result, level: 1, status: "VERIFIED", autoApproved: true }, { status: 201 });
  }

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.kycRequest.create({
      data: { userId: user.id, requestedLevel, status: "PENDING", ...data },
    });
    await tx.user.update({ where: { id: user.id }, data: { kycStatus: "PENDING" } });
    return created;
  });

  return NextResponse.json(
    {
      request,
      level: current,
      status: "PENDING",
      message: "Votre demande a été transmise au bureau pour vérification.",
    },
    { status: 201 }
  );
}
