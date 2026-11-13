import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { arpActor } from "@/lib/arp/access";
import { arpErrorResponse } from "@/lib/arp/server";
import { parseMajorToMinor, postFundMovement, serializeMovement } from "@/lib/arp/funds";

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
  const { direction, amount, valueDate, description, sourceType, sourceId } = body as {
    direction?: string;
    amount?: string | number;
    valueDate?: string;
    description?: string;
    sourceType?: string;
    sourceId?: string | null;
  };
  if (direction !== "IN" && direction !== "OUT") {
    return NextResponse.json({ error: "Le sens doit être IN ou OUT." }, { status: 400 });
  }

  try {
    const amountMinor = parseMajorToMinor(amount, fund.currency);
    const date = valueDate ? new Date(valueDate) : new Date();
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Date valeur invalide." }, { status: 400 });
    }
    const movement = await postFundMovement({
      associationId: id,
      fundId,
      direction,
      amountMinor,
      valueDate: date,
      description: description ?? "",
      sourceType,
      sourceId,
      userId: actor.userId,
    });
    return NextResponse.json({ movement: serializeMovement(movement) }, { status: 201 });
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error("ARP movement POST", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
