"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { bankButton, bankButtonOutline } from "@/components/bank";
import { SelectField } from "@/components/forms/fields";
import { CheckboxField } from "@/components/forms/wizard";
import { Alert, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";
import { formatPeso } from "@/lib/money";
import type { AccountDto } from "@/lib/services/bank";

type LoanResult = { loan: { id: string } };

/** Availment: accept the offer into an account, or decline it. */
export function LoanOfferActions({ applicationId, accounts, netProceedsCents }: { applicationId: string; accounts: AccountDto[]; netProceedsCents: number }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit, reset } = useSubmit();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const eligible = accounts.filter((account) => account.status === "ACTIVE" && account.type !== "TIME_DEPOSIT");

  async function onAccept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    reset();
    await submit(
      () =>
        apiRequest<LoanResult>(`/bank/loans/applications/${applicationId}/accept`, {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: { disbursementAccountId: form.get("disbursementAccountId"), acceptsDisclosure: form.get("acceptsDisclosure") === "on" },
        }),
      (result) => {
        router.push(`/banking/loans/${result.loan.id}?released=1`);
        router.refresh();
      },
    );
  }

  async function onDecline() {
    reset();
    await submit(
      () => apiRequest(`/bank/loans/applications/${applicationId}/decline`, { method: "POST" }),
      () => router.refresh(),
    );
  }

  return (
    <Card className="p-6">
      <form method="post" onSubmit={onAccept} noValidate className="space-y-4" data-testid="loan-accept-form">
        <h2 className="text-lg font-bold">Accept your loan</h2>
        {error ? <Alert tone="error" testId="loan-accept-error">{error}</Alert> : null}
        <SelectField label="Release the loan to" name="disbursementAccountId" testId="loan-accept-account" error={fieldErrors.disbursementAccountId}>
          {eligible.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.accountNumber})
            </option>
          ))}
        </SelectField>
        <CheckboxField name="acceptsDisclosure" checked={false} error={fieldErrors.acceptsDisclosure} testId="loan-accept-disclosure">
          I have read the disclosure statement above and agree to the promissory note: I will pay every instalment on its due date. (Simulated: nothing is signed.)
        </CheckboxField>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={!ready || pending || eligible.length === 0} className={bankButton} data-testid="loan-accept-button">
            {pending ? "Releasing..." : `Accept and receive ${formatPeso(netProceedsCents)}`}
          </button>
          <button type="button" disabled={!ready || pending} onClick={onDecline} className={bankButtonOutline} data-testid="loan-decline-button">
            Decline the offer
          </button>
        </div>
      </form>
    </Card>
  );
}

/** Settlement: pay the next instalment from an account. */
export function PayInstalmentForm({ loanId, accounts, amountCents, number }: { loanId: string; accounts: AccountDto[]; amountCents: number; number: number }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit, reset } = useSubmit();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [paid, setPaid] = useState<string | null>(null);
  const eligible = accounts.filter((account) => account.status === "ACTIVE" && !account.locked);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    reset();
    setPaid(null);
    await submit(
      () =>
        apiRequest<{ transaction: { reference: string } }>(`/bank/loans/${loanId}/payments`, {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: { fromAccountId: form.get("fromAccountId") },
        }),
      (result) => {
        setPaid(result.transaction.reference);
        setIdempotencyKey(crypto.randomUUID());
        router.refresh();
      },
    );
  }

  return (
    <Card className="p-6">
      <form method="post" onSubmit={onSubmit} noValidate className="space-y-4" data-testid="loan-payment-form">
        <h2 className="text-lg font-bold">
          Pay instalment {number}: {formatPeso(amountCents)}
        </h2>
        {error ? <Alert tone="error" testId="loan-payment-error">{error}</Alert> : null}
        {paid ? <Alert tone="success" testId="loan-payment-success">Payment received. Reference <span data-testid="loan-payment-reference">{paid}</span>.</Alert> : null}
        <SelectField label="Pay from" name="fromAccountId" testId="loan-payment-account" error={fieldErrors.fromAccountId}>
          {eligible.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.accountNumber}) {formatPeso(account.balanceCents)}
            </option>
          ))}
        </SelectField>
        <button type="submit" disabled={!ready || pending || eligible.length === 0} className={`${bankButton} w-full`} data-testid="loan-payment-submit-button">
          {pending ? "Paying..." : `Pay ${formatPeso(amountCents)}`}
        </button>
      </form>
    </Card>
  );
}
