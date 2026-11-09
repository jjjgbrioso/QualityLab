import { z } from "zod";
import { pageFields, requiredId } from "@/lib/validation/common";

export const MAX_TRANSACTION_CENTS = 1_000_000;

const amountCents = z
  .number({ error: "Amount is required." })
  .int("Amount must be a whole number of cents.")
  .positive("Amount must be greater than zero.");

const description = z.string().trim().max(140, "Description must be at most 140 characters.").optional();

export const cashTransactionSchema = z.object({
  accountId: requiredId("Account"),
  amountCents,
  description,
});

export const transferSchema = z.object({
  fromAccountId: requiredId("Source account"),
  toAccountNumber: z
    .string({ error: "Destination account number is required." })
    .trim()
    .regex(/^\d{10}$/, "Account number must be exactly 10 digits."),
  amountCents,
  description,
});

export const idempotencyKeySchema = z
  .string({ error: "The Idempotency-Key header is required." })
  .regex(/^[A-Za-z0-9_-]{8,100}$/, "Idempotency-Key must be 8 to 100 letters, digits, hyphens, or underscores.");

export const BANK_TRANSACTION_TYPES = ["DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT", "LOAN_DISBURSEMENT", "LOAN_PAYMENT"] as const;

export const transactionQuerySchema = z.object({
  type: z.enum(BANK_TRANSACTION_TYPES, { error: "Choose a supported transaction type." }).optional(),
  ...pageFields,
});

export type CashTransactionInput = z.infer<typeof cashTransactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
