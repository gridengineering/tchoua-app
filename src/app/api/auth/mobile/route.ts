import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { encode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      level: true,
      score: true,
      avatar: true,
      theme: true,
      language: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { systemRole: { include: { permissions: true } } },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Configuration serveur NEXTAUTH_SECRET manquante." },
        { status: 500 }
      );
    }

    const token = await encode({
      secret,
      maxAge: 30 * 24 * 60 * 60,
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        score: user.score,
        avatar: user.avatar,
        systemRoleId: user.systemRoleId,
        systemRoleName: user.systemRole?.name ?? null,
      },
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        score: user.score,
        avatar: user.avatar,
        theme: user.theme,
        language: user.language,
      },
    });
  } catch (err) {
    console.error("[AUTH MOBILE] Error:", err);
    return NextResponse.json({ error: "Erreur d'authentification." }, { status: 500 });
  }
}
