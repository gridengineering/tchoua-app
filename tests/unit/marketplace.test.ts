import { isMarketplaceType, parseImages, normalizeListing } from "@/lib/marketplace";

describe("marketplace helpers", () => {
  it("accepte les cinq types d'annonces", () => {
    for (const type of ["VENTE", "PUBLICATION", "RECRUTEMENT", "EVENEMENT", "PARTENARIAT"]) {
      expect(isMarketplaceType(type)).toBe(true);
    }
    expect(isMarketplaceType("AUTRE")).toBe(false);
  });

  it("normalise les images JSON, les tableaux et les chaînes", () => {
    expect(parseImages(JSON.stringify(["/a.jpg", "/b.jpg"]))).toEqual(["/a.jpg", "/b.jpg"]);
    expect(parseImages(["/c.jpg"])).toEqual(["/c.jpg"]);
    expect(parseImages("/d.jpg,/e.jpg")).toEqual(["/d.jpg", "/e.jpg"]);
    expect(parseImages(null)).toEqual([]);
  });

  it("normalise une annonce pour l'API", () => {
    const listing = normalizeListing({
      id: "l1",
      title: "Test",
      images: JSON.stringify(["/photo.jpg"]),
      price: null,
      seller: { id: "u1", name: null },
    });
    expect(listing.images).toEqual(["/photo.jpg"]);
    expect(listing.price).toBeNull();
    expect(listing.seller.name).toBe("Membre");
  });
});
