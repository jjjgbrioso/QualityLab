import type { Metadata } from "next";
import Link from "next/link";
import { BankingNav } from "@/components/BankingNav";
import { Alert, buttonStyles, Card, EmptyState, inputStyles, linkStyles, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDateTime } from "@/lib/dates";
import { ACCOUNT_TYPE_LABELS } from "@/components/bank";
import { formatRate } from "@/lib/bank-products";
import { formatDisplayDate } from "@/lib/dates";
import { formatPeso as formatCents } from "@/lib/money";
import { loadForPage, parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { getAccount, listTransactions } from "@/lib/services/bank";
import { BANK_TRANSACTION_TYPES, transactionQuerySchema } from "@/lib/validation/bank";

export const metadata: Metadata = { title: "Account" };

const CREDIT_TYPES = new Set(["DEPOSIT", "TRANSFER_IN"]);

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const user = await requirePageUser(`/banking/accounts/${id}`);
  const raw = await searchParams;
  const { query, errors } = parsePageQuery(raw, transactionQuerySchema);
  const [account, { items, meta }] = await loadForPage(() =>
    Promise.all([getAccount(user, id), listTransactions(user, id, query)]),
  );

  return (
    <>
      <Link href="/banking" className={linkStyles} data-testid="account-back-link">
        Back to accounts
      </Link>
      <div className="mt-4">
        <PageHeader
          title={account.name}
          description={`${ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · ${account.accountNumber}`}
          actions={<BankingNav />}
          testId="account"
        />
      </div>

      {raw.opened === "1" ? (
        <div className="mb-4">
          <Alert tone="success" testId="account-opened-notice">
            Your new account is open. Account number {account.accountNumber}.
          </Alert>
        </div>
      ) : null}

      <Card className="mb-6 flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted">Available balance</p>
          <p className="text-3xl font-semibold" data-testid="account-balance">
            {formatCents(account.balanceCents)}
          </p>
        </div>
        <StatusBadge status={account.status} testId="account-status" />
      </Card>

      {account.type === "TIME_DEPOSIT" && account.maturityDate ? (
        <div className="mb-6">
          <Alert tone={account.locked ? "warning" : "success"} testId="account-maturity-notice">
            {account.termMonths}-month time deposit at {formatRate(account.interestRateBps ?? 0)}.{" "}
            {account.locked
              ? `The money is locked until ${formatDisplayDate(account.maturityDate)}, so it cannot be withdrawn or transferred before then.`
              : `It matured on ${formatDisplayDate(account.maturityDate)} and can now be withdrawn.`}
          </Alert>
        </div>
      ) : null}

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" data-testid="transaction-filter-form">
        <div>
          <label htmlFor="type" className="mb-1 block text-xs font-medium">Type</label>
          <select id="type" name="type" defaultValue={query.type ?? ""} className={inputStyles} data-testid="transaction-type-select">
            <option value="">All types</option>
            {BANK_TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonStyles.secondary} data-testid="transaction-filter-submit">Apply</button>
      </form>

      {errors.length > 0 ? <Alert tone="error" testId="transaction-filter-error">{errors[0].message}</Alert> : null}

      {items.length === 0 ? (
        <EmptyState title="No transactions found" testId="transactions-empty-state" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="transactions-table">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Date</th>
                <th scope="col" className="p-3 font-medium">Reference</th>
                <th scope="col" className="p-3 font-medium">Type</th>
                <th scope="col" className="p-3 font-medium">Details</th>
                <th scope="col" className="p-3 text-right font-medium">Amount</th>
                <th scope="col" className="p-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {items.map((transaction) => {
                const credit = CREDIT_TYPES.has(transaction.type);
                return (
                  <tr key={transaction.id} className="border-b border-line last:border-0" data-testid={`transaction-row-${transaction.id}`}>
                    <td className="whitespace-nowrap p-3 text-muted">{formatDisplayDateTime(transaction.createdAt)}</td>
                    <td className="p-3 font-mono text-xs" data-testid={`transaction-reference-${transaction.id}`}>{transaction.reference}</td>
                    <td className="p-3" data-testid={`transaction-type-${transaction.id}`}>{transaction.type}</td>
                    <td className="p-3 text-muted">
                      {transaction.description ?? ""}
                      {transaction.counterparty ? <span className="block text-xs">Account {transaction.counterparty}</span> : null}
                    </td>
                    <td className={`p-3 text-right font-medium ${credit ? "text-emerald-700" : "text-red-700"}`} data-testid={`transaction-amount-${transaction.id}`}>
                      {credit ? "+" : "-"}
                      {formatCents(transaction.amountCents)}
                    </td>
                    <td className="p-3 text-right" data-testid={`transaction-balance-${transaction.id}`}>{formatCents(transaction.balanceAfterCents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination meta={meta} basePath={`/banking/accounts/${id}`} query={{ type: query.type }} testId="transaction-pagination" />
    </>
  );
}
