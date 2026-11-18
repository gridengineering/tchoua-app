export const MARKETPLACE_TYPES = [
  "VENTE",
  "PUBLICATION",
  "RECRUTEMENT",
  "EVENEMENT",
  "PARTENARIAT",
] as const;

export type MarketplaceType = (typeof MARKETPLACE_TYPES)[number];

export const MARKETPLACE_TYPE_LABELS: Record<MarketplaceType, string> = {
  VENTE: "Vente",
  PUBLICATION: "Publication",
  RECRUTEMENT: "Recrutement",
  EVENEMENT: "Événement",
  PARTENARIAT: "Partenariat",
};

export const MARKETPLACE_TYPE_DESCRIPTIONS: Record<MarketplaceType, string> = {
  VENTE: "Vendre un bien, un produit ou un service",
  PUBLICATION: "Publier une information, une offre ou un contenu",
  RECRUTEMENT: "Recruter un talent ou proposer une mission",
  EVENEMENT: "Annoncer une rencontre, une formation ou une cérémonie",
  PARTENARIAT: "Proposer ou rechercher un partenariat",
};

export const DEFAULT_CATEGORIES = [
  "Agriculture",
  "Artisanat",
  "Services",
  "Électronique",
  "Vêtements",
  "Alimentation",
  "Immobilier",
  "Transport",
  "Formation",
  "Emploi",
  "Événement",
  "Partenariat",
  "Autres",
];

export const DEFAULT_RUBRIQUES = [
  "Offre",
  "Demande",
  "Vente",
  "Achat",
  "Location",
  "Stage",
  "Mission",
  "Prestation",
  "Annonce",
  "Appel à candidatures",
];

export const MARKETPLACE_SORTS = [
  { value: "recent", label: "Plus récentes" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "deadline", label: "Échéance proche" },
] as const;

export function isMarketplaceType(value: unknown): value is MarketplaceType {
  return typeof value === "string" && (MARKETPLACE_TYPES as readonly string[]).includes(value);
}

export function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string").slice(0, 8);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string").slice(0, 8);
    return [raw];
  } catch {
    return raw.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
  }
}

/** Périmètre de visibilité : les annonces des associations du membre et de son réseau. */
export function marketplaceVisibilityWhere(associationIds: string[], userId: string) {
  const or: any[] = [{ sellerId: userId }];
  if (associationIds.length > 0) {
    or.push(
      { associationId: { in: associationIds } },
      { tontineId: { in: associationIds } },
      {
        seller: {
          assocMemberships: {
            some: {
              associationId: { in: associationIds },
              status: { in: ["ACTIVE", "PENDING"] },
            },
          },
        },
      }
    );
  }
  return { OR: or };
}

export function normalizeListing(listing: any) {
  if (!listing) return null;
  return {
    ...listing,
    images: parseImages(listing.images),
    price: listing.price ?? null,
    deadline: listing.deadline ?? null,
    seller: listing.seller
      ? { ...listing.seller, name: listing.seller.name ?? "Membre" }
      : null,
  };
}

export function normalizeMarketplaceAssociation(association: any) {
  return association ? { id: association.id, name: association.name, logo: association.logo ?? null } : null;
}
