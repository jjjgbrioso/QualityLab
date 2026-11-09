import { z } from "zod";
import { isValidDateOnly } from "@/lib/dates";
import { LOAN_MAX_CENTS, LOAN_MIN_CENTS, LOAN_TERMS, MIN_YEARS_AT_ADDRESS } from "@/lib/loans";
import { addressStep, CIVIL_STATUSES, ID_TYPES, mobileNumber } from "@/lib/validation/bank-onboarding";
import { requiredId, requiredText } from "@/lib/validation/common";

/** The personal loan application. Every value is fictional test data. */
export const LOAN_PURPOSES = ["EDUCATION", "MEDICAL", "HOME_IMPROVEMENT", "BUSINESS", "TRAVEL", "DEBT_CONSOLIDATION", "OTHER"] as const;
export const RESIDENCE_TYPES = ["OWNED", "MORTGAGED", "RENTED", "LIVING_WITH_FAMILY", "COMPANY_PROVIDED"] as const;
export const LOAN_EMPLOYMENT_TYPES = ["EMPLOYED", "SELF_EMPLOYED", "OVERSEAS_WORKER", "RETIRED"] as const;
export const REPAYMENT_SOURCES = ["SALARY", "BUSINESS", "REMITTANCE", "PENSION"] as const;
export const GUARANTOR_RELATIONSHIPS = ["SPOUSE", "PARENT", "SIBLING", "CHILD", "RELATIVE", "FRIEND", "COLLEAGUE"] as const;

const choice = <T extends readonly [string, ...string[]]>(values: T, label: string) => z.enum(values, { error: `Choose ${label}.` });
const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .optional()
    .transform((value) => (value ? value : undefined));
const dateOnly = (label: string) =>
  z.string({ error: `${label} is required.` }).refine(isValidDateOnly, `${label} must be a real date in YYYY-MM-DD form.`);
const centavos = (label: string) =>
  z.number({ error: `${label} is required.` }).int(`${label} must be a whole number of centavos.`).min(0, `${label} cannot be negative.`);
const yesNo = (label: string) => z.boolean({ error: `Answer: ${label}` });
const wholeNumber = (label: string, max: number) =>
  z.number({ error: `${label} is required.` }).int(`${label} must be a whole number.`).min(0, `${label} cannot be negative.`).max(max, `${label} must be at most ${max}.`);

export const loanDetailsSchema = z.object({
  amountCents: z
    .number({ error: "Loan amount is required." })
    .int("Loan amount must be a whole number of centavos.")
    .min(LOAN_MIN_CENTS, "The smallest loan is ₱20,000.00.")
    .max(LOAN_MAX_CENTS, "The largest loan is ₱500,000.00."),
  termMonths: z
    .number({ error: "Choose a term." })
    .refine((value) => (LOAN_TERMS as readonly number[]).includes(value), "Term must be 6, 12, 18, 24, or 36 months."),
  purpose: choice(LOAN_PURPOSES, "a purpose"),
  purposeDetails: optionalText("Purpose details", 200),
});

const identity = {
  firstName: requiredText("First name", 50),
  middleName: optionalText("Middle name", 50),
  lastName: requiredText("Last name", 50),
  birthDate: dateOnly("Birth date"),
  mobileNumber,
  idType: choice(ID_TYPES, "an ID type"),
  idNumber: z
    .string({ error: "ID number is required." })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{6,20}$/, "ID number must be 6 to 20 letters, digits, or hyphens."),
};

export const borrowerSchema = z.object({
  ...identity,
  suffix: optionalText("Suffix", 10),
  civilStatus: choice(CIVIL_STATUSES, "a civil status"),
});

const currentAddress = addressStep.extend({
  yearsAtAddress: wholeNumber("Years at this address", 80),
  residenceType: choice(RESIDENCE_TYPES, "a residence type"),
});

/** The current address, plus the previous one when the applicant moved in less than two years ago. */
export const addressHistorySchema = z
  .object({ current: currentAddress, previous: addressStep.optional() })
  .refine((value) => value.current.yearsAtAddress >= MIN_YEARS_AT_ADDRESS || value.previous, {
    path: ["previous"],
    message: `Add your previous address. It is needed when you have lived at your current address for less than ${MIN_YEARS_AT_ADDRESS} years.`,
  });

export const employmentSchema = z.object({
  employmentType: choice(LOAN_EMPLOYMENT_TYPES, "an employment type"),
  employerName: requiredText("Employer, business, or pension source", 100),
  position: requiredText("Position or nature of business", 100),
  employmentMonths: wholeNumber("Months with this employer or business", 600),
  monthlyIncomeCents: centavos("Gross monthly income").positive("Gross monthly income must be greater than zero."),
});

/** The interview: questions a loan officer asks about spending, debts, and credit history. */
export const interviewSchema = z.object({
  monthlyExpensesCents: centavos("Monthly household expenses"),
  otherLoanPaymentsCents: centavos("Monthly payments on other loans and cards"),
  dependents: wholeNumber("Number of dependents", 20),
  repaymentSource: choice(REPAYMENT_SOURCES, "how you will repay"),
  missedPayments: yesNo("Have you missed a loan or credit card payment in the last 12 months?"),
  legalIssues: yesNo("Do you have a pending court case or bankruptcy?"),
  hasOtherBankLoans: yesNo("Do you have loans with other banks or lenders?"),
});

export const guarantorSchema = z
  .object({
    ...identity,
    relationship: choice(GUARANTOR_RELATIONSHIPS, "the guarantor's relationship to you"),
    email: z.string({ error: "Email is required." }).trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
    addresses: addressHistorySchema,
    employmentType: choice(LOAN_EMPLOYMENT_TYPES, "the guarantor's employment type"),
    employerName: requiredText("Guarantor's employer or business", 100),
    monthlyIncomeCents: centavos("Guarantor's gross monthly income").positive("Guarantor's gross monthly income must be greater than zero."),
    missedPayments: yesNo("Has the guarantor missed a loan or credit card payment in the last 12 months?"),
    consents: z.literal(true, { error: "The guarantor must agree to guarantee this loan." }),
  });

export const loanConsentsSchema = z.object({
  authorizesCreditCheck: z.literal(true, { error: "Allow the credit check to continue." }),
  confirmsTruthful: z.literal(true, { error: "Confirm that the details are true." }),
  acceptsPrivacy: z.literal(true, { error: "Accept the privacy notice to continue." }),
});

export const loanApplicationSchema = z
  .object({
    loan: loanDetailsSchema,
    borrower: borrowerSchema,
    addresses: addressHistorySchema,
    employment: employmentSchema,
    interview: interviewSchema,
    withGuarantor: z.boolean({ error: "Choose primary borrower only or with a guarantor." }),
    guarantor: guarantorSchema.optional(),
    consents: loanConsentsSchema,
  })
  .refine((value) => !value.withGuarantor || value.guarantor, { path: ["guarantor"], message: "Add the guarantor's details." })
  .refine((value) => !value.guarantor || value.guarantor.mobileNumber !== value.borrower.mobileNumber, {
    path: ["guarantor", "mobileNumber"],
    message: "The guarantor needs their own mobile number.",
  });

export const acceptOfferSchema = z.object({
  disbursementAccountId: requiredId("Account to receive the loan"),
  acceptsDisclosure: z.literal(true, { error: "Accept the disclosure statement and promissory note." }),
});

export const loanPaymentSchema = z.object({ fromAccountId: requiredId("Account to pay from") });

export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type AcceptOfferInput = z.infer<typeof acceptOfferSchema>;
export type LoanPaymentInput = z.infer<typeof loanPaymentSchema>;
