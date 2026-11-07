import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { isExpired, passesLuhn, simulatePayment, TEST_CARDS } from "@/lib/payment";

describe("passesLuhn", () => {
  it("accepts every documented test card", () => {
    for (const card of TEST_CARDS) expect(passesLuhn(card.number)).toBe(true);
  });

  it("rejects a mistyped number", () => {
    expect(passesLuhn("4242424242424241")).toBe(false);
  });
});

describe("isExpired", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("treats a card as valid through its final month", () => {
    expect(isExpired("06/26", now)).toBe(false);
    expect(isExpired("12/30", now)).toBe(false);
  });

  it("treats earlier months as expired", () => {
    expect(isExpired("05/26", now)).toBe(true);
    expect(isExpired("12/25", now)).toBe(true);
  });
});

describe("simulatePayment", () => {
  const codeFor = (number: string) => {
    try {
      simulatePayment(number);
      return "APPROVED";
    } catch (error) {
      return (error as ApiError).code;
    }
  };

  it("approves test cards and keeps only the last four digits", () => {
    expect(simulatePayment("4242424242424242")).toEqual({ brand: "Visa", last4: "4242" });
  });

  it("declines the declined test card", () => {
    expect(codeFor("4000000000000002")).toBe("PAYMENT_DECLINED");
  });

  it("reports insufficient funds for that test card", () => {
    expect(codeFor("4000000000009995")).toBe("PAYMENT_INSUFFICIENT_FUNDS");
  });

  it("refuses any card outside the test list, including a valid-looking real number", () => {
    expect(codeFor("4111111111111111")).toBe("TEST_CARD_REQUIRED");
  });
});
