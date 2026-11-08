"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, SelectField } from "@/components/forms/fields";
import { Alert, buttonStyles, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";
import { dollarsToCents, formatCents } from "@/lib/money";
import type { AccountDto, TransactionDto } from "@/lib/services/bank";

type Kind = "deposit" | "withdrawal" | "transfer";

const SETTINGS: Record<Kind, { endpoint: string; action: string; testId: string }> = {
  deposit: { endpoint: "/bank/deposits", action: "Deposit", testId: "deposit" },
  withdrawal: { endpoint: "/bank/withdrawals", action: "Withdraw", testId: "withdrawal" },
  transfer: { endpoint: "/bank/transfers", action: "Transfer", testId: "transfer" },
};

export function BankTransactionForm({ kind, accounts }: { kind: Kind; accounts: AccountDto[] }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit, setFieldErrors, reset } = useSubmit();
  const [result, setResult] = useState<TransactionDto | null>(null);
  // Kept across a failed attempt so a retry cannot post twice. Replaced after each success.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const { endpoint, action, testId } = SETTINGS[kind];
  const accountField = kind === "transfer" ? "fromAccountId" : "accountId";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setResult(null);
    reset();

    const amountCents = dollarsToCents(String(form.get("amount") ?? ""));
    if (amountCents === null) {
      setFieldErrors({ amountCents: "Enter an amount such as 25.00." });
      return;
    }

    const description = String(form.get("description") ?? "").trim();
    const body = {
      [accountField]: form.get("account"),
      amountCents,
      ...(description ? { description } : {}),
      ...(kind === "transfer" ? { toAccountNumber: form.get("toAccountNumber") } : {}),
    };

    await submit(
      () =>
        apiRequest<TransactionDto>(endpoint, {
          method: "POST",
          body,
          headers: { "Idempotency-Key": idempotencyKey },
        }),
      (transaction) => {
        setResult(transaction);
        setIdempotencyKey(crypto.randomUUID());
        formElement.reset();
        router.refresh();
      },
    );
  }

  return (
    <Card className="max-w-lg p-6">
      <form method="post" onSubmit={onSubmit} noValidate className="space-y-4" data-testid={`${testId}-form`}>
        {error ? <Alert tone="error" testId={`${testId}-error`}>{error}</Alert> : null}
        {result ? (
          <Alert tone="success" testId={`${testId}-success`}>
            {action} complete. Reference <span data-testid={`${testId}-reference`}>{result.reference}</span>. New balance{" "}
            <span data-testid={`${testId}-new-balance`}>{formatCents(result.balanceAfterCents)}</span>.
          </Alert>
        ) : null}

        <SelectField
          label={kind === "transfer" ? "From account" : "Account"}
          name="account"
          testId={`${testId}-account`}
          error={fieldErrors[accountField]}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.accountNumber}) {formatCents(account.balanceCents)}
              {account.status === "FROZEN" ? " - frozen" : ""}
            </option>
          ))}
        </SelectField>

        {kind === "transfer" ? (
          <Field
            label="To account number"
            name="toAccountNumber"
            inputMode="numeric"
            autoComplete="off"
            testId="transfer-to-account"
            hint="Ten digits. Test accounts include 1000000003."
            error={fieldErrors.toAccountNumber}
          />
        ) : null}

        <Field
          label="Amount (USD)"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          testId={`${testId}-amount`}
          error={fieldErrors.amountCents}
        />
        <Field
          label="Description (optional)"
          name="description"
          autoComplete="off"
          testId={`${testId}-description`}
          error={fieldErrors.description}
        />
        <button type="submit" disabled={!ready || pending} className={`${buttonStyles.primary} w-full`} data-testid={`${testId}-submit-button`}>
          {pending ? "Processing..." : action}
        </button>
      </form>
    </Card>
  );
}
