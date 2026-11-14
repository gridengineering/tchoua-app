import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSystemAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const guard = await requireSystemAdmin("USERS", "READ");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const kycLevel = searchParams.get("kycLevel");
  const status = searchParams.get("status");
  const associationId = searchParams.get("associationId");

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (kycLevel !== null && kycLevel !== "") where.kycLevel = Number(kycLevel);
  if (status === "PENDING") where.kycStatus = "PENDING";
  if (status === "VERIFIED") where.kycStatus = "VERIFIED";
  if (status === "NONE") where.kycStatus = "NONE";
  if (status === "REJECTED") where.kycStatus = "REJECTED";
  if (status === "QUARANTINED") where.quarantinedAt = { not: null };
  if (associationId) {
    where.assocMemberships = { some: { associationId, status: { not: "LEFT" } } };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      kycLevel: true,
      kycStatus: true,
      kycVerifiedAt: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      whatsappVerifiedAt: true,
      quarantinedAt: true,
      quarantineReason: true,
      createdAt: true,
      assocMemberships: {
        where: { status: { not: "LEFT" } },
        select: {
          id: true,
          role: true,
          status: true,
          association: { select: { id: true, name: true, trustLevel: true } },
        },
      },
      kycRequests: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          requestedLevel: true,
          status: true,
          createdAt: true,
          fullName: true,
          idType: true,
          idNumber: true,
          address: true,
          city: true,
          sourceOfFunds: true,
          documentRef: true,
          documents: {
            select: { id: true, type: true, label: true, mimeType: true, size: true, status: true },
          },
        },
      },
    },
    orderBy: [{ kycLevel: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  return NextResponse.json({ users, total: users.length });
}
