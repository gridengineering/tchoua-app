import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAppToken } from "@/lib/apps/token";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : new URL(req.url).searchParams.get("token");
  const payload = verifyAppToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Jeton d'application invalide ou expiré." }, { status: 401, headers: CORS });
  }

  const [user, association, app] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, language: true, avatar: true, kycLevel: true },
    }),
    payload.associationId
      ? prisma.association.findUnique({
          where: { id: payload.associationId },
          select: { id: true, name: true, logo: true, type: true },
        })
      : null,
    prisma.platformApp.findUnique({
      where: { id: payload.appId },
      select: { id: true, slug: true, name: true, scope: true, version: true },
    }),
  ]);

  if (!user || !app) {
    return NextResponse.json({ error: "Contexte introuvable." }, { status: 404, headers: CORS });
  }

  return NextResponse.json({
    context: {
      user,
      association,
      app,
      scope: payload.scope,
      installationId: payload.installationId,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    },
  }, { headers: CORS });
}
