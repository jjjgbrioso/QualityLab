import type { Metadata } from "next";
import Link from "next/link";
import { LoanApplicationForm } from "@/components/forms/LoanApplicationForm";
import type { FormValues } from "@/components/forms/wizard";
import { Alert, linkStyles, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Apply for a loan" };

export default async function ApplyForLoanPage() {
  const user = await requirePageUser("/banking/loans/apply");
  const [profile, open] = await Promise.all([
    prisma.customerProfile.findUnique({ where: { userId: user.id } }),
    prisma.loanApplication.findFirst({ where: { userId: user.id, status: "OFFERED" } }),
  ]);

  // Details from the account application are filled in, so the borrower only checks them.
  const initial: FormValues = {
    firstName: user.firstName,
    lastName: user.lastName,
    ...(profile
      ? {
          middleName: profile.middleName ?? "",
          suffix: profile.suffix ?? "",
          birthDate: formatDateOnly(profile.birthDate),
          civilStatus: profile.civilStatus,
          mobileNumber: `0${profile.mobileNumber.slice(-10)}`,
          idType: profile.idType,
          idNumber: profile.idNumber,
          "current.addressLine": profile.addressLine,
          "current.barangay": profile.barangay,
          "current.city": profile.city,
          "current.province": profile.province,
          "current.postalCode": profile.postalCode,
          employerName: profile.employerName ?? "",
          position: profile.occupation,
        }
      : {}),
  };

  return (
    <>
      <Link href="/banking/loans" className={linkStyles} data-testid="loan-apply-back-link">
        Back to loans
      </Link>
      <div className="mt-4">
        <PageHeader
          title="Apply for a personal loan"
          description="₱20,000 to ₱500,000 over 6 to 36 months. You get a decision as soon as you submit."
          testId="loan-apply"
        />
      </div>
      {open ? (
        <Alert tone="warning" testId="loan-apply-open-offer">
          Application {open.referenceNumber} has an offer waiting.{" "}
          <Link href={`/banking/loans/applications/${open.id}`} className="font-semibold underline">
            Accept or decline it
          </Link>{" "}
          before applying again.
        </Alert>
      ) : (
        <LoanApplicationForm initial={initial} />
      )}
    </>
  );
}
