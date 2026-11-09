import type { BankAccount, BankTransaction, Prisma } from "@/generated/prisma/client";
import { ApiError, forbidden, notFound } from "@/lib/api/errors";
import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { duplicateWindowSeconds } from "@/lib/env";
import { reference } from "@/lib/ids";
import { BANK_PRODUCTS, type BankProductCode } from "@/lib/bank-products";
import { addMonths, formatDateOnly, formatDisplayDate, parseDateOnly, todayUtc } from "@/lib/dates";
import { newAccountNumber } from "@/lib/ids";
import { formatPeso as formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/services/idempotency";
import {
  MAX_TRANSACTION_CENTS,
  type CashTransactionInput,
  type TransactionQuery,
  type TransferInput,
} from "@/lib/validation/bank";
import type { OpenAccountInput } from "@/lib/validation/bank-onboarding";

type Actor = { id: string; role: string };
type Tx = Prisma.TransactionClient;

/** A time deposit is locked until its maturity date. */
function lockedUntil(account: BankAccount): string | null {
  if (account.type !== "TIME_DEPOSIT" || !account.maturityDate) return null;
  const maturity = formatDateOnly(account.maturityDate);
  return maturity > todayUtc() ? maturity : null;
}

export function toAccountDto(account: BankAccount) {
  const product = account.product ? BANK_PRODUCTS[account.product as BankProductCode] : undefined;
  return {
    id: account.id,
    accountNumber: account.accountNumber,
    name: account.name,
    type: account.type,
    product: account.product,
    productName: product?.name ?? null,
    status: account.status,
    currency: account.currency,
    balanceCents: account.balanceCents,
    termMonths: account.termMonths,
    interestRateBps: account.interestRateBps,
    maturityDate: account.maturityDate ? formatDateOnly(account.maturityDate) : null,
    locked: lockedUntil(account) !== null,
    createdAt: account.createdAt.toISOString(),
  };
}

export function toTransactionDto(transaction: BankTransaction) {
  return {
    id: transaction.id,
    reference: transaction.reference,
    accountId: transaction.accountId,
    type: transaction.type,
    amountCents: transaction.amountCents,
    balanceAfterCents: transaction.balanceAfterCents,
    counterparty: transaction.counterparty,
    description: transaction.description,
    createdAt: transaction.createdAt.toISOString(),
  };
}

export type AccountDto = ReturnType<typeof toAccountDto>;
export type TransactionDto = ReturnType<typeof toTransactionDto>;

const accountNotFound = (field: string) =>
  new ApiError(404, "ACCOUNT_NOT_FOUND", "Account not found.", [{ field, message: "No account matches this value." }]);

// Inside a transaction, pass `tx`: a second pooled connection there can deadlock the pool under load.
async function ownedAccount(actor: Actor, id: string, client: Pick<Tx, "bankAccount"> = prisma) {
  const account = await client.bankAccount.findUnique({ where: { id } });
  if (!account) throw notFound("Account", "ACCOUNT_NOT_FOUND");
  if (account.userId !== actor.id && actor.role !== "ADMIN") {
    throw forbidden("This account belongs to another user.");
  }
  return account;
}

export async function listAccounts(userId: string) {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ accountNumber: "asc" }],
  });
  return accounts.map(toAccountDto);
}

export async function getAccount(actor: Actor, id: string) {
  return toAccountDto(await ownedAccount(actor, id));
}

export async function listTransactions(actor: Actor, accountId: string, query: TransactionQuery) {
  await ownedAccount(actor, accountId);
  const where: Prisma.BankTransactionWhereInput = {
    accountId,
    ...(query.type ? { type: query.type } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.bankTransaction.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: pageSkip(query.page, query.pageSize),
      take: query.pageSize,
    }),
    prisma.bankTransaction.count({ where }),
  ]);
  return { items: rows.map(toTransactionDto), meta: pageMeta(query.page, query.pageSize, total) };
}

/** Locks rows in id order, so two opposite transfers cannot deadlock each other. */
async function lockAccounts(tx: Tx, ids: string[]) {
  for (const id of [...new Set(ids)].sort()) {
    await tx.$queryRaw`SELECT id FROM "BankAccount" WHERE id = ${id} FOR UPDATE`;
  }
  const rows = await tx.bankAccount.findMany({ where: { id: { in: ids } } });
  return new Map(rows.map((row) => [row.id, row]));
}

function assertActive(account: BankAccount) {
  if (account.status !== "ACTIVE") {
    throw new ApiError(422, "ACCOUNT_FROZEN", `Account ${account.accountNumber} is frozen.`);
  }
}

/** Time deposits take no deposits, and pay out only from the maturity date. */
function assertNotTimeDepositInflow(account: BankAccount) {
  if (account.type === "TIME_DEPOSIT") {
    throw new ApiError(422, "TIME_DEPOSIT_LOCKED", `Account ${account.accountNumber} is a time deposit and cannot receive money.`);
  }
}

