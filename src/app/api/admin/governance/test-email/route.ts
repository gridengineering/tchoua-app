import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { sendTransactionalEmail, verifyMailConfiguration } from "@/lib/mailer";
import type { EmailConfig } from "@/lib/governance-types";

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;
  const body = await req.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!to) return NextResponse.json({ error: "Adresse destinataire requise" }, { status: 400 });
  const email = body?.email as EmailConfig | undefined;
  if (email && (!email.smtp || !email.imap || !email.pop3)) {
    return NextResponse.json({ error: "Configuration de messagerie incomplète" }, { status: 400 });
  }

  const verified = await verifyMailConfiguration(email);
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 });
  const sent = await sendTransactionalEmail({
    to,
    subject: "Test de la messagerie Tchoua",
    text: "La configuration SMTP de Tchoua fonctionne. Cet e-mail est un test administratif.",
    html: "<p>La configuration SMTP de <strong>Tchoua</strong> fonctionne.</p><p>Cet e-mail est un test administratif.</p>",
  }, email);
  return NextResponse.json({ ok: sent, message: sent ? "E-mail de test envoyé" : "Échec de l'envoi SMTP" }, { status: sent ? 200 : 502 });
}
