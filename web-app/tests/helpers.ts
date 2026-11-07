import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import { afterAll, beforeAll, beforeEach, describe } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { seedDatabase, wipeDatabase } from "../scripts/seed-lib";

export const alice = { id: "user_alice", role: "CUSTOMER" };
export const bob = { id: "user_bob", role: "CUSTOMER" };
export const admin = { id: "user_admin", role: "ADMIN" };

export const key = () => randomUUID();

const POOL_SIZE = 5;

/**
 * Opening a connection takes longer than one of these transactions. With a cold pool, "parallel"
 * transactions queue for the first connection and run one by one, so race tests pass even with
 * their locks removed. Holding every connection at once first makes the transactions truly overlap.
 */
async function openAllPoolConnections() {
  await Promise.all(Array.from({ length: POOL_SIZE }, () => prisma.$queryRaw`SELECT pg_sleep(0.05)::text`));
}

/** Runs a suite against the seeded baseline, restored before every test. */
export function describeWithDatabase(name: string, suite: () => void) {
  describe.skipIf(!process.env.TEST_DATABASE_URL)(name, () => {
    beforeAll(() => {
      execSync("npx prisma migrate deploy", {
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, DIRECT_DATABASE_URL: process.env.TEST_DATABASE_URL },
        stdio: "ignore",
      });
    }, 60_000);

    beforeEach(async () => {
      await wipeDatabase(prisma as never);
      await seedDatabase(prisma as never);
      await openAllPoolConnections();
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    suite();
  });
}

/** Resolves to the ApiError a call rejects with, so tests can assert its status and code. */
export async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("Expected the call to fail, but it succeeded.");
}

export const balance = async (id: string) =>
  (await prisma.bankAccount.findUniqueOrThrow({ where: { id } })).balanceCents;

export const stock = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;
