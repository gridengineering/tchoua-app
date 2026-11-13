import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function applyCorsHeaders(res: NextResponse, origin: string | null) {
  res.headers.set("Access-Control-Allow-Origin", origin || "*");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.headers.set("Vary", "Origin");
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  // ─── API CORS + Mobile Bearer Token forwarding ───────────────────────────
  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
    }

    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const requestHeaders = new Headers(request.headers);

    if (bearerToken) {
      const existingCookie = requestHeaders.get("cookie") ?? "";
      if (!existingCookie.includes("next-auth.session-token=")) {
        const injected = `next-auth.session-token=${bearerToken}; __Secure-next-auth.session-token=${bearerToken}`;
        requestHeaders.set("cookie", existingCookie ? `${existingCookie}; ${injected}` : injected);
      }
    }

    if (pathname.startsWith("/api/admin")) {
      const forwardedReq = new Request(request.url, { headers: requestHeaders });
      const token = await getToken({
        req: forwardedReq as unknown as NextRequest,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token) {
        return applyCorsHeaders(NextResponse.json({ error: "Non autorisé" }, { status: 401 }), origin);
      }
      if (!token.systemRoleId) {
        return applyCorsHeaders(
          NextResponse.json({ error: "Accès réservé aux utilisateurs système" }, { status: 403 }),
          origin
        );
      }
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return applyCorsHeaders(response, origin);
  }

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
    "/api/:path*",
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
