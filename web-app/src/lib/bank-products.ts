/**
 * QualityLab Bank's fictional deposit products. Amounts are in centavos.
 * The rates are display values only: the demo does not pay interest.
 */
export const BANK_PRODUCT_CODES = ["STARTER_SAVINGS", "EVERYDAY_CHECKING", "TIME_DEPOSIT"] as const;
export type BankProductCode = (typeof BANK_PRODUCT_CODES)[number];

export type BankProduct = {
  code: BankProductCode;
  name: string;
  type: "SAVINGS" | "CHECKING" | "TIME_DEPOSIT";
  summary: string;
  minimumOpeningCents: number;
  maintainingBalanceCents: number;
  /** Annual rate in basis points, by term for time deposits. */
  ratesBps: Record<number, number>;
  /** Whether a new customer can choose it in the online application. */
  forNewCustomers: boolean;
};

export const TIME_DEPOSIT_TERMS = [3, 6, 12] as const;

export const BANK_PRODUCTS: Record<BankProductCode, BankProduct> = {
  STARTER_SAVINGS: {
    code: "STARTER_SAVINGS",
    name: "Starter Savings",
    type: "SAVINGS",
    summary: "Low opening deposit and no maintaining balance. Good for a first account.",
    minimumOpeningCents: 100_00,
    maintainingBalanceCents: 0,
    ratesBps: { 0: 25 },
    forNewCustomers: true,
  },
  EVERYDAY_CHECKING: {
    code: "EVERYDAY_CHECKING",
    name: "Everyday Checking",
    type: "CHECKING",
    summary: "For regular payments and transfers.",
    minimumOpeningCents: 5_000_00,
    maintainingBalanceCents: 5_000_00,
    ratesBps: { 0: 0 },
    forNewCustomers: true,
  },
  TIME_DEPOSIT: {
    code: "TIME_DEPOSIT",
    name: "Time Deposit",
    type: "TIME_DEPOSIT",
    summary: "A fixed placement for 3, 6, or 12 months. The money is locked until the maturity date.",
    minimumOpeningCents: 10_000_00,
    maintainingBalanceCents: 0,
    ratesBps: { 3: 300, 6: 325, 12: 350 },
    forNewCustomers: false,
  },
};

/** The most a new customer can deposit when opening an account online. */
export const MAX_ONLINE_OPENING_CENTS = 50_000_00;

export function formatRate(bps: number): string {
  return `${(bps / 100).toFixed(2)}% a year`;
}
