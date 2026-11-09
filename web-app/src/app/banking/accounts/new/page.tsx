import type { Metadata } from "next";
import Link from "next/link";
import { OpenAccountForm } from "@/components/forms/OpenAccountForm";
import { linkStyles, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { listAccounts } from "@/lib/services/bank";

export const metadata: Metadata = { title: "Open an account" };

export default async function OpenAnotherAccountPage() {
  const user = await requirePageUser("/banking/accounts/new");
  const accounts = await listAccounts(user.id);

  return (
    <>
      <Link href="/banking" className={linkStyles} data-testid="open-account-back-link">
        Back to accounts
      </Link>
      <div className="mt-4">
        <PageHeader
          title="Open another account"
          description="Choose a savings, checking, or time deposit account and fund it from one of your accounts."
          testId="open-account"
        />
      </div>
      <OpenAccountForm accounts={accounts} />
    </>
  );
}
