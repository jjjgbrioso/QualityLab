"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { bankButton } from "@/components/bank";
import { Field, SelectField } from "@/components/forms/fields";
import { Alert, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";
import { BANK_PRODUCTS, type BankProductCode, formatRate, TIME_DEPOSIT_TERMS } from "@/lib/bank-products";
import { dollarsToCents, formatPeso } from "@/lib/money";
import type { AccountDto } from "@/lib/services/bank";

type Result = { account: AccountDto };

/** Opens another account for a signed-in customer, funded from one of their accounts. */
export function OpenAccountForm({ accounts }: { accounts: AccountDto[] }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit, setFieldErrors, reset } = useSubmit();
  const [product, setProduct] = useState<BankProductCode>("STARTER_SAVINGS");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const funding = accounts.filter((account) => account.status === "ACTIVE" && !account.locked);
  const selected = BANK_PRODUCTS[product];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    reset();
    const openingDepositCents = dollarsToCents(String(form.get("deposit") ?? ""));
    if (openingDepositCents === null) {
      setFieldErrors({ openingDepositCents: "Enter an amount such as 5000.00." });
      return;
    }
    const nickname = String(form.get("nickname") ?? "").trim();
    await submit(
      () =>
        apiRequest<Result>("/bank/accounts", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: {
            product,
            sourceAccountId: form.get("sourceAccountId"),
            openingDepositCents,
            ...(product === "TIME_DEPOSIT" ? { termMonths: Number(form.get("termMonths")) } : {}),
            ...(nickname ? { nickname } : {}),
          },
        }),
      (result) => {
        setIdempotencyKey(crypto.randomUUID());
        router.push(`/banking/accounts/${result.account.id}?opened=1`);
        router.refresh();
      },
    );
  }

  return (
    <Card className="max-w-2xl p-6">
      <form method="post" onSubmit={onSubmit} noValidate className="space-y-5" data-testid="open-account-form">
        {error ? <Alert tone="error" testId="open-account-error">{error}</Alert> : null}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Account type</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.values(BANK_PRODUCTS).map((option) => (
              <label
                key={option.code}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald-800`}
                data-testid={`open-account-product-${option.code.toLowerCase()}`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <input
                    type="radio"
                    name="product"
                    value={option.code}
                    checked={product === option.code}
                    onChange={() => setProduct(option.code)}
                    className="accent-emerald-800"
                    data-testid={`open-account-product-radio-${option.code.toLowerCase()}`}
                  />
                  {option.name}
                </span>
                <span className="text-xs text-muted">{option.summary}</span>
                <span className="text-xs">Opening deposit from {formatPeso(option.minimumOpeningCents)}</span>
              </label>
            ))}
          </div>
          {fieldErrors.product ? <p className="mt-1 text-xs text-red-700" data-testid="open-account-product-error">{fieldErrors.product}</p> : null}
        </fieldset>

        {product === "TIME_DEPOSIT" ? (
          <SelectField label="Term" name="termMonths" defaultValue="6" testId="open-account-term" error={fieldErrors.termMonths}>
            {TIME_DEPOSIT_TERMS.map((term) => (
              <option key={term} value={term}>
                {term} months at {formatRate(selected.ratesBps[term])}
              </option>
            ))}
          </SelectField>
        ) : null}

        <SelectField label="Fund from" name="sourceAccountId" testId="open-account-source" error={fieldErrors.sourceAccountId}>
          {funding.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.accountNumber}) {formatPeso(account.balanceCents)}
            </option>
          ))}
        </SelectField>

        <Field
          label="Opening deposit (PHP)"
          name="deposit"
          inputMode="decimal"
          autoComplete="off"
          hint={`At least ${formatPeso(selected.minimumOpeningCents)}. It moves from the account above.`}
          testId="open-account-deposit"
          error={fieldErrors.openingDepositCents}
        />
        <Field label="Nickname (optional)" name="nickname" autoComplete="off" testId="open-account-nickname" error={fieldErrors.nickname} />

        <button type="submit" disabled={!ready || pending || funding.length === 0} className={`${bankButton} w-full`} data-testid="open-account-submit-button">
          {pending ? "Opening..." : `Open ${selected.name}`}
        </button>
        {funding.length === 0 ? (
          <p className="text-sm text-muted" data-testid="open-account-no-funding">You need an active account with money in it to fund a new one.</p>
        ) : null}
      </form>
    </Card>
  );
}
