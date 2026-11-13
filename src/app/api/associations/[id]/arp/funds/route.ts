import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { arpActor } from "@/lib/arp/access";
import { ArpError, arpErrorResponse, ensureArpProfile } from "@/lib/arp/server";
import { createFund, serializeFund } from "@/lib/arp/funds";
import type { ArpFundPayload } from "@/lib/arp/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await arpActor(id);
  if (!actor.ok) return actor.response;

  const funds = await prisma.arpFund.findMany({
    where: { associationId: id },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  const payload = await Promise.all(funds.map((fund) => serializeFund(fund, true)));
  return NextResponse.json({ funds: payload });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await arpActor(id, "EDIT_SETTINGS");
  if (!actor.ok) return actor.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const { code, name, type, currency, activityId } = body as {
    code?: string;
    name?: string;
    type?: string;
    currency?: string;
    activityId?: string | null;
  };

  try {
    const profile = await ensureArpProfile(id);
    const config = profile.config as { identity?: { currency?: string } };
    const fund = await createFund({
      associationId: id,
      code: code ?? "",
      name: name ?? "",
      type: (type as ArpFundPayload["type"]) ?? "LIBRE",
      currency: (currency ?? config.identity?.currency ?? "XAF").toUpperCase(),
      activityId: activityId ?? null,
      userId: actor.userId,
    });
    return NextResponse.json({ fund: await serializeFund(fund, true) }, { status: 201 });
  } catch (error) {
    const mapped = arpErrorResponse(error);
    if (mapped) return NextResponse.json(mapped.body, { status: mapped.status });
    console.error("ARP fund POST", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
