import { describe, expect, it } from "vitest";
import { addDays, isValidDateOnly, nightsBetween, todayUtc } from "@/lib/dates";
import { registerSchema } from "@/lib/validation/auth";
import { idempotencyKeySchema, transferSchema } from "@/lib/validation/bank";
import { checkoutSchema } from "@/lib/validation/commerce";
import { productQuerySchema, productUpdateSchema } from "@/lib/validation/products";
import { bookingCreateSchema, hotelQuerySchema } from "@/lib/validation/travel";

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe("registerSchema", () => {
  const valid = { email: "New.User@Example.COM", password: "Strong@123", firstName: "New", lastName: "User" };

  it("normalizes the email", () => {
    expect(registerSchema.parse(valid).email).toBe("new.user@example.com");
  });

  it("drops a role sent by the client", () => {
    expect(registerSchema.parse({ ...valid, role: "ADMIN" })).not.toHaveProperty("role");
  });

  it.each([
    ["short", "Ab@1"],
    ["no capital", "weak@1234"],
    ["no number", "Weak@word"],
    ["no special character", "Weak12345"],
  ])("rejects a password with %s", (_case, password) => {
    expect(registerSchema.safeParse({ ...valid, password }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(messages(registerSchema.safeParse({ ...valid, email: "nope" }))).toContain("Enter a valid email address.");
  });
});

describe("transferSchema", () => {
  const valid = { fromAccountId: "a", toAccountNumber: "1000000003", amountCents: 100 };

  it.each([0, -1, 1.5])("rejects an amount of %s", (amountCents) => {
    expect(transferSchema.safeParse({ ...valid, amountCents }).success).toBe(false);
  });

  it("rejects an account number that is not ten digits", () => {
    expect(messages(transferSchema.safeParse({ ...valid, toAccountNumber: "123" }))).toContain(
      "Account number must be exactly 10 digits.",
    );
  });
});

describe("idempotencyKeySchema", () => {
  it("requires a key of a sensible length", () => {
    expect(idempotencyKeySchema.safeParse("short").success).toBe(false);
    expect(idempotencyKeySchema.safeParse(undefined).success).toBe(false);
    expect(idempotencyKeySchema.safeParse("demo-key-0001").success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    shipping: { fullName: "A", address: "B", city: "C", postcode: "D", country: "E" },
    payment: { cardholderName: "A", cardNumber: "4242 4242 4242 4242", expiry: "12/30", cvv: "123" },
  };

  it("strips spaces from the card number", () => {
    expect(checkoutSchema.parse(valid).payment.cardNumber).toBe("4242424242424242");
  });

  it("rejects an expired card and a bad number", () => {
    expect(checkoutSchema.safeParse({ ...valid, payment: { ...valid.payment, expiry: "01/20" } }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, payment: { ...valid.payment, cardNumber: "1234" } }).success).toBe(false);
  });
});

describe("productQuerySchema", () => {
  it("applies defaults", () => {
    expect(productQuerySchema.parse({})).toMatchObject({ sort: "name_asc", page: 1, pageSize: 12 });
  });

  it("reads inStock=false as false", () => {
    expect(productQuerySchema.parse({ inStock: "false" }).inStock).toBe(false);
  });

  it("rejects a reversed price range and an oversized page", () => {
    expect(productQuerySchema.safeParse({ minPrice: "50", maxPrice: "10" }).success).toBe(false);
    expect(productQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});

describe("productUpdateSchema", () => {
  it("does not add fields the caller left out", () => {
    expect(productUpdateSchema.parse({ name: "Renamed" })).toEqual({ name: "Renamed" });
  });

  it("rejects an empty update", () => {
    expect(productUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("dates", () => {
  it("rejects impossible calendar dates", () => {
    expect(isValidDateOnly("2030-02-30")).toBe(false);
    expect(isValidDateOnly("2030-13-01")).toBe(false);
    expect(isValidDateOnly("03/10/2030")).toBe(false);
    expect(isValidDateOnly("2028-02-29")).toBe(true);
  });

  it("counts nights across a month end", () => {
    expect(nightsBetween("2030-01-30", "2030-02-02")).toBe(3);
  });
});

describe("booking dates and guests", () => {
  const stay = { roomId: "r", checkIn: "2030-03-10", checkOut: "2030-03-12", guests: 2 };

  it("accepts a future stay", () => {
    expect(bookingCreateSchema.safeParse(stay).success).toBe(true);
  });

  it("rejects check-out on or before check-in", () => {
    expect(messages(bookingCreateSchema.safeParse({ ...stay, checkOut: "2030-03-10" }))).toContain(
      "Check-out must be after check-in.",
    );
  });

  it("rejects a check-in in the past but allows today", () => {
    const today = todayUtc();
    expect(bookingCreateSchema.safeParse({ ...stay, checkIn: addDays(today, -1), checkOut: addDays(today, 1) }).success).toBe(false);
    expect(bookingCreateSchema.safeParse({ ...stay, checkIn: today, checkOut: addDays(today, 1) }).success).toBe(true);
  });

  it("rejects a stay longer than 30 nights", () => {
    expect(messages(bookingCreateSchema.safeParse({ ...stay, checkOut: "2030-04-10" }))).toContain(
      "A stay can be at most 30 nights.",
    );
  });

  it.each([0, 11, 1.5])("rejects %s guests", (guests) => {
    expect(bookingCreateSchema.safeParse({ ...stay, guests }).success).toBe(false);
  });

  it("requires both dates in a hotel search", () => {
    expect(messages(hotelQuerySchema.safeParse({ checkIn: "2030-03-10" }))).toContain(
      "Provide both check-in and check-out dates.",
    );
  });
});
