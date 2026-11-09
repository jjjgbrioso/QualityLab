import Link from "next/link";
import type { ReactNode } from "react";
import { Amount } from "@/components/BalanceVisibility";
import { formatRate } from "@/lib/bank-products";
import { formatDisplayDate } from "@/lib/dates";
import { formatPeso } from "@/lib/money";
import type { AccountDto } from "@/lib/services/bank";

/** QualityLab Bank styling: deep green with a gold accent, shared by every banking screen. */
export const bankButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";
export const bankButtonOutline =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-800 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS: "Savings",
  CHECKING: "Checking",
  TIME_DEPOSIT: "Time deposit",
};

/** Shows only the last four digits, as banking apps do on overview screens. */
export function maskAccountNumber(accountNumber: string): string {
  return `•••• ${accountNumber.slice(-4)}`;
}

export function BankWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#facc15" />
        <path d="M6 10h12M7 10v6M12 10v6M17 10v6M5 17h14M12 5l7 4H5z" stroke="#064e3b" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      </svg>
      QualityLab Bank
    </span>
  );
}

export function QuickAction({ href, label, icon, testId }: { href: string; label: string; icon: ReactNode; testId: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl bg-surface p-3 text-center text-xs font-semibold text-ink ring-1 ring-line transition-colors hover:bg-emerald-50 hover:ring-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-800"
      data-testid={testId}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-900" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function AccountTile({ account }: { account: AccountDto }) {
  return (
    <Link
      href={`/banking/accounts/${account.id}`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
      data-testid={`account-card-${account.id}`}
    >
      <article className="flex h-full flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-5 text-white shadow-sm transition-shadow group-hover:shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">{account.name}</h2>
            <p className="text-xs text-emerald-100" data-testid={`account-number-${account.id}`}>
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · <span className="sr-only">Account number </span>
              <span aria-hidden="true">{maskAccountNumber(account.accountNumber)}</span>
              <span className="sr-only">ending {account.accountNumber.slice(-4)}</span>
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${account.status === "ACTIVE" ? "bg-emerald-100 text-emerald-900" : "bg-amber-200 text-amber-950"}`}
            data-testid={`account-status-${account.id}`}
          >
            {account.status}
          </span>
        </div>
        <div>
          <p className="text-xs text-emerald-100">Available balance</p>
          <p className="text-2xl font-bold" data-testid={`account-balance-${account.id}`}>
            <Amount value={formatPeso(account.balanceCents)} />
          </p>
          {account.type === "TIME_DEPOSIT" && account.maturityDate ? (
            <p className="mt-1 text-xs text-yellow-200" data-testid={`account-maturity-${account.id}`}>
              {account.termMonths}-month term at {formatRate(account.interestRateBps ?? 0)}. Matures {formatDisplayDate(account.maturityDate)}.
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export const icons = {
  transfer: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h14l-3-3M20 16H6l3 3" />
    </svg>
  ),
  deposit: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  ),
  withdraw: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  ),
  open: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};
