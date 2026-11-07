import { ApiError } from "@/lib/api/errors";

/** Simulated payment only. Card numbers are never stored and no payment provider is called. */
export type TestCard = {
  number: string;
  brand: string;
  outcome: "APPROVED" | "DECLINED" | "INSUFFICIENT_FUNDS";
};

export const TEST_CARDS: TestCard[] = [
  { number: "4242424242424242", brand: "Visa", outcome: "APPROVED" },
  { number: "5555555555554444", brand: "Mastercard", outcome: "APPROVED" },
  { number: "4000000000000002", brand: "Visa", outcome: "DECLINED" },
  { number: "4000000000009995", brand: "Visa", outcome: "INSUFFICIENT_FUNDS" },
];

export function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** MM/YY is valid through the last day of that month, in UTC. */
export function isExpired(expiry: string, now = new Date()): boolean {
  const [month, year] = expiry.split("/").map(Number);
  const firstDayAfterExpiry = Date.UTC(2000 + year, month, 1);
  return now.getTime() >= firstDayAfterExpiry;
}

export function simulatePayment(cardNumber: string): { brand: string; last4: string } {
  const card = TEST_CARDS.find((candidate) => candidate.number === cardNumber);
  if (!card) {
    throw new ApiError(400, "TEST_CARD_REQUIRED", "Only the documented test cards are accepted.", [
      { field: "payment.cardNumber", message: "Use one of the documented test cards." },
    ]);
  }
  if (card.outcome === "DECLINED") {
    throw new ApiError(402, "PAYMENT_DECLINED", "The card was declined. No payment was taken.");
  }
  if (card.outcome === "INSUFFICIENT_FUNDS") {
    throw new ApiError(402, "PAYMENT_INSUFFICIENT_FUNDS", "The card has insufficient funds. No payment was taken.");
  }
  return { brand: card.brand, last4: cardNumber.slice(-4) };
}
