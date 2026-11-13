import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { arpActor } from "@/lib/arp/access";
import { arpErrorResponse } from "@/lib/arp/server";
import { parseMajorToMinor, reserveFund, serializeReservation } from "@/lib/arp/funds";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  const { id, fundId } = await params;
  const actor = await arpActor(id, "EDIT_SETTINGS");
  if (!actor.ok) return actor.response;

  const fund = await prisma.arpFund.findFirst({ where: { id: fundId, associationId: id } });
  if (!fund) return NextResponse.json({ error: "Fonds introuvable" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const { amount, purpose, expiresAt } = body as {
    amount?: string | number;
    purpose?: string;
    expiresAt?: string | null;
  };

  try {
    const amountMinor = parseMajorToMinor(amount, fund.currency);
    const expiry = expiresAt ? new Date(expiresAt) : null;
    if (expiry && Number.isNaN(expiry.getTime())) {
      return NextResponse.json({ error: "Date d'expiration invalide." }, { status: 400 });
    }
    const reservation = await reserveFund({
      associationId: id,
      fundId,
      amountMinor,
      purpose: purpose ?? "",
      expiresAt: expiry,
      userId: actor.userId,
    });
    return NextResponse.json({ reservation: serializeReservation(reservation) }, { status: 201 });
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error("ARP reservation POST", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
