import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  countryByCode,
  normalizePhone,
  phoneLookupValues,
  normalizeLanguage,
} from "@/lib/identity";
import { sendEmailVerification } from "@/lib/email-verification";

const registerSchema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)"),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().min(1, "Le pays est obligatoire"),
  city: z.string().min(1, "La ville est obligatoire"),
  language: z.string().min(2).default("fr"),
  password: z.string().min(6, "Mot de passe min 6 caractères"),
  profession: z.string().optional(),
  location: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const platform = await getPlatformSettings();
    if (platform.maintenanceMode) {
      return NextResponse.json({ error: platform.maintenanceMessage }, { status: 503 });
    }
    if (!platform.allowRegistration) {
      return NextResponse.json({ error: "Les inscriptions sont temporairement fermées." }, { status: 403 });
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    const email = data.email?.trim().toLowerCase() || undefined;
    const country = countryByCode(data.country);
    const phone = data.phone ? normalizePhone(data.phone, country.dial) : undefined;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Renseignez une adresse e-mail ou un numéro de téléphone." },
        { status: 400 }
      );
    }
    if (data.phone && !phone) {
      return NextResponse.json(
        { error: "Numéro de téléphone invalide. Utilisez l’indicatif pays, par exemple 237677112255." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone: { in: phoneLookupValues(phone) } }] : []),
        ],
      },
      select: { email: true, phone: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? "Email déjà utilisé" : "Téléphone déjà utilisé" },
        { status: 409 }
      );
    }

    let referredById: string | undefined;
    if (data.referralCode) {
      const referrer = await prisma.user.findFirst({ where: { referralCode: data.referralCode } });
      if (referrer) referredById = referrer.id;
    }

    const language = normalizeLanguage(data.language);
    const userEmail = email || `phone-${phone}@phone.tchoua.local`;
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: userEmail,
        phone: phone || null,
        country: country.name,
        city: data.city.trim(),
        location: data.location?.trim() || `${data.city.trim()}, ${country.name}`,
        language,
        password: hashed,
        profession: data.profession,
        referredById,
      },
      select: { id: true, name: true, email: true, phone: true, country: true, city: true, language: true, createdAt: true },
    });

    // Un seul wallet par membre, créé dès l'inscription.
    await prisma.wallet.create({ data: { userId: user.id, balance: 0, currency: "XAF", status: "ACTIVE" } }).catch(() => {});

    await prisma.scoringRecord.create({
      data: {
        userId: user.id,
        points: 10,
        reason: "Inscription sur la plateforme",
        category: "COMPLIANCE_ETHICS",
      },
    });

    let emailVerificationSent = false;
    let emailVerificationError: string | undefined;
    if (email) {
      try {
        const result = await sendEmailVerification({
          userId: user.id,
          email,
          name: user.name,
          language,
          baseUrl: req.nextUrl.origin || "https://www.tchoua.com",
        });
        emailVerificationSent = result.ok && result.delivered;
        if (!result.ok) emailVerificationError = result.error;
      } catch (error) {
        console.error("[REGISTER][EMAIL_VERIFY]", error);
        emailVerificationError = "L’e-mail de confirmation n’a pas pu être envoyé.";
      }
    }

    return NextResponse.json(
      {
        user,
        requiresConsent: true,
        emailVerificationSent,
        ...(emailVerificationError ? { emailVerificationError } : {}),
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    if ((err as any)?.code === "P2002") {
      return NextResponse.json({ error: "Email ou téléphone déjà utilisé" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
