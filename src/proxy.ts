import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Routes Admin : Nécessite un systemRoleId valide ─────────────────────
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Non authentifié → redirige vers login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("reason", "admin_required");
      return NextResponse.redirect(loginUrl);
    }

    // Authentifié mais sans rôle système → accès refusé
    if (!token.systemRoleId) {
      const forbiddenUrl = new URL("/403", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }

    // OK → on laisse passer avec un header pour identifier l'accès admin
    const response = NextResponse.next();
    response.headers.set("x-tchoua-user-role", String(token.systemRoleName ?? "unknown"));
    response.headers.set("x-tchoua-user-id", String(token.id ?? ""));
    return response;
  }

  // ─── API Admin : session + rôle système obligatoires ─────────────────────
  if (pathname.startsWith("/api/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!token.systemRoleId) {
      return NextResponse.json({ error: "Accès réservé aux utilisateurs système" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ─── Routes Protégées (Membre) ───────────────────────────────────────────
  const protectedPaths = [
    "/dashboard", "/association", "/tontines", "/membres", "/cotisations",
    "/sessions", "/prets", "/solidarite", "/rapports", "/profil", "/parametres",
    "/chat", "/epargne", "/marketplace", "/evenements", "/conseils",
  ];

  const isProtected = protectedPaths.some(p => pathname.startsWith(p));
  
  if (isProtected) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/association/:path*",
    "/tontines/:path*",
    "/membres/:path*",
    "/cotisations/:path*",
    "/sessions/:path*",
    "/prets/:path*",
    "/solidarite/:path*",
    "/rapports/:path*",
    "/profil/:path*",
    "/parametres/:path*",
    "/chat/:path*",
    "/epargne/:path*",
    "/marketplace/:path*",
    "/evenements/:path*",
    "/conseils/:path*",
  ],
};
