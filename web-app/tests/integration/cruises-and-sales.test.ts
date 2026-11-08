import { expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { cancelCruiseBooking, createCruiseBooking, getCruiseBooking, listCruiseBookings } from "@/lib/services/cruise-bookings";
import { getSailing, listSailings, listShips } from "@/lib/services/cruises";
import { getHotel } from "@/lib/services/hotels";
import { createProduct, getProduct, listFlashSale, listProducts, updateProduct } from "@/lib/services/products";
import { cruiseQuerySchema } from "@/lib/validation/cruises";
import { productQuerySchema } from "@/lib/validation/products";
import { admin, alice, bob, describeWithDatabase, failure } from "../helpers";

const sailings = (input: Record<string, string> = {}) => listSailings(cruiseQuerySchema.parse(input));
const booking = (cabinId: string, guests = 2) => ({ cabinId, guests, leadGuestName: "Alice Tester" });

describeWithDatabase("cruise search", () => {
  it("lists upcoming sailings only, soonest first", async () => {
    const { items, meta } = await sailings({ pageSize: "20" });
    expect(meta.totalItems).toBe(9);
    expect(items.map((item) => item.id)).not.toContain("sailing_0009");
    expect(items[0].id).toBe("sailing_0001");
  });

  it("filters by destination, port, month, ship, and nights", async () => {
    expect((await sailings({ destination: "Philippine Islands" })).meta.totalItems).toBe(4);
    expect((await sailings({ departurePort: "manila" })).meta.totalItems).toBe(3);
    expect((await sailings({ month: "2030-12" })).items.map((item) => item.id)).toEqual(["sailing_0007", "sailing_0008"]);
    expect((await sailings({ ship: "ship_0004" })).meta.totalItems).toBe(1);
    expect((await sailings({ minNights: "7" })).items.every((item) => item.nights >= 7)).toBe(true);
    expect((await sailings({ destination: "Busan" })).meta.totalItems).toBe(2);
  });

  it("sorts by price and leaves out sailings that cannot fit the party", async () => {
    expect((await sailings({ sort: "price_asc" })).items[0]).toMatchObject({ id: "sailing_0004", fromPricePerGuestCents: 29900 });
    expect((await sailings({ guests: "5" })).meta.totalItems).toBe(0);
  });

  it("lists ships with their departure ports", async () => {
    const ships = await listShips();
    expect(ships).toHaveLength(4);
    expect(ships.find((ship) => ship.id === "ship_0001")).toMatchObject({ upcomingSailings: 3, departurePorts: ["Manila", "Singapore"] });
  });
});

describeWithDatabase("sailing details", () => {
  it("shows cabin prices and a sold-out suite", async () => {
    const sailing = await getSailing("sailing_0007");
    expect(sailing.cabins.map((cabin) => cabin.type)).toEqual(["INTERIOR", "OCEAN_VIEW", "BALCONY", "SUITE"]);
    expect(sailing.cabins[0]).toMatchObject({ pricePerGuestCents: 42900, cabinsLeft: 6, available: true });
    expect(sailing.cabins[3]).toMatchObject({ cabinsLeft: 0, available: false });
    expect(sailing.returnDate).toBe("2030-12-22");
  });

  it("marks a departed sailing as unbookable", async () => {
    const sailing = await getSailing("sailing_0009");
    expect(sailing.departed).toBe(true);
    expect(sailing.cabins.every((cabin) => !cabin.available)).toBe(true);
  });

  it("reports an unknown sailing", async () => {
    expect(await failure(getSailing("nope"))).toMatchObject({ status: 404, code: "SAILING_NOT_FOUND" });
  });
});

describeWithDatabase("cruise bookings", () => {
  it("books a cabin, prices it per guest, and records the lead guest", async () => {
    const created = await createCruiseBooking(alice.id, booking("cabin_0002_bal", 3));
    expect(created).toMatchObject({ status: "CONFIRMED", guests: 3, leadGuestName: "Alice Tester", totalCents: 118800 * 3, canCancel: true });
    expect((await getSailing("sailing_0002")).cabins.find((cabin) => cabin.type === "BALCONY")?.cabinsLeft).toBe(2);
  });

  it("refuses a sold-out cabin, too many guests, a departed sailing, and an unknown cabin", async () => {
    expect(await failure(createCruiseBooking(alice.id, booking("cabin_0007_ste")))).toMatchObject({ status: 409, code: "CABIN_UNAVAILABLE" });
    expect(await failure(createCruiseBooking(alice.id, booking("cabin_0001_int", 3)))).toMatchObject({ status: 422, code: "GUEST_LIMIT_EXCEEDED" });
    expect(await failure(createCruiseBooking(alice.id, booking("cabin_0009_int")))).toMatchObject({ status: 422, code: "SAILING_DEPARTED" });
    expect(await failure(createCruiseBooking(alice.id, booking("nope")))).toMatchObject({ status: 404, code: "CABIN_NOT_FOUND" });
  });

  it("sells the last cabins to only as many parallel requests as there are cabins", async () => {
    const attempts = Array.from({ length: 6 }, () =>
      createCruiseBooking(alice.id, booking("cabin_0004_ste")).then(
        () => "ok",
        (error) => error.code as string,
      ),
    );
    const outcomes = await Promise.all(attempts);
    expect(outcomes.filter((outcome) => outcome === "ok")).toHaveLength(2);
    expect(outcomes.filter((outcome) => outcome === "CABIN_UNAVAILABLE")).toHaveLength(4);
  });

  it("cancels a future booking and frees the cabin", async () => {
    await expect(cancelCruiseBooking(bob, "cruise_booking_0004")).resolves.toMatchObject({ status: "CANCELLED", canCancel: false });
    await expect(createCruiseBooking(alice.id, booking("cabin_0007_ste"))).resolves.toMatchObject({ status: "CONFIRMED" });
  });

  it("refuses to cancel a departed or already cancelled booking", async () => {
    expect(await failure(cancelCruiseBooking(alice, "cruise_booking_0002"))).toMatchObject({ status: 409, code: "CRUISE_BOOKING_NOT_CANCELLABLE" });
    expect(await failure(cancelCruiseBooking(alice, "cruise_booking_0003"))).toMatchObject({ status: 409, code: "CRUISE_BOOKING_NOT_CANCELLABLE" });
  });

  it("keeps cruise bookings private to their owner, except for admins", async () => {
    expect(await failure(getCruiseBooking(bob, "cruise_booking_0001"))).toMatchObject({ status: 403 });
    expect(await failure(cancelCruiseBooking(bob, "cruise_booking_0001"))).toMatchObject({ status: 403 });
    await expect(getCruiseBooking(admin, "cruise_booking_0001")).resolves.toMatchObject({ id: "cruise_booking_0001" });
  });

  it("lists a user's cruise bookings by status", async () => {
    expect((await listCruiseBookings({ page: 1, pageSize: 10 }, alice.id)).meta.totalItems).toBe(3);
    expect((await listCruiseBookings({ status: "CANCELLED", page: 1, pageSize: 10 }, alice.id)).meta.totalItems).toBe(1);
  });
});

describeWithDatabase("sale prices", () => {
  it("shows the discount on a sale product", async () => {
    await expect(getProduct("prod_0009")).resolves.toMatchObject({ priceCents: 6999, listPriceCents: 9999, onSale: true, discountPercent: 30 });
    await expect(getProduct("prod_0013")).resolves.toMatchObject({ listPriceCents: null, onSale: false, discountPercent: null });
  });

  it("filters to sale items", async () => {
    expect((await listProducts(productQuerySchema.parse({ onSale: "true" }))).meta.totalItems).toBe(9);
    expect((await listProducts(productQuerySchema.parse({ onSale: "false" }))).meta.totalItems).toBe(20);
  });

  it("builds the flash sale from in-stock items, biggest discount first", async () => {
    const flash = await listFlashSale();
    expect(flash).toHaveLength(6);
    expect(flash.map((item) => item.id).slice(0, 4)).toEqual(["prod_0009", "prod_0024", "prod_0027", "prod_0002"]);
    expect(flash.every((item) => item.inStock)).toBe(true);
  });

  it("refuses an original price that is not above the price", async () => {
    const input = { sku: "SALE-0001", name: "Sale item", description: "Test", category: "Office", brand: "Marginal", priceCents: 1000, stock: 1, isActive: true };
    expect(await failure(createProduct({ ...input, listPriceCents: 1000 }))).toMatchObject({ status: 422, code: "INVALID_LIST_PRICE" });
    expect(await failure(updateProduct("prod_0009", { priceCents: 10_000 }))).toMatchObject({ status: 422, code: "INVALID_LIST_PRICE" });
    await expect(updateProduct("prod_0009", { listPriceCents: null })).resolves.toMatchObject({ onSale: false });
  });

  it("charges the sale price at checkout", async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: "prod_0009" } });
    expect(product.priceCents).toBeLessThan(product.listPriceCents!);
  });
});

