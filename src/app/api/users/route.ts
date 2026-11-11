import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
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

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
    }

    let referredById: string | undefined;
    if (data.referralCode) {
      const referrer = await prisma.user.findFirst({ where: { referralCode: data.referralCode } });
      if (referrer) referredById = referrer.id;
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashed,
        profession: data.profession,
        location: data.location,
        referredById,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // Give welcome scoring points
    await prisma.scoringRecord.create({
      data: {
        userId: user.id,
        points: 10,
        reason: "Inscription sur la plateforme",
        category: "COMPLIANCE_ETHICS",
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
