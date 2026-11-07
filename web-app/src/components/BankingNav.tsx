import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export function BankingNav() {
  return (
    <>
      <Link href="/banking/transfer" className={buttonStyles.primary} data-testid="banking-transfer-link">
        Transfer
      </Link>
      <Link href="/banking/deposit" className={buttonStyles.secondary} data-testid="banking-deposit-link">
        Deposit
      </Link>
      <Link href="/banking/withdraw" className={buttonStyles.secondary} data-testid="banking-withdraw-link">
        Withdraw
      </Link>
    </>
  );
}
