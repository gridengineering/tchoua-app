import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ARP_CONDITIONS, ARP_CATALOGUE_SIZE, ARP_DIMENSIONS } from "@/lib/arp/catalogue";
import { ARP_DOMAINS, ARP_DOMAIN_STATS, ARP_REFERENTIAL_SOURCE } from "@/lib/arp/domains";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({
    source: ARP_REFERENTIAL_SOURCE,
    stats: ARP_DOMAIN_STATS,
    dimensions: ARP_DIMENSIONS,
    conditions: Object.values(ARP_CONDITIONS),
    catalogueSize: ARP_CATALOGUE_SIZE,
    domains: ARP_DOMAINS,
  });
}
