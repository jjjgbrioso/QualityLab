import type { Metadata } from "next";
import Link from "next/link";
import { PayInstalmentForm } from "@/components/forms/LoanActions";
import { Alert, Card, linkStyles, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/dates";
import { formatPeso } from "@/lib/money";
import { loadForPage, type SearchParams } from "@/lib/page-helpers";
import { listAccounts } from "@/lib/services/bank";
import { getLoan } from "@/lib/services/loans";

export const metadata: Metadata = { title: "Loan" };

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-900",
  OVERDUE: "bg-red-100 text-red-900",
  UNPAID: "bg-canvas text-muted ring-1 ring-line",
};

export default async function LoanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const { id } = await params;
  const raw = await searchParams;
  const user = await requirePageUser(`/banking/loans/${id}`);
  const [loan, accounts] = await loadForPage(() => Promise.all([getLoan(user, id), listAccounts(user.id)]));

  return (
    <>
      <Link href="/banking/loans" className={linkStyles} data-testid="loan-back-link">
        Back to loans
      </Link>
      <div className="mt-4">
        <PageHeader
          title={`Loan ${loan.loanNumber}`}
          description={`${formatPeso(loan.principalCents)} over ${loan.termMonths} months, released ${formatDisplayDate(loan.releasedOn)}`}
          actions={<StatusBadge status={loan.status} testId="loan-status" />}
          testId="loan"
        />
      </div>

      {raw.released === "1" ? (
        <div className="mb-4">
          <Alert tone="success" testId="loan-released-notice">
            Your loan is released. {formatPeso(loan.netProceedsCents)} is now in your account, after the {formatPeso(loan.processingFeeCents)} processing fee.
          </Alert>
        </div>
      ) : null}
      {loan.status === "PAID_OFF" ? (
        <div className="mb-4">
          <Alert tone="success" testId="loan-paid-off-notice">This loan is fully paid. Thank you!</Alert>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-4" data-testid="loan-summary">
        {[
          { label: "Outstanding", value: formatPeso(loan.outstandingCents), testId: "loan-outstanding" },
          { label: "Monthly instalment", value: formatPeso(loan.monthlyInstalmentCents), testId: "loan-instalment" },
          { label: "Paid", value: `${loan.instalmentsPaid} of ${loan.termMonths}`, testId: "loan-paid-count" },
          { label: "Next due", value: loan.nextInstalment ? formatDisplayDate(loan.nextInstalment.dueDate) : "None", testId: "loan-next-due" },
        ].map((item) => (
          <Card key={item.testId} className="p-4">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="text-lg font-bold" data-testid={item.testId}>{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <table className="w-full text-left text-sm" data-testid="loan-schedule">
            <caption className="p-3 text-left font-semibold">Repayment schedule</caption>
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">No.</th>
                <th scope="col" className="p-3 font-medium">Due</th>
                <th scope="col" className="p-3 text-right font-medium">Principal</th>
                <th scope="col" className="p-3 text-right font-medium">Interest</th>
                <th scope="col" className="p-3 text-right font-medium">Amount</th>
                <th scope="col" className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loan.instalments.map((item) => (
                <tr key={item.number} className="border-b border-line last:border-0" data-testid={`loan-instalment-${item.number}`}>
                  <td className="p-3">{item.number}</td>
                  <td className="whitespace-nowrap p-3">{formatDisplayDate(item.dueDate)}</td>
                  <td className="p-3 text-right">{formatPeso(item.principalCents)}</td>
                  <td className="p-3 text-right">{formatPeso(item.interestCents)}</td>
                  <td className="p-3 text-right font-medium">{formatPeso(item.amountCents)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[item.status]}`} data-testid={`loan-instalment-status-${item.number}`}>
                      {item.status}
                    </span>
                    {item.paidAt ? <span className="block text-xs text-muted">{formatDisplayDateTime(item.paidAt)}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {loan.nextInstalment ? (
          <PayInstalmentForm loanId={loan.id} accounts={accounts} amountCents={loan.nextInstalment.amountCents} number={loan.nextInstalment.number} />
        ) : null}
      </div>
    </>
  );
}
