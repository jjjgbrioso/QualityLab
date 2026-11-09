import { describe, expect, it } from "vitest";
import { type CreditCheckInput, creditCheck, loanSchedule, quoteLoan } from "@/lib/loans";
import { addressHistorySchema, guarantorSchema, interviewSchema, loanApplicationSchema, loanDetailsSchema } from "@/lib/validation/loans";

const applicant = (overrides: Partial<CreditCheckInput> = {}): CreditCheckInput => ({
  amountCents: 100_000_00,
  termMonths: 12,
  borrowerAge: 31,
  monthlyIncomeCents: 80_000_00,
  otherLoanPaymentsCents: 0,
  employmentMonths: 36,
  missedPayments: false,
  legalIssues: false,
  residenceType: "OWNED",
  dependents: 1,
  depositBalanceCents: 12_500_00,
  guarantor: null,
  ...overrides,
});

describe("loan pricing", () => {
  it("prices with a 1.2% monthly add-on rate and a ₱1,500 fee", () => {
    expect(quoteLoan(100_000_00, 12)).toEqual({
      amountCents: 100_000_00,
      termMonths: 12,
      monthlyRateBps: 120,
      totalInterestCents: 14_400_00,
      totalPayableCents: 114_400_00,
      monthlyInstalmentCents: 9_533_33,
      processingFeeCents: 1_500_00,
      netProceedsCents: 98_500_00,
    });
  });

  it("builds a schedule that adds up exactly, a month apart", () => {
    const schedule = loanSchedule(100_000_00, 12, "2030-01-31");
    expect(schedule).toHaveLength(12);
    expect(schedule.reduce((sum, item) => sum + item.amountCents, 0)).toBe(114_400_00);
    expect(schedule.reduce((sum, item) => sum + item.principalCents, 0)).toBe(100_000_00);
    expect(schedule[0]).toMatchObject({ number: 1, dueDate: "2030-02-28", amountCents: 9_533_33 });
    expect(schedule[11]).toMatchObject({ number: 12, dueDate: "2031-01-31", amountCents: 9_533_37 });
  });
});

describe("credit check", () => {
  it("approves a strong applicant in full, with reasons", () => {
    const result = creditCheck(applicant());
    expect(result).toMatchObject({ decision: "OFFERED", score: 95, offeredAmountCents: 100_000_00, counterOffer: false, debtToIncomePercent: 12 });
    expect(result.reasons.some((reason) => reason.startsWith("+15"))).toBe(true);
  });

  it("offers a smaller amount when payments would pass 40% of income", () => {
    const result = creditCheck(applicant({ amountCents: 300_000_00, monthlyIncomeCents: 40_000_00 }));
    expect(result).toMatchObject({ decision: "OFFERED", counterOffer: true, offeredAmountCents: 167_000_00, debtToIncomePercent: 72 });
  });

  it("declines on hard rules", () => {
    expect(creditCheck(applicant({ monthlyIncomeCents: 12_000_00 })).reasons[0]).toContain("below ₱15,000.00");
    expect(creditCheck(applicant({ borrowerAge: 20 })).decision).toBe("DECLINED");
    expect(creditCheck(applicant({ borrowerAge: 63, termMonths: 36 })).reasons[0]).toContain("turns 65");
    expect(creditCheck(applicant({ legalIssues: true })).decision).toBe("DECLINED");
    expect(creditCheck(applicant({ missedPayments: true })).reasons[0]).toContain("no guarantor");
  });

  it("lets a guarantor rescue missed payments, and a weak guarantor does not help", () => {
    const strong = creditCheck(applicant({ missedPayments: true, guarantor: { monthlyIncomeCents: 50_000_00, missedPayments: false } }));
    expect(strong).toMatchObject({ decision: "OFFERED", score: 85 });
    const weak = creditCheck(applicant({ missedPayments: true, guarantor: { monthlyIncomeCents: 10_000_00, missedPayments: false } }));
    expect(weak.score).toBe(75);
  });

  it("declines a low score and an income too small for any loan", () => {
    const low = creditCheck(applicant({ employmentMonths: 3, residenceType: "RENTED", dependents: 5, depositBalanceCents: 0, missedPayments: true, guarantor: { monthlyIncomeCents: 5_000_00, missedPayments: true }, amountCents: 20_000_00, monthlyIncomeCents: 15_000_00 }));
    expect(low.decision).toBe("DECLINED");
    expect(low.reasons[0]).toContain("below 50");
    const tooSmall = creditCheck(applicant({ amountCents: 100_000_00, monthlyIncomeCents: 16_000_00, otherLoanPaymentsCents: 6_000_00 }));
    expect(tooSmall).toMatchObject({ decision: "DECLINED" });
    expect(tooSmall.reasons[0]).toContain("smallest loan");
  });
});