function assertNotLocked(account: BankAccount) {
  const until = lockedUntil(account);
  if (until) {
    throw new ApiError(422, "TIME_DEPOSIT_LOCKED", `Time deposit ${account.accountNumber} is locked until ${formatDisplayDate(until)}.`);
  }
}

function assertWithinLimit(amountCents: number) {
  if (amountCents > MAX_TRANSACTION_CENTS) {
    throw new ApiError(422, "LIMIT_EXCEEDED", `A single transaction can be at most ${formatCents(MAX_TRANSACTION_CENTS)}.`, [
      { field: "amountCents", message: `Maximum is ${formatCents(MAX_TRANSACTION_CENTS)}.` },
    ]);
  }
}

function assertSufficientFunds(account: BankAccount, amountCents: number) {
  if (account.balanceCents < amountCents) {
    throw new ApiError(422, "INSUFFICIENT_FUNDS", "The account balance is too low for this transaction.", [
      { field: "amountCents", message: `Available balance is ${formatCents(account.balanceCents)}.` },
    ]);
  }
}

/** Catches a repeat that used a new key, such as a user submitting the same form again. */
async function assertNotDuplicate(
  tx: Tx,
  accountId: string,
  type: BankTransaction["type"],
  amountCents: number,
  counterparty: string | null,
) {
  const windowSeconds = duplicateWindowSeconds();
  if (windowSeconds === 0) return;
  const recent = await tx.bankTransaction.findFirst({
    where: {
      accountId,
      type,
      amountCents,
      counterparty,
      createdAt: { gte: new Date(Date.now() - windowSeconds * 1000) },
    },
  });
  if (recent) {
    throw new ApiError(
      409,
      "DUPLICATE_TRANSACTION",
      `An identical transaction was made in the last ${windowSeconds} seconds (${recent.reference}).`,
    );
  }
}

type Idempotent = { actor: Actor; idempotencyKey: string };

export function deposit({ actor, idempotencyKey }: Idempotent, input: CashTransactionInput) {
  return withIdempotency(
    { userId: actor.id, key: idempotencyKey, scope: "bank.deposit", payload: input },
    async (tx) => {
      await ownedAccount(actor, input.accountId, tx);
      const account = (await lockAccounts(tx, [input.accountId])).get(input.accountId)!;
      assertActive(account);
      assertNotTimeDepositInflow(account);
      assertWithinLimit(input.amountCents);
      await assertNotDuplicate(tx, account.id, "DEPOSIT", input.amountCents, null);

      const balanceAfterCents = account.balanceCents + input.amountCents;
      await tx.bankAccount.update({ where: { id: account.id }, data: { balanceCents: balanceAfterCents } });
      const transaction = await tx.bankTransaction.create({
        data: {
          reference: reference("TXN"),
          accountId: account.id,
          type: "DEPOSIT",
          amountCents: input.amountCents,
          balanceAfterCents,
          description: input.description,
        },
      });
      return toTransactionDto(transaction);
    },
  );
}

export function withdraw({ actor, idempotencyKey }: Idempotent, input: CashTransactionInput) {
  return withIdempotency(
    { userId: actor.id, key: idempotencyKey, scope: "bank.withdrawal", payload: input },
    async (tx) => {
      await ownedAccount(actor, input.accountId, tx);
      const account = (await lockAccounts(tx, [input.accountId])).get(input.accountId)!;
      assertActive(account);
      assertNotLocked(account);
      assertWithinLimit(input.amountCents);
      await assertNotDuplicate(tx, account.id, "WITHDRAWAL", input.amountCents, null);
      assertSufficientFunds(account, input.amountCents);

      const balanceAfterCents = account.balanceCents - input.amountCents;
      await tx.bankAccount.update({ where: { id: account.id }, data: { balanceCents: balanceAfterCents } });
      const transaction = await tx.bankTransaction.create({
        data: {
          reference: reference("TXN"),
          accountId: account.id,
          type: "WITHDRAWAL",
          amountCents: input.amountCents,
          balanceAfterCents,
          description: input.description,
        },
      });
      return toTransactionDto(transaction);
    },
  );
}

