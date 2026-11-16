import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isPlatformAdmin } from "@/lib/permissions";
import {
  type FreeMemberInput,
  inviteOrAttachMember,
  parseMembersImportPayload,
} from "@/lib/association/member-invite";

const BUREAU_ROLES = [
  "PRESIDENT",
  "FOUNDER",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ADJ",
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: associationId } = await params;
  const actor = await prisma.associationMembership.findFirst({
    where: { userId: session.user.id, associationId, status: "ACTIVE" },
    include: { customRole: true },
  });

  const allowed =
    isPlatformAdmin(session) ||
    (actor && (BUREAU_ROLES.includes(actor.role) || hasPermission(session, actor, "MANAGE_MEMBERS")));
  if (!allowed) {
    return NextResponse.json(
      { error: "Seuls les membres du bureau ou le fondateur peuvent importer des membres." },
      { status: 403 }
    );
  }

  let items: FreeMemberInput[] = [];
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (file && typeof file !== "string") {
      const text = await file.text();
      items = parseMembersImportPayload(text, file.name);
    }
  } else {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.members)) {
      items = body.members;
    } else if (typeof body.content === "string") {
      items = parseMembersImportPayload(body.content, body.fileName || "");
    }
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Aucun membre valide détecté (email ou mobile requis par ligne)." },
      { status: 400 }
    );
  }

  const results: Array<{
    input: FreeMemberInput;
    status: string;
    emailSent?: boolean;
    whatsappUrl?: string | null;
    error?: string;
  }> = [];

  for (const item of items.slice(0, 200)) {
    try {
      const res = await inviteOrAttachMember(prisma, {
        associationId,
        actorUserId: session.user.id,
        input: item,
        baseUrl: req.nextUrl.origin || "https://www.tchoua.com",
      });
      results.push({
        input: item,
        status: res.status,
        emailSent: res.emailSent,
        whatsappUrl: res.whatsappUrl,
      });
    } catch (err: any) {
      results.push({
        input: item,
        status: "ERROR",
        error: err?.message || "Erreur",
      });
    }
  }

  return NextResponse.json({
    totalProcessed: results.length,
    invited: results.filter((r) => r.status !== "ERROR" && r.status !== "ALREADY_MEMBER").length,
    alreadyMembers: results.filter((r) => r.status === "ALREADY_MEMBER").length,
    errors: results.filter((r) => r.status === "ERROR").length,
    results,
  });
}
