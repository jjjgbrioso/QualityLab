import type { Metadata } from "next";
import { BankTransactionForm } from "@/components/forms/BankTransactionForm";
import { PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { listAccounts } from "@/lib/services/bank";

export const metadata: Metadata = { title: "Deposit" };

export default async function DepositPage() {
  const user = await requirePageUser("/banking/deposit");
  const accounts = await listAccounts(user.id);

  return (
    <>
      <PageHeader title="Deposit" description="Add simulated money to one of your accounts." testId="deposit" />
      <BankTransactionForm kind="deposit" accounts={accounts} />
    </>
  );
}