export function transfer({ actor, idempotencyKey }: Idempotent, input: TransferInput) {
  return withIdempotency(
    { userId: actor.id, key: idempotencyKey, scope: "bank.transfer", payload: input },
    async (tx) => {
      const source = await ownedAccount(actor, input.fromAccountId, tx).catch((error) => {
        if (error instanceof ApiError && error.status === 404) throw accountNotFound("fromAccountId");
        throw error;
      });
      const destination = await tx.bankAccount.findUnique({ where: { accountNumber: input.toAccountNumber } });
      if (!destination) throw accountNotFound("toAccountNumber");
      if (destination.id === source.id) {
        throw new ApiError(422, "SAME_ACCOUNT_TRANSFER", "Choose a different destination account.", [
          { field: "toAccountNumber", message: "The source and destination accounts are the same." },
        ]);
      }

      const locked = await lockAccounts(tx, [source.id, destination.id]);
      const from = locked.get(source.id)!;
      const to = locked.get(destination.id)!;

      assertActive(from);
      assertActive(to);
      assertNotLocked(from);
      assertNotTimeDepositInflow(to);
      assertWithinLimit(input.amountCents);
      await assertNotDuplicate(tx, from.id, "TRANSFER_OUT", input.amountCents, to.accountNumber);
      assertSufficientFunds(from, input.amountCents);

      const fromBalance = from.balanceCents - input.amountCents;
      const toBalance = to.balanceCents + input.amountCents;
      const shared = reference("TRF");

      await tx.bankAccount.update({ where: { id: from.id }, data: { balanceCents: fromBalance } });
      await tx.bankAccount.update({ where: { id: to.id }, data: { balanceCents: toBalance } });
      await tx.bankTransaction.create({
        data: {
          reference: shared,
          accountId: to.id,
          type: "TRANSFER_IN",
          amountCents: input.amountCents,
          balanceAfterCents: toBalance,
          counterparty: from.accountNumber,
          description: input.description,
        },
      });
      const outgoing = await tx.bankTransaction.create({
        data: {
          reference: shared,
          accountId: from.id,
          type: "TRANSFER_OUT",
          amountCents: input.amountCents,
          balanceAfterCents: fromBalance,
          counterparty: to.accountNumber,
          description: input.description,
        },
      });
      return toTransactionDto(outgoing);
    },
  );
}

/** The most recent transactions across all of a user's accounts, for the dashboard. */
export async function recentTransactions(userId: string, take = 5) {
  const rows = await prisma.bankTransaction.findMany({
    where: { account: { userId } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take,
    include: { account: { select: { name: true, accountNumber: true } } },
  });
  return rows.map((row) => ({ ...toTransactionDto(row), accountName: row.account.name, accountNumber: row.account.accountNumber }));
}

export type RecentTransactionDto = Awaited<ReturnType<typeof recentTransactions>>[number];

export const belowMinimum = (minimum: number) =>
  new ApiError(422, "BELOW_MINIMUM_DEPOSIT", `The opening deposit for this account is at least ${formatCents(minimum)}.`, [
    { field: "openingDepositCents", message: `Minimum is ${formatCents(minimum)}.` },
  ]);

/** Opens another account for a signed-in customer, funded by a transfer from one of their accounts. */
export function openAccount({ actor, idempotencyKey }: Idempotent, input: OpenAccountInput) {
  return withIdempotency(
    { userId: actor.id, key: idempotencyKey, scope: "bank.open-account", payload: input },
    async (tx) => {
      const product = BANK_PRODUCTS[input.product];
      if (input.openingDepositCents < product.minimumOpeningCents) throw belowMinimum(product.minimumOpeningCents);

      await ownedAccount(actor, input.sourceAccountId, tx).catch((error) => {
        if (error instanceof ApiError && error.status === 404) throw accountNotFound("sourceAccountId");
        throw error;
      });
      const source = (await lockAccounts(tx, [input.sourceAccountId])).get(input.sourceAccountId)!;
      assertActive(source);
      assertNotLocked(source);
      assertWithinLimit(input.openingDepositCents);
      assertSufficientFunds(source, input.openingDepositCents);

      const term = product.type === "TIME_DEPOSIT" ? input.termMonths! : null;
      const account = await tx.bankAccount.create({
        data: {
          accountNumber: newAccountNumber(),
          userId: source.userId,
          name: input.nickname ?? product.name,
          type: product.type,
          product: product.code,
          balanceCents: input.openingDepositCents,
          termMonths: term,
          interestRateBps: product.ratesBps[term ?? 0],
          maturityDate: term ? parseDateOnly(addMonths(todayUtc(), term)) : null,
        },
      });

      const shared = reference("OPN");
      const sourceBalance = source.balanceCents - input.openingDepositCents;
      await tx.bankAccount.update({ where: { id: source.id }, data: { balanceCents: sourceBalance } });
      await tx.bankTransaction.create({
        data: {
          reference: shared,
          accountId: account.id,
          type: "TRANSFER_IN",
          amountCents: input.openingDepositCents,
          balanceAfterCents: input.openingDepositCents,
          counterparty: source.accountNumber,
          description: "Opening deposit",
        },
      });
      const outgoing = await tx.bankTransaction.create({
        data: {
          reference: shared,
          accountId: source.id,
          type: "TRANSFER_OUT",
          amountCents: input.openingDepositCents,
          balanceAfterCents: sourceBalance,
          counterparty: account.accountNumber,
          description: `Opening deposit for ${account.name}`,
        },
      });
      return { account: toAccountDto(account), transaction: toTransactionDto(outgoing) };
    },
  );
}
