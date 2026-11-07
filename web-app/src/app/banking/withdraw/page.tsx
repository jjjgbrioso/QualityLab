import type { Metadata } from "next";
import { BankTransactionForm } from "@/components/forms/BankTransactionForm";
import { PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { listAccounts } from "@/lib/services/bank";

export const metadata: Metadata = { title: "Withdraw" };

export default async function WithdrawPage() {
  const user = await requirePageUser("/banking/withdraw");
  const accounts = await listAccounts(user.id);

  return (
    <>
      <PageHeader title="Withdraw" description="Take simulated money out of one of your accounts." testId="withdrawal" />
      <BankTransactionForm kind="withdrawal" accounts={accounts} />
    </>
  );
}
