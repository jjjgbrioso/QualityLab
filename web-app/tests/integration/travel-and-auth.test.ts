import { expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { loginUser, OPENING_BALANCE_CENTS, registerUser, revokeToken } from "@/lib/services/auth";
import { verifyToken } from "@/lib/auth/jwt";
import { adminStats } from "@/lib/services/admin";
import { listAccounts } from "@/lib/services/bank";
import { cancelBooking, createBooking, getBooking, listBookings } from "@/lib/services/bookings";
import { getHotel, getRoom, listHotels } from "@/lib/services/hotels";
import { hotelQuerySchema } from "@/lib/validation/travel";
import { admin, alice, bob, describeWithDatabase, failure } from "../helpers";

const SOLO_ROOM = "room_0012_std"; // quantity 1; booked 2030-06-10 to 2030-06-15
const STANDARD = "room_0001_std"; // quantity 5, sleeps 2, $120.00 a night

const hotels = (input: Record<string, string> = {}) => hotelQuerySchema.parse(input);

describeWithDatabase("hotels", () => {
  it("lists, filters, and sorts", async () => {
    expect((await listHotels(hotels())).meta.totalItems).toBe(12);
    expect((await listHotels(hotels({ destination: "lisbon" }))).meta.totalItems).toBe(2);
    expect((await listHotels(hotels({ minStars: "5" }))).items.every((hotel) => hotel.starRating === 5)).toBe(true);
    expect((await listHotels(hotels({ amenity: "Pool" }))).meta.totalItems).toBe(2);
    expect((await listHotels(hotels({ sort: "price_asc" }))).items[0].name).toBe("Solo Room Test House");
  });

  it("respects guest count and price limits", async () => {
    const families = await listHotels(hotels({ destination: "Lisbon", guests: "5" }));
    expect(families.items.every((hotel) => hotel.matchingRooms === 1)).toBe(true);
    expect((await listHotels(hotels({ guests: "6" }))).meta.totalItems).toBe(0);
    expect((await listHotels(hotels({ maxPrice: "70" }))).items.map((hotel) => hotel.id)).toEqual(
      expect.arrayContaining(["hotel_0006", "hotel_0012"]),
    );
  });

  it("shows a sold-out room for overlapping dates only", async () => {
    await expect(getRoom(SOLO_ROOM, { checkIn: "2030-06-12", checkOut: "2030-06-14" })).resolves.toMatchObject({ availableRooms: 0, available: false });
    await expect(getRoom(SOLO_ROOM, { checkIn: "2030-06-15", checkOut: "2030-06-17" })).resolves.toMatchObject({ availableRooms: 1, available: true });
    await expect(getRoom(SOLO_ROOM)).resolves.toMatchObject({ available: null });
  });

  it("prices a stay", async () => {
    await expect(getRoom(STANDARD, { checkIn: "2030-01-01", checkOut: "2030-01-04" })).resolves.toMatchObject({ nights: 3, stayTotalCents: 36_000 });
  });

  it("reports unknown hotels and rooms", async () => {
    expect(await failure(getHotel("nope"))).toMatchObject({ status: 404, code: "HOTEL_NOT_FOUND" });
    expect(await failure(getRoom("nope"))).toMatchObject({ status: 404, code: "ROOM_NOT_FOUND" });
  });
});

describeWithDatabase("bookings", () => {
  const stay = { roomId: STANDARD, checkIn: "2030-02-01", checkOut: "2030-02-04", guests: 2, leadGuestName: "Alice Tester" };

  it("creates a booking with the right total", async () => {
    await expect(createBooking(alice.id, stay)).resolves.toMatchObject({ status: "CONFIRMED", nights: 3, totalCents: 36_000, canCancel: true });
  });

  it("rejects dates that overlap a sold-out room", async () => {
    const error = await failure(createBooking(alice.id, { ...stay, roomId: SOLO_ROOM, checkIn: "2030-06-14", checkOut: "2030-06-16" }));
    expect(error).toMatchObject({ status: 409, code: "ROOM_UNAVAILABLE" });
  });

  it("allows a booking that starts on another booking's check-out day", async () => {
    await expect(createBooking(alice.id, { ...stay, roomId: SOLO_ROOM, checkIn: "2030-06-15", checkOut: "2030-06-16" })).resolves.toMatchObject({ status: "CONFIRMED" });
  });

  it("rejects more guests than the room sleeps", async () => {
    expect(await failure(createBooking(alice.id, { ...stay, guests: 3 }))).toMatchObject({ status: 422, code: "GUEST_LIMIT_EXCEEDED" });
  });

  it("rejects an unknown room", async () => {
    expect(await failure(createBooking(alice.id, { ...stay, roomId: "nope" }))).toMatchObject({ status: 404 });
  });

  it("sells the last room to only one of many parallel requests", async () => {
    const attempts = Array.from({ length: 6 }, () =>
      createBooking(alice.id, { ...stay, roomId: SOLO_ROOM }).then(
        () => "ok",
        (error) => error.code as string,
      ),
    );
    const outcomes = await Promise.all(attempts);

    expect(outcomes.filter((outcome) => outcome === "ok")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome === "ROOM_UNAVAILABLE")).toHaveLength(5);
  });

  it("frees the room when a booking is cancelled", async () => {
    await expect(cancelBooking(bob, "booking_0004")).resolves.toMatchObject({ status: "CANCELLED", canCancel: false });
    await expect(createBooking(alice.id, { ...stay, roomId: SOLO_ROOM, checkIn: "2030-06-10", checkOut: "2030-06-12" })).resolves.toMatchObject({ status: "CONFIRMED" });
  });

  it("refuses to cancel past or already cancelled bookings", async () => {
    expect(await failure(cancelBooking(alice, "booking_0002"))).toMatchObject({ status: 409, code: "BOOKING_NOT_CANCELLABLE" });
    expect(await failure(cancelBooking(alice, "booking_0003"))).toMatchObject({ status: 409, code: "BOOKING_NOT_CANCELLABLE" });
  });

  it("keeps bookings private to their owner, except for admins", async () => {
    expect(await failure(getBooking(bob, "booking_0001"))).toMatchObject({ status: 403 });
    expect(await failure(cancelBooking(bob, "booking_0001"))).toMatchObject({ status: 403 });
    await expect(getBooking(admin, "booking_0001")).resolves.toMatchObject({ id: "booking_0001" });
  });

  it("lists a user's history by status", async () => {
    const { meta } = await listBookings({ status: "CANCELLED", page: 1, pageSize: 10 }, alice.id);
    expect(meta.totalItems).toBe(1);
  });
});

