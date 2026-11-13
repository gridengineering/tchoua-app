import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { arpActor } from "@/lib/arp/access";
import { ArpError, arpErrorResponse } from "@/lib/arp/server";
import { serializeFund } from "@/lib/arp/funds";

async function fundInScope(associationId: string, fundId: string) {
  return prisma.arpFund.findFirst({
    where: { id: fundId, associationId },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  const { id, fundId } = await params;
  const actor = await arpActor(id);
  if (!actor.ok) return actor.response;
  const fund = await fundInScope(id, fundId);
  if (!fund) return NextResponse.json({ error: "Fonds introuvable" }, { status: 404 });
  return NextResponse.json({ fund: await serializeFund(fund, true) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  const { id, fundId } = await params;
  const actor = await arpActor(id, "EDIT_SETTINGS");
  if (!actor.ok) return actor.response;
  const fund = await fundInScope(id, fundId);
  if (!fund) return NextResponse.json({ error: "Fonds introuvable" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const { name, status, type } = body as { name?: string; status?: string; type?: string };
  if (status && !["ACTIVE", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "Statut de fonds invalide" }, { status: 400 });
  }
  if (status === "CLOSED") {
    const activeReservations = await prisma.arpFundReservation.count({
      where: { fundId, status: "ACTIVE" },
    });
    if (activeReservations > 0) {
      return NextResponse.json(
        { error: "Libérez les réservations actives avant de clôturer le fonds." },
        { status: 409 }
      );
    }
  }

  try {
    const updated = await prisma.arpFund.update({
      where: { id: fundId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(status !== undefined && { status }),
        ...(type !== undefined && { type }),
      },
    });
    return NextResponse.json({ fund: await serializeFund(updated, true) });
  } catch (error) {
    if (error instanceof ArpError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("ARP fund PATCH", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
