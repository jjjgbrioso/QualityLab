import { describe, expect, it } from "vitest";
import { discountPercent } from "@/lib/services/products";
import { cruiseBookingCreateSchema, cruiseQuerySchema } from "@/lib/validation/cruises";
import { bookingCreateSchema } from "@/lib/validation/travel";
import { productCreateSchema, productQuerySchema, productUpdateSchema } from "@/lib/validation/products";

describe("discountPercent", () => {
  it("rounds to a whole percent", () => {
    expect(discountPercent(6999, 9999)).toBe(30);
    expect(discountPercent(12999, 15999)).toBe(19);
  });

  it("is null when there is no saving", () => {
    expect(discountPercent(1000, null)).toBeNull();
    expect(discountPercent(1000, 1000)).toBeNull();
    expect(discountPercent(1000, 900)).toBeNull();
  });
});

describe("product sale fields", () => {
  const product = { sku: "TEST-1", name: "N", description: "D", category: "C", brand: "B", priceCents: 1000, stock: 1 };

  it("accepts an optional original price, or null", () => {
    expect(productCreateSchema.parse({ ...product, listPriceCents: 1500 }).listPriceCents).toBe(1500);
    expect(productCreateSchema.parse(product).listPriceCents).toBeUndefined();
    expect(productUpdateSchema.parse({ listPriceCents: null })).toEqual({ listPriceCents: null });
  });

  it("rejects a non-positive or fractional original price", () => {
    expect(productCreateSchema.safeParse({ ...product, listPriceCents: 0 }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...product, listPriceCents: 10.5 }).success).toBe(false);
  });

  it("reads onSale from the query string", () => {
    expect(productQuerySchema.parse({ onSale: "true" }).onSale).toBe(true);
    expect(productQuerySchema.safeParse({ onSale: "yes" }).success).toBe(false);
  });
});

describe("cruise search", () => {
  it("applies defaults", () => {
    expect(cruiseQuerySchema.parse({})).toMatchObject({ sort: "departure_asc", page: 1 });
  });

  it.each(["2030-13", "2030-1", "March 2030"])("rejects month %j", (month) => {
    expect(cruiseQuerySchema.safeParse({ month }).success).toBe(false);
  });

  it("rejects a reversed nights range and an unknown sort", () => {
    expect(cruiseQuerySchema.safeParse({ minNights: "8", maxNights: "3" }).success).toBe(false);
    expect(cruiseQuerySchema.safeParse({ sort: "cheapest" }).success).toBe(false);
  });
});

describe("guest information", () => {
  const cruise = { cabinId: "cabin_0001_int", guests: 2, leadGuestName: "Alice Tester" };
  const hotel = { roomId: "r", checkIn: "2030-03-10", checkOut: "2030-03-12", guests: 2, leadGuestName: "Alice Tester" };

  it("requires a lead guest name on both booking types", () => {
    expect(cruiseBookingCreateSchema.safeParse({ ...cruise, leadGuestName: undefined }).success).toBe(false);
    expect(bookingCreateSchema.safeParse({ ...hotel, leadGuestName: undefined }).success).toBe(false);
  });

  it("rejects a blank or one-letter name, and trims spaces", () => {
    expect(cruiseBookingCreateSchema.safeParse({ ...cruise, leadGuestName: "   " }).success).toBe(false);
    expect(cruiseBookingCreateSchema.safeParse({ ...cruise, leadGuestName: "A" }).success).toBe(false);
    expect(cruiseBookingCreateSchema.parse({ ...cruise, leadGuestName: "  Ann Lee " }).leadGuestName).toBe("Ann Lee");
  });

  it.each([0, 11, 1.5])("rejects %s cruise guests", (guests) => {
    expect(cruiseBookingCreateSchema.safeParse({ ...cruise, guests }).success).toBe(false);
  });
});
