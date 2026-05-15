import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const bureauMembers = await prisma.associationMembership.findMany({
    where: {
      associationId: id,
      status: "ACTIVE",
      role: { in: ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "CENSOR", "ADVISOR"] }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  });

  return NextResponse.json({ bureau: bureauMembers });
}