describe("loan application validation", () => {
  const address = { addressLine: "12 Mabini St", barangay: "San Isidro", city: "Makati", province: "Metro Manila", postalCode: "1234" };

  it("limits amount and term", () => {
    expect(loanDetailsSchema.safeParse({ amountCents: 19_999_00, termMonths: 12, purpose: "MEDICAL" }).success).toBe(false);
    expect(loanDetailsSchema.safeParse({ amountCents: 500_000_01, termMonths: 12, purpose: "MEDICAL" }).success).toBe(false);
    expect(loanDetailsSchema.safeParse({ amountCents: 50_000_00, termMonths: 10, purpose: "MEDICAL" }).success).toBe(false);
    expect(loanDetailsSchema.safeParse({ amountCents: 50_000_00, termMonths: 36, purpose: "MEDICAL" }).success).toBe(true);
  });

  it("needs a previous address under two years at the current one", () => {
    const current = { ...address, yearsAtAddress: 1, residenceType: "RENTED" };
    const missing = addressHistorySchema.safeParse({ current });
    expect(missing.success).toBe(false);
    expect(missing.error!.issues[0].path).toEqual(["previous"]);
    expect(addressHistorySchema.safeParse({ current, previous: address }).success).toBe(true);
    expect(addressHistorySchema.safeParse({ current: { ...current, yearsAtAddress: 2 } }).success).toBe(true);
  });

  it("needs every interview question answered", () => {
    const answers = { monthlyExpensesCents: 20_000_00, otherLoanPaymentsCents: 0, dependents: 1, repaymentSource: "SALARY", missedPayments: false, legalIssues: false, hasOtherBankLoans: false };
    expect(interviewSchema.safeParse(answers).success).toBe(true);
    expect(interviewSchema.safeParse({ ...answers, missedPayments: undefined }).success).toBe(false);
  });

  it("needs a guarantor's details when applying with one, with their own mobile", () => {
    const base = {
      loan: { amountCents: 50_000_00, termMonths: 12, purpose: "MEDICAL" },
      borrower: { firstName: "A", lastName: "B", birthDate: "1990-01-01", civilStatus: "SINGLE", mobileNumber: "09171234567", idType: "NATIONAL_ID", idNumber: "1234-5678" },
      addresses: { current: { ...address, yearsAtAddress: 5, residenceType: "OWNED" } },
      employment: { employmentType: "EMPLOYED", employerName: "Sample Corp", position: "Engineer", employmentMonths: 24, monthlyIncomeCents: 50_000_00 },
      interview: { monthlyExpensesCents: 0, otherLoanPaymentsCents: 0, dependents: 0, repaymentSource: "SALARY", missedPayments: false, legalIssues: false, hasOtherBankLoans: false },
      consents: { authorizesCreditCheck: true, confirmsTruthful: true, acceptsPrivacy: true },
    };
    expect(loanApplicationSchema.safeParse({ ...base, withGuarantor: false }).success).toBe(true);
    expect(loanApplicationSchema.safeParse({ ...base, withGuarantor: true }).success).toBe(false);
    const guarantor = {
      firstName: "C", lastName: "D", relationship: "PARENT", birthDate: "1965-01-01", mobileNumber: "0917 123 4567", email: "c@qualitylab.test",
      idType: "PASSPORT", idNumber: "P1234567", addresses: { current: { ...address, yearsAtAddress: 10, residenceType: "OWNED" } },
      employmentType: "EMPLOYED", employerName: "X", monthlyIncomeCents: 60_000_00, missedPayments: false, consents: true,
    };
    expect(guarantorSchema.safeParse(guarantor).success).toBe(true);
    const same = loanApplicationSchema.safeParse({ ...base, withGuarantor: true, guarantor });
    expect(same.success).toBe(false);
    expect(same.error!.issues[0].path).toEqual(["guarantor", "mobileNumber"]);
  });
});
