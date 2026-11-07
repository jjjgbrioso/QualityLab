import type { Metadata } from "next";
import { BankTransactionForm } from "@/components/forms/BankTransactionForm";
import { PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { listAccounts } from "@/lib/services/bank";

export const metadata: Metadata = { title: "Transfer" };

export default async function TransferPage() {
  const user = await requirePageUser("/banking/transfer");
  const accounts = await listAccounts(user.id);

  return (
    <>
      <PageHeader title="Transfer" description="Move simulated money between test accounts." testId="transfer" />
      <BankTransactionForm kind="transfer" accounts={accounts} />
    </>
  );
}