describeWithDatabase("authentication", () => {
  const newUser = { email: "new@qualitylab.test", password: "Strong@123", firstName: "New", lastName: "User" };

  it("registers a customer with a hashed password and a funded account", async () => {
    const user = await registerUser(newUser);
    expect(user.role).toBe("CUSTOMER");

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain(newUser.password);

    const accounts = await listAccounts(user.id);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].balanceCents).toBe(OPENING_BALANCE_CENTS);
  });

  it("rejects a duplicate email", async () => {
    await registerUser(newUser);
    expect(await failure(registerUser(newUser))).toMatchObject({ status: 409, code: "EMAIL_ALREADY_REGISTERED" });
  });

  it("logs in the seeded accounts", async () => {
    await expect(loginUser({ email: "admin@qualitylab.test", password: "Admin@12345" })).resolves.toMatchObject({ user: { role: "ADMIN" } });
    await expect(loginUser({ email: "alice@qualitylab.test", password: "Customer@123" })).resolves.toMatchObject({ user: { role: "CUSTOMER" } });
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    const wrongPassword = await failure(loginUser({ email: "alice@qualitylab.test", password: "Wrong@123" }));
    const unknownEmail = await failure(loginUser({ email: "ghost@qualitylab.test", password: "Wrong@123" }));

    expect(wrongPassword).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    expect(unknownEmail.message).toBe(wrongPassword.message);
  });

  it("refuses a disabled account", async () => {
    const error = await failure(loginUser({ email: "disabled@qualitylab.test", password: "Customer@123" }));
    expect(error).toMatchObject({ status: 403, code: "ACCOUNT_DISABLED" });
  });

  it("records a revoked token", async () => {
    const { token } = await loginUser({ email: "alice@qualitylab.test", password: "Customer@123" });
    const claims = await verifyToken(token);
    await revokeToken(claims!.jti, claims!.expiresAt);
    await expect(prisma.revokedToken.count({ where: { jti: claims!.jti } })).resolves.toBe(1);
  });

  it("reports the expected baseline to the admin dashboard", async () => {
    const stats = await adminStats();
    expect(stats.counts).toEqual({ users: 5, products: 29, orders: 5, confirmedBookings: 3, confirmedCruiseBookings: 3, bankAccounts: 5 });
    expect(stats.lowStockProducts.map((product) => product.id)).toEqual(["prod_0006", "prod_0021", "prod_0010", "prod_0017", "prod_0004"]);
    expect(stats.revenueCents).toBe(34_074);
  });
});
