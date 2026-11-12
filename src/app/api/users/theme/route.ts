import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MEMBER_THEME, isMemberTheme } from "@/lib/member-themes";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { theme: true } });
  return NextResponse.json({ theme: isMemberTheme(user?.theme) ? user.theme : DEFAULT_MEMBER_THEME });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const theme = body?.theme;
  if (!isMemberTheme(theme)) return NextResponse.json({ error: "Thème invalide" }, { status: 400 });

  await prisma.user.update({ where: { id: session.user.id }, data: { theme } });
  return NextResponse.json({ ok: true, theme });
}
