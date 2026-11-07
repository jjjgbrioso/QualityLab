import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

type Options = { userId: string; key: string; scope: string; payload: unknown };

const TRANSACTION_LIMITS = { maxWait: 10_000, timeout: 15_000 };

/**
 * Runs `operation` at most once for a key. The key row and the money movement commit together,
 * so a failed operation leaves no key behind and the client can correct the request and retry.
 * The same key with the same payload replays the stored result; a different payload is a 409.
 */
export async function withIdempotency<T>(
  { userId, key, scope, payload }: Options,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<{ data: T; replayed: boolean }> {
  const requestHash = createHash("sha256").update(`${scope}:${JSON.stringify(payload)}`).digest("hex");

  const replay = async () => {
    const stored = await prisma.idempotencyKey.findUnique({ where: { userId_key: { userId, key } } });
    if (!stored) return null;
    if (stored.requestHash !== requestHash) {
      throw new ApiError(409, "IDEMPOTENCY_KEY_CONFLICT", "This Idempotency-Key was already used with a different request.");
    }
    return { data: stored.responseBody as T, replayed: true };
  };

  const earlier = await replay();
  if (earlier) return earlier;

  try {
    return await prisma.$transaction(async (tx) => {
      const record = await tx.idempotencyKey.create({
        data: { userId, key, scope, requestHash, statusCode: 201, responseBody: {} },
      });
      const data = await operation(tx);
      await tx.idempotencyKey.update({
        where: { id: record.id },
        data: { responseBody: data as Prisma.InputJsonValue },
      });
      return { data, replayed: false };
    }, TRANSACTION_LIMITS);
  } catch (error) {
    // A parallel request with this key committed first: its result is the answer to this one too.
    if ((error as { code?: string }).code === "P2002") {
      const raced = await replay();
      if (raced) return raced;
    }
    throw error;
  }
}
