import { randomBytes, randomInt } from "node:crypto";

// No 0/O or 1/I, so references stay readable in logs and screenshots.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function reference(prefix: string, length = 10): string {
  const bytes = randomBytes(length);
  const body = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `${prefix}-${body}`;
}

/** Ten digits starting with 2. Seeded accounts start with 1, so the two can never collide. */
export function newAccountNumber(): string {
  return `2${String(randomInt(0, 1_000_000_000)).padStart(9, "0")}`;
}
