import type { Metadata } from "next";
import Link from "next/link";
import { LoanOfferActions } from "@/components/forms/LoanActions";
import { Alert, Card, linkStyles, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatPeso } from "@/lib/money";
import { loadForPage } from "@/lib/page-helpers";
import { listAccounts } from "@/lib/services/bank";
import { getLoanApplication } from "@/lib/services/loans";

export const metadata: Metadata = { title: "Loan decision" };

export default async function LoanApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(`/banking/loans/applications/${id}`);
  const [application, accounts] = await loadForPage(() => Promise.all([getLoanApplication(user, id), listAccounts(user.id)]));
  const offer = application.offer;

  return (
    <>
      <Link href="/banking/loans" className={linkStyles} data-testid="loan-decision-back-link">
        Back to loans
      </Link>
      <div className="mt-4">
        <PageHeader
          title={`Application ${application.referenceNumber}`}
          description={`${formatPeso(application.requestedAmountCents)} over ${application.termMonths} months · ${application.withGuarantor ? `with guarantor ${application.guarantorName}` : "primary borrower only"}`}
          actions={<StatusBadge status={application.status} testId="loan-decision-status" />}
          testId="loan-decision"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {application.status === "DECLINED" ? (
            <Alert tone="error" testId="loan-decision-declined">
              We cannot offer a loan this time. The reasons are listed under the credit check.
            </Alert>
          ) : application.status === "CANCELLED" ? (
            <Alert tone="info" testId="loan-decision-cancelled">You declined this offer.</Alert>
          ) : application.status === "AVAILED" && application.loanId ? (
            <Alert tone="success" testId="loan-decision-availed">
              You accepted this offer.{" "}
              <Link href={`/banking/loans/${application.loanId}`} className="font-semibold underline" data-testid="loan-decision-loan-link">
                View your loan
              </Link>
            </Alert>
          ) : (
            <Alert tone="success" testId="loan-decision-offered">
              {application.counterOffer
                ? `Approved for a smaller amount: ${formatPeso(application.offeredAmountCents ?? 0)} instead of ${formatPeso(application.requestedAmountCents)}.`
                : `Approved for ${formatPeso(application.offeredAmountCents ?? 0)}.`}
            </Alert>
          )}

          {offer ? (
            <Card className="p-6" testId="loan-disclosure">
              <h2 className="mb-3 text-lg font-bold">Disclosure statement</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">Loan amount</dt>
                <dd data-testid="loan-offer-amount">{formatPeso(offer.amountCents)}</dd>
                <dt className="text-muted">Term</dt>
                <dd>{offer.termMonths} monthly instalments</dd>
                <dt className="text-muted">Add-on rate</dt>
                <dd>{(offer.monthlyRateBps / 100).toFixed(2)}% a month</dd>
                <dt className="text-muted">Total interest</dt>
                <dd data-testid="loan-offer-interest">{formatPeso(offer.totalInterestCents)}</dd>
                <dt className="text-muted">Total to repay</dt>
                <dd data-testid="loan-offer-total">{formatPeso(offer.totalPayableCents)}</dd>
                <dt className="text-muted">Monthly instalment</dt>
                <dd className="font-semibold" data-testid="loan-offer-instalment">{formatPeso(offer.monthlyInstalmentCents)}</dd>
                <dt className="text-muted">Processing fee, deducted</dt>
                <dd>{formatPeso(offer.processingFeeCents)}</dd>
                <dt className="text-muted">Amount you receive</dt>
                <dd className="font-semibold" data-testid="loan-offer-net">{formatPeso(offer.netProceedsCents)}</dd>
              </dl>
              <p className="mt-3 text-xs text-muted">The last instalment may differ by a few centavos so the total comes out exact.</p>
            </Card>
          ) : null}

          {application.status === "OFFERED" && offer ? (
            <LoanOfferActions applicationId={application.id} accounts={accounts} netProceedsCents={offer.netProceedsCents} />
          ) : null}
        </div>

        <Card className="h-fit space-y-3 p-5" testId="loan-credit-check">
          <h2 className="font-semibold">Credit check</h2>
          <p className="text-3xl font-extrabold" data-testid="loan-credit-score">
            {application.creditScore}
            <span className="text-base font-medium text-muted"> / 100</span>
          </p>
          <p className="text-sm text-muted" data-testid="loan-credit-dti">
            Loan payments would be {application.debtToIncomePercent}% of monthly income. The limit is 40%.
          </p>
          <ul className="space-y-1 text-sm" data-testid="loan-credit-reasons">
            {application.decisionReasons.map((reason) => (
              <li key={reason} className="rounded-md bg-canvas px-2 py-1">{reason}</li>
            ))}
          </ul>
          <p className="text-xs text-muted">Simulated with fixed rules. No credit bureau is contacted.</p>
        </Card>
      </div>
    </>
  );
}
