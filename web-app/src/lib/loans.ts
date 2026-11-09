import { addMonths } from "@/lib/dates";

/**
 * QualityLab Bank personal loans: fictional terms, modelled on how Philippine banks price
 * personal loans with a monthly add-on rate. Amounts are in centavos.
 */
export const LOAN_MIN_CENTS = 20_000_00;
export const LOAN_MAX_CENTS = 500_000_00;
export const LOAN_TERMS = [6, 12, 18, 24, 36] as const;
/** 1.20% a month, charged on the original amount for every month of the term. */
export const MONTHLY_ADD_ON_RATE_BPS = 120;
export const PROCESSING_FEE_CENTS = 1_500_00;

/** The credit check's limits. */
export const MIN_BORROWER_AGE = 21;
export const MAX_AGE_AT_MATURITY = 65;
export const MIN_MONTHLY_INCOME_CENTS = 15_000_00;
export const MAX_DEBT_TO_INCOME_PERCENT = 40;
export const MIN_APPROVAL_SCORE = 50;
export const MIN_GUARANTOR_INCOME_CENTS = 20_000_00;
/** Where a guarantor's address history needs a previous address too. */
export const MIN_YEARS_AT_ADDRESS = 2;

export type LoanQuote = {
  amountCents: number;
  termMonths: number;
  monthlyRateBps: number;
  totalInterestCents: number;
  totalPayableCents: number;
  monthlyInstalmentCents: number;
  processingFeeCents: number;
  netProceedsCents: number;
};

/** Add-on pricing: interest = amount x monthly rate x months, repaid in equal instalments. */
export function quoteLoan(amountCents: number, termMonths: number): LoanQuote {
  const totalInterestCents = Math.round((amountCents * MONTHLY_ADD_ON_RATE_BPS * termMonths) / 10_000);
  const totalPayableCents = amountCents + totalInterestCents;
  return {
    amountCents,
    termMonths,
    monthlyRateBps: MONTHLY_ADD_ON_RATE_BPS,
    totalInterestCents,
    totalPayableCents,
    monthlyInstalmentCents: Math.floor(amountCents / termMonths) + Math.floor(totalInterestCents / termMonths),
    processingFeeCents: PROCESSING_FEE_CENTS,
    netProceedsCents: amountCents - PROCESSING_FEE_CENTS,
  };
}

export type ScheduledInstalment = { number: number; dueDate: string; principalCents: number; interestCents: number; amountCents: number };

/** Equal instalments a month apart, starting a month after release. The last one takes any rounding. */
export function loanSchedule(amountCents: number, termMonths: number, releasedOn: string): ScheduledInstalment[] {
  const { totalInterestCents } = quoteLoan(amountCents, termMonths);
  const principal = Math.floor(amountCents / termMonths);
  const interest = Math.floor(totalInterestCents / termMonths);
  return Array.from({ length: termMonths }, (_, index) => {
    const last = index === termMonths - 1;
    const principalCents = last ? amountCents - principal * (termMonths - 1) : principal;
    const interestCents = last ? totalInterestCents - interest * (termMonths - 1) : interest;
    return { number: index + 1, dueDate: addMonths(releasedOn, index + 1), principalCents, interestCents, amountCents: principalCents + interestCents };
  });
}

export type CreditCheckInput = {
  amountCents: number;
  termMonths: number;
  borrowerAge: number;
  monthlyIncomeCents: number;
  otherLoanPaymentsCents: number;
  employmentMonths: number;
  missedPayments: boolean;
  legalIssues: boolean;
  residenceType: string;
  dependents: number;
  depositBalanceCents: number;
  guarantor: { monthlyIncomeCents: number; missedPayments: boolean } | null;
};

export type CreditDecision = {
  decision: "OFFERED" | "DECLINED";
  score: number;
  offeredAmountCents: number | null;
  counterOffer: boolean;
  debtToIncomePercent: number;
  reasons: string[];
};

