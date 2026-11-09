import type { Metadata } from "next";
import Link from "next/link";
import { Amount, BalanceToggle, BalanceVisibility } from "@/components/BalanceVisibility";
import { AccountTile, BankWordmark, icons, maskAccountNumber, QuickAction } from "@/components/bank";
import { EmptyState } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDateTime } from "@/lib/dates";
import { formatPeso } from "@/lib/money";
import { listAccounts, recentTransactions } from "@/lib/services/bank";

export const metadata: Metadata = { title: "Banking" };

const CREDIT_TYPES = new Set(["DEPOSIT", "TRANSFER_IN", "LOAN_DISBURSEMENT"]);

export default async function BankingPage() {
  const user = await requirePageUser("/banking");
  const [accounts, recent] = await Promise.all([listAccounts(user.id), recentTransactions(user.id, 5)]);
  const total = accounts.reduce((sum, account) => sum + account.balanceCents, 0);

  return (
    <BalanceVisibility>
      <div className="space-y-8">
        <section
          className="relative -mx-4 -mt-8 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 px-4 pb-16 pt-8 text-white sm:-mx-6 sm:px-6"
          data-testid="banking-hero"
        >
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-yellow-300/10" aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <BankWordmark className="text-yellow-300" />
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl" data-testid="banking-title">
                Good day, {user.firstName}
              </h1>
              <p className="text-sm text-emerald-100">Simulated accounts in Philippine pesos. No real money or bank is involved.</p>
            </div>
            <BalanceToggle />
          </div>
          <div className="relative mt-6">
            <p className="text-xs uppercase tracking-wider text-emerald-200">Total balance</p>
            <p className="text-4xl font-extrabold" data-testid="banking-total-balance">
              <Amount value={formatPeso(total)} />
            </p>
            <p className="text-xs text-emerald-200">
              Across {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
            </p>
          </div>
        </section>

        <nav aria-label="Banking actions" className="relative -mt-14 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-4" data-testid="banking-quick-actions">
          <QuickAction href="/banking/transfer" label="Transfer" icon={icons.transfer} testId="banking-transfer-link" />
          <QuickAction href="/banking/deposit" label="Deposit" icon={icons.deposit} testId="banking-deposit-link" />
          <QuickAction href="/banking/withdraw" label="Withdraw" icon={icons.withdraw} testId="banking-withdraw-link" />
          <QuickAction href="/banking/accounts/new" label="Open account" icon={icons.open} testId="banking-open-account-link" />
          <QuickAction href="/banking/loans" label="Loans" icon={icons.loan} testId="banking-loans-link" />
        </nav>

        <section aria-labelledby="accounts-heading">
          <h2 id="accounts-heading" className="mb-3 text-lg font-bold">My accounts</h2>
          {accounts.length === 0 ? (
            <EmptyState title="No accounts yet" testId="banking-empty-state">
              <Link href="/banking/accounts/new" className="font-semibold text-emerald-800 hover:underline">Open an account</Link>
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="account-list">
              {accounts.map((account) => (
                <AccountTile key={account.id} account={account} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="recent-heading" data-testid="banking-recent">
          <h2 id="recent-heading" className="mb-3 text-lg font-bold">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted" data-testid="banking-recent-empty">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
              {recent.map((transaction) => {
                const credit = CREDIT_TYPES.has(transaction.type);
                return (
                  <li key={transaction.id} className="flex items-center justify-between gap-3 p-4" data-testid={`recent-transaction-${transaction.id}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{transaction.description ?? transaction.type.replace("_", " ").toLowerCase()}</p>
                      <p className="text-xs text-muted">
                        {transaction.accountName} {maskAccountNumber(transaction.accountNumber)} · {formatDisplayDateTime(transaction.createdAt)}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-semibold ${credit ? "text-emerald-700" : "text-red-700"}`}>
                      {credit ? "+" : "-"}
                      <Amount value={formatPeso(transaction.amountCents)} />
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </BalanceVisibility>
  );
}
