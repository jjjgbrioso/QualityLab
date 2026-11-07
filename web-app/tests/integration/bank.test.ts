import { expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { deposit, getAccount, listTransactions, transfer, withdraw } from "@/lib/services/bank";
import { alice, balance, bob, describeWithDatabase, failure, key } from "../helpers";

const ALICE = "acct_alice_chk"; // $2,500.00
const BOB = "acct_bob_chk"; // $750.50
const BOB_NUMBER = "1000000003";
const FROZEN_NUMBER = "1000000004";

const asAlice = () => ({ actor: alice, idempotencyKey: key() });

describeWithDatabase("banking", () => {
  it("transfers money and records both sides", async () => {
    const { data } = await transfer(asAlice(), { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 10_000 });

    expect(data.type).toBe("TRANSFER_OUT");
    expect(data.balanceAfterCents).toBe(240_000);
    expect(await balance(ALICE)).toBe(240_000);
    expect(await balance(BOB)).toBe(85_050);

    const incoming = await prisma.bankTransaction.findFirstOrThrow({ where: { accountId: BOB, reference: data.reference } });
    expect(incoming).toMatchObject({ type: "TRANSFER_IN", amountCents: 10_000, counterparty: "1000000001" });
  });

  it("deposits and withdraws", async () => {
    await deposit(asAlice(), { accountId: ALICE, amountCents: 5_000 });
    expect(await balance(ALICE)).toBe(255_000);
    await withdraw(asAlice(), { accountId: ALICE, amountCents: 15_000 });
    expect(await balance(ALICE)).toBe(240_000);
  });

  it("refuses to overdraw and leaves the balance alone", async () => {
    const error = await failure(withdraw(asAlice(), { accountId: ALICE, amountCents: 250_001 }));
    expect(error).toMatchObject({ status: 422, code: "INSUFFICIENT_FUNDS" });
    expect(await balance(ALICE)).toBe(250_000);
  });

  it("allows spending the exact balance", async () => {
    await withdraw(asAlice(), { accountId: ALICE, amountCents: 250_000 });
    expect(await balance(ALICE)).toBe(0);
  });

  it("rejects an unknown destination account", async () => {
    const error = await failure(
      transfer(asAlice(), { fromAccountId: ALICE, toAccountNumber: "9999999999", amountCents: 100 }),
    );
    expect(error).toMatchObject({ status: 404, code: "ACCOUNT_NOT_FOUND" });
    expect(error.details?.[0].field).toBe("toAccountNumber");
  });

  it("rejects a transfer to the same account", async () => {
    const error = await failure(transfer(asAlice(), { fromAccountId: ALICE, toAccountNumber: "1000000001", amountCents: 100 }));
    expect(error).toMatchObject({ status: 422, code: "SAME_ACCOUNT_TRANSFER" });
  });

  it("rejects a frozen destination account", async () => {
    const error = await failure(transfer(asAlice(), { fromAccountId: ALICE, toAccountNumber: FROZEN_NUMBER, amountCents: 100 }));
    expect(error).toMatchObject({ status: 422, code: "ACCOUNT_FROZEN" });
  });

  it("rejects an amount over the single-transaction limit", async () => {
    const error = await failure(deposit(asAlice(), { accountId: ALICE, amountCents: 1_000_001 }));
    expect(error).toMatchObject({ status: 422, code: "LIMIT_EXCEEDED" });
  });

  it("does not let a user touch another user's account", async () => {
    const error = await failure(withdraw(asAlice(), { accountId: BOB, amountCents: 100 }));
    expect(error).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(await balance(BOB)).toBe(75_050);
    expect(await failure(getAccount(alice, BOB))).toMatchObject({ status: 403 });
    expect(await failure(listTransactions(alice, BOB, { page: 1, pageSize: 10 }))).toMatchObject({ status: 403 });
  });

  it("replays a repeated Idempotency-Key without moving money twice", async () => {
    const context = asAlice();
    const body = { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 1_000 };

    const first = await transfer(context, body);
    const second = await transfer(context, body);

    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.data.reference).toBe(first.data.reference);
    expect(await balance(ALICE)).toBe(249_000);
  });

  it("rejects a key reused with a different request", async () => {
    const context = asAlice();
    await transfer(context, { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 1_000 });
    const error = await failure(transfer(context, { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 2_000 }));
    expect(error).toMatchObject({ status: 409, code: "IDEMPOTENCY_KEY_CONFLICT" });
  });

  it("lets a failed request retry with the same key", async () => {
    const context = asAlice();
    const body = { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 300_000 };
    await failure(transfer(context, body));
    await deposit(asAlice(), { accountId: ALICE, amountCents: 100_000 });

    await expect(transfer(context, body)).resolves.toMatchObject({ replayed: false });
    expect(await balance(ALICE)).toBe(50_000);
  });

  it("blocks an identical transaction sent with a new key", async () => {
    const body = { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 1_234 };
    await transfer(asAlice(), body);
    const error = await failure(transfer(asAlice(), body));
    expect(error).toMatchObject({ status: 409, code: "DUPLICATE_TRANSACTION" });
    expect(await balance(ALICE)).toBe(248_766);
  });

  it("runs parallel requests with one key exactly once", async () => {
    const context = asAlice();
    const body = { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 2_500 };

    const results = await Promise.all(Array.from({ length: 8 }, () => transfer(context, body)));

    expect(new Set(results.map((result) => result.data.reference)).size).toBe(1);
    expect(results.filter((result) => !result.replayed)).toHaveLength(1);
    expect(await balance(ALICE)).toBe(247_500);
    expect(await balance(BOB)).toBe(77_550);
  });

  it("never overdraws under parallel withdrawals", async () => {
    // Each amount is different, so only the balance can stop them, not the duplicate check.
    const attempts = Array.from({ length: 10 }, (_, index) =>
      withdraw(asAlice(), { accountId: ALICE, amountCents: 100_000 + index }).then(
        () => "ok",
        (error) => error.code as string,
      ),
    );
    const outcomes = await Promise.all(attempts);

    expect(outcomes.filter((outcome) => outcome === "ok")).toHaveLength(2);
    expect(outcomes.filter((outcome) => outcome === "INSUFFICIENT_FUNDS")).toHaveLength(8);
    expect(await balance(ALICE)).toBeGreaterThanOrEqual(0);
  });

  it("survives opposite transfers without a deadlock", async () => {
    const transfers = Array.from({ length: 6 }, (_, index) =>
      index % 2 === 0
        ? transfer(asAlice(), { fromAccountId: ALICE, toAccountNumber: BOB_NUMBER, amountCents: 100 + index })
        : transfer(
            { actor: bob, idempotencyKey: key() },
            { fromAccountId: BOB, toAccountNumber: "1000000001", amountCents: 100 + index },
          ),
    );
    const results = await Promise.allSettled(transfers);

    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    expect((await balance(ALICE)) + (await balance(BOB))).toBe(325_050);
  });
});