const peso = (cents: number) => `₱${(cents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * A rule-based credit check, so every outcome can be reproduced from the inputs alone.
 * No credit bureau or real data is involved. Each rule adds a reason the applicant can read.
 */
export function creditCheck(input: CreditCheckInput): CreditDecision {
  const reasons: string[] = [];
  const quote = quoteLoan(input.amountCents, input.termMonths);
  const income = Math.max(input.monthlyIncomeCents, 1);
  const debtToIncomePercent = Math.round(((quote.monthlyInstalmentCents + input.otherLoanPaymentsCents) / income) * 100);
  const ageAtMaturity = input.borrowerAge + Math.ceil(input.termMonths / 12);

  const hardDeclines: string[] = [];
  if (input.borrowerAge < MIN_BORROWER_AGE) hardDeclines.push(`Borrowers must be at least ${MIN_BORROWER_AGE}.`);
  if (ageAtMaturity > MAX_AGE_AT_MATURITY) hardDeclines.push(`The loan would end after the borrower turns ${MAX_AGE_AT_MATURITY}.`);
  if (input.monthlyIncomeCents < MIN_MONTHLY_INCOME_CENTS) hardDeclines.push(`Monthly income is below ${peso(MIN_MONTHLY_INCOME_CENTS)}.`);
  if (input.legalIssues) hardDeclines.push("There is a pending court case or bankruptcy.");
  if (input.missedPayments && !input.guarantor) hardDeclines.push("Missed loan or card payments in the last 12 months, with no guarantor.");

  let score = 50;
  const factor = (points: number, text: string) => {
    score += points;
    reasons.push(`${points > 0 ? "+" : ""}${points}: ${text}`);
  };
  if (debtToIncomePercent <= 30) factor(20, `Loan payments would be ${debtToIncomePercent}% of income, which is 30% or less.`);
  else if (debtToIncomePercent <= MAX_DEBT_TO_INCOME_PERCENT) factor(10, `Loan payments would be ${debtToIncomePercent}% of income, which is 40% or less.`);
  else factor(0, `Loan payments would be ${debtToIncomePercent}% of income, above the ${MAX_DEBT_TO_INCOME_PERCENT}% limit.`);
  if (input.employmentMonths >= 24) factor(15, "Two years or more with the current employer or business.");
  else if (input.employmentMonths >= 12) factor(8, "One to two years with the current employer or business.");
  else if (input.employmentMonths < 6) factor(-10, "Less than six months with the current employer or business.");
  if (input.missedPayments) factor(-20, "Missed loan or card payments in the last 12 months.");
  if (input.residenceType === "OWNED") factor(5, "Owns their home.");
  else if (input.residenceType === "MORTGAGED") factor(3, "Is paying a home mortgage.");
  if (input.dependents >= 4) factor(-5, "Four or more dependents.");
  if (input.depositBalanceCents >= 10_000_00) factor(5, `Keeps ${peso(10_000_00)} or more with QualityLab Bank.`);
  if (input.guarantor) {
    if (input.guarantor.missedPayments) factor(-5, "The guarantor missed payments in the last 12 months.");
    else if (input.guarantor.monthlyIncomeCents >= MIN_GUARANTOR_INCOME_CENTS) factor(10, "A guarantor with a steady income.");
    else factor(0, `The guarantor's income is below ${peso(MIN_GUARANTOR_INCOME_CENTS)}, so it does not help.`);
  }
  score = Math.max(0, Math.min(100, score));

  const declined = (why: string[]): CreditDecision => ({
    decision: "DECLINED",
    score,
    offeredAmountCents: null,
    counterOffer: false,
    debtToIncomePercent,
    reasons: [...why, ...reasons],
  });

  if (hardDeclines.length > 0) return declined(hardDeclines);
  if (score < MIN_APPROVAL_SCORE) return declined([`The credit score of ${score} is below ${MIN_APPROVAL_SCORE}.`]);
  if (debtToIncomePercent <= MAX_DEBT_TO_INCOME_PERCENT) {
    return { decision: "OFFERED", score, offeredAmountCents: input.amountCents, counterOffer: false, debtToIncomePercent, reasons };
  }

  // Too much for the income: offer the largest amount, in steps of ₱1,000, that keeps payments at the limit.
  const room = Math.floor((income * MAX_DEBT_TO_INCOME_PERCENT) / 100) - input.otherLoanPaymentsCents;
  const perPeso = 1 / input.termMonths + MONTHLY_ADD_ON_RATE_BPS / 10_000;
  const affordable = Math.floor(room / perPeso / 1_000_00) * 1_000_00;
  if (affordable < LOAN_MIN_CENTS) {
    return declined([`Income cannot support the smallest loan of ${peso(LOAN_MIN_CENTS)} over ${input.termMonths} months.`]);
  }
  return {
    decision: "OFFERED",
    score,
    offeredAmountCents: Math.min(affordable, input.amountCents),
    counterOffer: true,
    debtToIncomePercent,
    reasons: [`We can lend ${peso(Math.min(affordable, input.amountCents))} instead, which keeps payments within ${MAX_DEBT_TO_INCOME_PERCENT}% of income.`, ...reasons],
  };
}
