import type { Metadata } from "next";
import Link from "next/link";
import { BankingNav } from "@/components/BankingNav";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { listAccounts } from "@/lib/services/bank";

export const metadata: Metadata = { title: "Banking" };

export default async function BankingPage() {
  const user = await requirePageUser("/banking");
  const accounts = await listAccounts(user.id);
  const total = accounts.reduce((sum, account) => sum + account.balanceCents, 0);

  return (
    <>
      <PageHeader
        title="Banking"
        description="Simulated accounts. No real money or bank is involved."
        actions={<BankingNav />}
        testId="banking"
      />

      <Card className="mb-6 p-5">
        <p className="text-sm text-muted">Total balance</p>
        <p className="text-3xl font-semibold" data-testid="banking-total-balance">
          {formatCents(total)}
        </p>
      </Card>

      {accounts.length === 0 ? (
        <EmptyState title="No accounts yet" testId="banking-empty-state" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="account-list">
          {accounts.map((account) => (
            <Link key={account.id} href={`/banking/accounts/${account.id}`} className="group" data-testid={`account-card-${account.id}`}>
              <Card className="h-full p-5 transition-colors group-hover:border-brand-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-medium">{account.name}</h2>
                    <p className="text-xs text-muted" data-testid={`account-number-${account.id}`}>
                      {account.type} · {account.accountNumber}
                    </p>
                  </div>
                  <StatusBadge status={account.status} testId={`account-status-${account.id}`} />
                </div>
                <p className="mt-3 text-xl font-semibold" data-testid={`account-balance-${account.id}`}>
                  {formatCents(account.balanceCents)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
