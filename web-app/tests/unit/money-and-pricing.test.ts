import { describe, expect, it } from "vitest";
import { dollarsToCents, formatCents } from "@/lib/money";
import { calculateTotals } from "@/lib/pricing";

describe("dollarsToCents", () => {
  it.each([
    ["25", 2500],
    ["25.5", 2550],
    ["25.50", 2550],
    ["0.01", 1],
    ["19.99", 1999],
    ["1.10", 110],
    ["  7.25 ", 725],
  ])("converts %s", (input, cents) => {
    expect(dollarsToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-5", "1.999", "1,000", "1e3", "."])("rejects %j", (input) => {
    expect(dollarsToCents(input)).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats US dollars", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(0)).toBe("$0.00");
  });
});

describe("calculateTotals", () => {
  it("charges shipping below the free-shipping threshold", () => {
    expect(calculateTotals(1499)).toEqual({ subtotalCents: 1499, taxCents: 120, shippingCents: 599, totalCents: 2218 });
  });

  it("ships free at exactly the threshold", () => {
    expect(calculateTotals(5000).shippingCents).toBe(0);
    expect(calculateTotals(4999).shippingCents).toBe(599);
  });

  it("charges nothing for an empty cart", () => {
    expect(calculateTotals(0).totalCents).toBe(0);
  });
});