describeWithDatabase("photos", () => {
  it("returns the seeded photo paths", async () => {
    expect((await getProduct("prod_0001")).imageUrl).toBe("/images/products/prod_0001.jpg");
    expect((await prisma.product.findUniqueOrThrow({ where: { id: "prod_0030" } })).imageUrl).toBeNull();
    expect((await getHotel("hotel_0003")).imageUrl).toBe("/images/hotels/hotel_0003.jpg");
    expect((await listShips()).every((ship) => ship.imageUrl === `/images/ships/${ship.id}.jpg`)).toBe(true);
    const sailing = await getSailing("sailing_0005");
    expect(sailing.imageUrl).toBe("/images/destinations/japan-korea.jpg");
    expect(sailing.ship.imageUrl).toBe("/images/ships/ship_0003.jpg");
    expect((await sailings({ pageSize: "1" })).items[0]).toMatchObject({ imageUrl: "/images/destinations/philippine-islands.jpg", ship: { imageUrl: "/images/ships/ship_0001.jpg" } });
  });

  it("lets an admin set and remove a product photo", async () => {
    await expect(updateProduct("prod_0002", { imageUrl: "https://example.com/speaker.jpg" })).resolves.toMatchObject({ imageUrl: "https://example.com/speaker.jpg" });
    await expect(updateProduct("prod_0002", { imageUrl: null })).resolves.toMatchObject({ imageUrl: null });
    const created = await createProduct({ sku: "IMG-0001", name: "Photo Test", description: "D", category: "Office", brand: "B", priceCents: 500, stock: 1, isActive: true });
    expect(created?.imageUrl).toBeNull();
  });
});
