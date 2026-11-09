import Link from "next/link";
import { bankButton, bankButtonOutline } from "@/components/bank";

export function BankingNav() {
  return (
    <>
      <Link href="/banking/transfer" className={bankButton} data-testid="banking-transfer-link">
        Transfer
      </Link>
      <Link href="/banking/deposit" className={bankButtonOutline} data-testid="banking-deposit-link">
        Deposit
      </Link>
      <Link href="/banking/withdraw" className={bankButtonOutline} data-testid="banking-withdraw-link">
        Withdraw
      </Link>
      <Link href="/banking/accounts/new" className={bankButtonOutline} data-testid="banking-open-account-link">
        Open account
      </Link>
      <Link href="/banking/loans" className={bankButtonOutline} data-testid="banking-loans-link">
        Loans
      </Link>
    </>
  );
}
