import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { verifyEmailConfiguration } from "@/lib/mailer";
import type { EmailConfig } from "@/lib/governance-types";

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;
  const body = await req.json().catch(() => ({}));
  const email = body?.email as EmailConfig | undefined;
  if (!email || typeof email !== "object" || !email.smtp || !email.imap || !email.pop3) {
    return NextResponse.json({ error: "Configuration de messagerie incomplète" }, { status: 400 });
  }
  const checks = await verifyEmailConfiguration(email);
  const enabled = [email.smtp, email.imap, email.pop3].filter((x) => x.enabled);
  const results = [checks.smtp, checks.imap, checks.pop3].filter((x, i) => [email.smtp, email.imap, email.pop3][i].enabled);
  const ok = enabled.length > 0 && results.every((x) => x.ok);
  return NextResponse.json({
    ok,
    checks,
    message: ok
      ? "Configuration vérifiée : connexion et authentification réussies."
      : "Une ou plusieurs connexions ont échoué. Vérifiez l'hôte, le port, le chiffrement et les identifiants.",
  }, { status: ok ? 200 : 400 });
}
