import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { sendTransactionalEmail, verifyMailConfiguration } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;
  const body = await req.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!to) return NextResponse.json({ error: "Adresse destinataire requise" }, { status: 400 });

  const verified = await verifyMailConfiguration();
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 });
  const sent = await sendTransactionalEmail({
    to,
    subject: "Test de la messagerie Tchoua",
    text: "La configuration SMTP de Tchoua fonctionne. Cet e-mail est un test administratif.",
  });
  return NextResponse.json({ ok: sent, message: sent ? "E-mail de test envoyé" : "Échec de l'envoi SMTP" }, { status: sent ? 200 : 502 });
}
