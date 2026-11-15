import { NextRequest, NextResponse } from "next/server";
import { requireSystemAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getGovernanceConfig, saveGovernanceConfig } from "@/lib/governance";
import { DEFAULT_GOVERNANCE_CONFIG } from "@/lib/governance-types";

export async function GET() {
  const guard = await requireSystemAdmin("SETTINGS", "READ");
  if (!guard.ok) return guard.response;
  const config = await getGovernanceConfig();
  return NextResponse.json({ config, defaults: DEFAULT_GOVERNANCE_CONFIG });
}

export async function PUT(req: NextRequest) {
  const guard = await requireSystemAdmin("SETTINGS", "UPDATE");
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const patch = body?.config && typeof body.config === "object" ? body.config : body;
  if (!patch || typeof patch !== "object") {
    return NextResponse.json({ error: "Configuration invalide" }, { status: 400 });
  }

  const config = await saveGovernanceConfig(patch, guard.user.id);
  await prisma.auditLog.create({
    data: {
      userId: guard.user.id,
      action: "GOVERNANCE_UPDATE",
      entity: "GOVERNANCE",
      details: `Mise à jour gouvernance : ${Object.keys(patch).join(", ")}`,
    },
  }).catch(() => {});

  return NextResponse.json({ config });
}
