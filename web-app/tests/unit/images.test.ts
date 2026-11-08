import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cityImageUrl, destinationImageUrl } from "@/lib/images";
import { productCreateSchema, productUpdateSchema } from "@/lib/validation/products";
import { HOTELS, PRODUCTS, SAILINGS, SHIPS, hotelImageUrl, productImageUrl, shipImageUrl } from "../../scripts/seed-data";

const publicFile = (url: string) => path.join(import.meta.dirname, "../../public", url);

describe("seeded photos", () => {
  it("point at files that exist in public/images", () => {
    const urls = [
      ...PRODUCTS.map((product) => productImageUrl(product.id)),
      ...HOTELS.map((hotel) => hotelImageUrl(hotel.id)),
      ...SHIPS.map((ship) => shipImageUrl(ship.id)),
      ...HOTELS.map((hotel) => cityImageUrl(hotel.city)),
      ...SAILINGS.map((sailing) => destinationImageUrl(sailing.destination)),
    ].filter((url): url is string => url !== null);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => !existsSync(publicFile(url)))).toEqual([]);
  });

  it("give every product a photo except prod_0030, which keeps the placeholder", () => {
    expect(PRODUCTS.filter((product) => productImageUrl(product.id) === null).map((product) => product.id)).toEqual(["prod_0030"]);
  });

  it("cover every hotel city and cruise destination", () => {
    expect(HOTELS.filter((hotel) => cityImageUrl(hotel.city) === null)).toEqual([]);
    expect(SAILINGS.filter((sailing) => destinationImageUrl(sailing.destination) === null)).toEqual([]);
    expect(destinationImageUrl("Antarctica")).toBeNull();
  });
});

describe("product image URL validation", () => {
  const product = { sku: "TEST-1", name: "N", description: "D", category: "C", brand: "B", priceCents: 1000, stock: 1 };

  it("accepts a site path, an https address, or null", () => {
    expect(productCreateSchema.parse({ ...product, imageUrl: "/images/products/prod_0001.jpg" }).imageUrl).toBe("/images/products/prod_0001.jpg");
    expect(productCreateSchema.parse({ ...product, imageUrl: "https://example.com/photo.jpg" }).imageUrl).toBe("https://example.com/photo.jpg");
    expect(productCreateSchema.parse(product).imageUrl).toBeUndefined();
    expect(productUpdateSchema.parse({ imageUrl: null })).toEqual({ imageUrl: null });
  });

  it("rejects other schemes and addresses that leave the site without https", () => {
    for (const imageUrl of ["http://example.com/a.jpg", "//example.com/a.jpg", "javascript:alert(1)", "images/a.jpg", "/a b.jpg", ""]) {
      const result = productCreateSchema.safeParse({ ...product, imageUrl });
      expect(result.success, imageUrl).toBe(false);
    }
  });

  it("limits the length", () => {
    expect(productCreateSchema.safeParse({ ...product, imageUrl: `/${"a".repeat(500)}` }).success).toBe(false);
  });
});
