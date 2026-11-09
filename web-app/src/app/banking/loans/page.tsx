import type { Metadata } from "next";
import Link from "next/link";
import { bankButton } from "@/components/bank";
import { Card, EmptyState, linkStyles, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/dates";
import { formatPeso } from "@/lib/money";
import { listLoanActivity } from "@/lib/services/loans";

export const metadata: Metadata = { title: "Loans" };

export default async function LoansPage() {
  const user = await requirePageUser("/banking/loans");
  const { applications, loans } = await listLoanActivity(user.id);

  return (
    <>
      <Link href="/banking" className={linkStyles} data-testid="loans-back-link">
        Back to accounts
      </Link>
      <div className="mt-4">
        <PageHeader
          title="Loans"
          description="Personal loans at a 1.20% monthly add-on rate. Simulated: no real money is lent."
          actions={
            <Link href="/banking/loans/apply" className={bankButton} data-testid="loans-apply-link">
              Apply for a loan
            </Link>
          }
          testId="loans"
        />
      </div>

      <section aria-labelledby="my-loans-heading" className="mb-8">
        <h2 id="my-loans-heading" className="mb-3 text-lg font-bold">My loans</h2>
        {loans.length === 0 ? (
          <EmptyState title="No loans yet" testId="loans-empty-state">
            Apply for a loan to see it here.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2" data-testid="loan-list">
            {loans.map((loan) => (
              <Link key={loan.id} href={`/banking/loans/${loan.id}`} className="group" data-testid={`loan-card-${loan.id}`}>
                <Card className="h-full space-y-2 p-5 transition-colors group-hover:border-emerald-700">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">Personal loan</h3>
                      <p className="font-mono text-xs text-muted">{loan.loanNumber}</p>
                    </div>
                    <StatusBadge status={loan.status} testId={`loan-status-${loan.id}`} />
                  </div>
                  <p className="text-sm">
                    Outstanding <span className="font-semibold" data-testid={`loan-outstanding-${loan.id}`}>{formatPeso(loan.outstandingCents)}</span> of{" "}
                    {formatPeso(loan.totalPayableCents)}
                  </p>
                  <p className="text-xs text-muted">
                    {loan.instalmentsPaid} of {loan.termMonths} instalments paid
                    {loan.nextInstalment ? ` · next ${formatPeso(loan.nextInstalment.amountCents)} due ${formatDisplayDate(loan.nextInstalment.dueDate)}` : ""}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="applications-heading">
        <h2 id="applications-heading" className="mb-3 text-lg font-bold">Applications</h2>
        {applications.length === 0 ? (
          <p className="text-sm text-muted" data-testid="loan-applications-empty">No applications yet.</p>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="loan-applications-table">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="p-3 font-medium">Reference</th>
                  <th scope="col" className="p-3 font-medium">Applied</th>
                  <th scope="col" className="p-3 text-right font-medium">Amount</th>
                  <th scope="col" className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b border-line last:border-0" data-testid={`loan-application-row-${application.id}`}>
                    <td className="p-3">
                      <Link href={`/banking/loans/applications/${application.id}`} className={linkStyles}>{application.referenceNumber}</Link>
                    </td>
                    <td className="whitespace-nowrap p-3 text-muted">{formatDisplayDateTime(application.createdAt)}</td>
                    <td className="p-3 text-right">{formatPeso(application.requestedAmountCents)}</td>
                    <td className="p-3"><StatusBadge status={application.status} testId={`loan-application-status-${application.id}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </>
  );
}
