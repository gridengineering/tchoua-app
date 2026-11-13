import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { arpActor } from "@/lib/arp/access";
import { arpErrorResponse } from "@/lib/arp/server";
import { consumeReservation, releaseReservation, serializeReservation } from "@/lib/arp/funds";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string; reservationId: string }> }
) {
  const { id, fundId, reservationId } = await params;
  const actor = await arpActor(id, "EDIT_SETTINGS");
  if (!actor.ok) return actor.response;

  const body = await req.json().catch(() => null);
  const action = (body as { action?: string; description?: string } | null)?.action;
  if (action !== "release" && action !== "consume") {
    return NextResponse.json(
      { error: "Action attendue : release ou consume." },
      { status: 400 }
    );
  }

  try {
    if (action === "release") {
      const reservation = await releaseReservation({
        associationId: id,
        fundId,
        reservationId,
        userId: actor.userId,
      });
      return NextResponse.json({ reservation: serializeReservation(reservation) });
    }
    const movement = await consumeReservation({
      associationId: id,
      fundId,
      reservationId,
      userId: actor.userId,
      description: (body as { description?: string } | null)?.description,
    });
    const reservation = await prisma.arpFundReservation.findUnique({
      where: { id: reservationId },
    });
    return NextResponse.json({
      reservation: reservation ? serializeReservation(reservation) : null,
      movementId: movement.id,
    });
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error("ARP reservation PATCH", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
