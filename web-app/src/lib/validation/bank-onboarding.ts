import { z } from "zod";
import { BANK_PRODUCT_CODES, MAX_ONLINE_OPENING_CENTS, TIME_DEPOSIT_TERMS } from "@/lib/bank-products";
import { isValidDateOnly, todayUtc } from "@/lib/dates";
import { passwordField } from "@/lib/validation/auth";
import { requiredId, requiredText } from "@/lib/validation/common";

/**
 * The online account application, step by step. Every value is fictional test data.
 * The one-time PIN is always TEST_OTP, and an ID number ending in 0000 fails verification,
 * so automation can cover both outcomes.
 */
export const TEST_OTP = "123456";
export const FAILING_ID_SUFFIX = "0000";

export const ID_TYPES = ["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE", "UMID", "PRC_ID", "POSTAL_ID", "SSS_ID"] as const;
export const ID_TYPE_LABELS: Record<(typeof ID_TYPES)[number], string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  DRIVERS_LICENSE: "Driver's license",
  UMID: "UMID",
  PRC_ID: "PRC ID",
  POSTAL_ID: "Postal ID",
  SSS_ID: "SSS ID",
};
export const SEXES = ["FEMALE", "MALE"] as const;
export const CIVIL_STATUSES = ["SINGLE", "MARRIED", "WIDOWED", "SEPARATED"] as const;
export const EMPLOYMENT_STATUSES = ["EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED", "STUDENT", "RETIRED"] as const;
export const SOURCES_OF_FUNDS = ["SALARY", "BUSINESS", "REMITTANCE", "PENSION", "ALLOWANCE", "SAVINGS"] as const;
export const MONTHLY_INCOME_RANGES = ["BELOW_20K", "20K_50K", "50K_100K", "ABOVE_100K"] as const;
export const MONTHLY_INCOME_LABELS: Record<(typeof MONTHLY_INCOME_RANGES)[number], string> = {
  BELOW_20K: "Below ₱20,000",
  "20K_50K": "₱20,000 to ₱50,000",
  "50K_100K": "₱50,000 to ₱100,000",
  ABOVE_100K: "Above ₱100,000",
};

const MIN_AGE = 18;
const choice = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { error: `Choose a ${label}.` });
const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .optional()
    .transform((value) => (value ? value : undefined));
const dateOnly = (label: string) =>
  z.string({ error: `${label} is required.` }).refine(isValidDateOnly, `${label} must be a real date in YYYY-MM-DD form.`);

/** Years completed between two YYYY-MM-DD dates. */
export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

/** Accepts 09171234567, 9171234567, or +639171234567, and returns +639171234567. */
export const mobileNumber = z
  .string({ error: "Mobile number is required." })
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine((value) => /^(\+63|0)?9\d{9}$/.test(value), "Enter a Philippine mobile number, such as 0917 123 4567.")
  .transform((value) => `+63${value.slice(-10)}`);

export const consentStep = z.object({
  isAdult: z.literal(true, { error: "You must be 18 or older." }),
  isResident: z.literal(true, { error: "You must live in the Philippines." }),
  hasValidId: z.literal(true, { error: "You need a valid government ID." }),
  acceptsTerms: z.literal(true, { error: "Accept the terms and the privacy notice to continue." }),
});

export const contactStep = z.object({
  mobileNumber,
  email: z
    .string({ error: "Email is required." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.").max(254, "Email must be at most 254 characters.")),
});

export const otpSchema = z.object({
  otp: z.string({ error: "Enter the 6-digit PIN." }).trim().regex(/^\d{6}$/, "Enter the 6-digit PIN."),
});

export const personalStep = z.object({
  firstName: requiredText("First name", 50),
  middleName: optionalText("Middle name", 50),
  lastName: requiredText("Last name", 50),
  suffix: optionalText("Suffix", 10),
  birthDate: dateOnly("Birth date").refine((value) => ageOn(value, todayUtc()) >= MIN_AGE, `You must be at least ${MIN_AGE} years old.`),
  birthPlace: requiredText("Place of birth", 100),
  sex: choice(SEXES, "sex"),
  civilStatus: choice(CIVIL_STATUSES, "civil status"),
  nationality: requiredText("Nationality", 50),
  mothersMaidenName: requiredText("Mother's maiden name", 100),
});

export const addressStep = z.object({
  addressLine: requiredText("House number and street", 150),
  barangay: requiredText("Barangay", 100),
  city: requiredText("City or municipality", 100),
  province: requiredText("Province", 100),
  postalCode: z.string({ error: "ZIP code is required." }).trim().regex(/^\d{4}$/, "ZIP code must be 4 digits."),
});

export const workStep = z
  .object({
    employmentStatus: choice(EMPLOYMENT_STATUSES, "employment status"),
    employerName: optionalText("Employer or business name", 100),
    occupation: requiredText("Occupation", 100),
    sourceOfFunds: choice(SOURCES_OF_FUNDS, "source of funds"),
    monthlyIncome: choice(MONTHLY_INCOME_RANGES, "monthly income range"),
    tin: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined))
      .refine((value) => value === undefined || /^\d{3}-\d{3}-\d{3}(-\d{3})?$/.test(value), "TIN must look like 123-456-789 or 123-456-789-000."),
  })
  .refine((value) => !["EMPLOYED", "SELF_EMPLOYED"].includes(value.employmentStatus) || value.employerName, {
    path: ["employerName"],
    message: "Employer or business name is required when you work.",
  });

export const idStep = z
  .object({
    idType: choice(ID_TYPES, "valid ID"),
    idNumber: z
      .string({ error: "ID number is required." })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{6,20}$/, "ID number must be 6 to 20 letters, digits, or hyphens."),
    idExpiry: z
      .string()
      .optional()
      .transform((value) => (value ? value : undefined))
      .refine((value) => value === undefined || isValidDateOnly(value), "Expiry date must be a real date in YYYY-MM-DD form."),
    selfieVerified: z.literal(true, { error: "Complete the selfie check." }),
  })
  .refine((value) => value.idType === "NATIONAL_ID" || value.idExpiry, { path: ["idExpiry"], message: "Expiry date is required for this ID." })
  .refine((value) => !value.idExpiry || value.idExpiry > todayUtc(), { path: ["idExpiry"], message: "This ID has expired." });

const openingDeposit = z
  .number({ error: "Opening deposit is required." })
  .int("Opening deposit must be a whole number of centavos.")
  .positive("Opening deposit must be greater than zero.");

export const accountStep = z.object({
  product: z.enum(["STARTER_SAVINGS", "EVERYDAY_CHECKING"], { error: "Choose an account type." }),
  openingDepositCents: openingDeposit.max(MAX_ONLINE_OPENING_CENTS, "Online opening deposits are at most ₱50,000.00."),
});

export const loginStep = z.object({ password: passwordField });

/** The whole application, as the API receives it. Step rules are repeated so the API stands alone. */
export const bankApplicationSchema = z.object({
  consent: consentStep,
  contact: contactStep,
  otp: otpSchema.shape.otp,
  personal: personalStep,
  address: addressStep,
  work: workStep,
  identification: idStep,
  account: accountStep,
  password: passwordField,
});

export const otpVerifySchema = contactStep.extend(otpSchema.shape);

/** Opening another account as a signed-in customer, funded from one of their accounts. */
export const openAccountSchema = z
  .object({
    product: z.enum(BANK_PRODUCT_CODES, { error: "Choose an account type." }),
    sourceAccountId: requiredId("Funding account"),
    openingDepositCents: openingDeposit,
    termMonths: z
      .number()
      .int()
      .refine((value) => (TIME_DEPOSIT_TERMS as readonly number[]).includes(value), "Term must be 3, 6, or 12 months.")
      .optional(),
    nickname: optionalText("Nickname", 40),
  })
  .refine((value) => value.product !== "TIME_DEPOSIT" || value.termMonths !== undefined, {
    path: ["termMonths"],
    message: "Choose a term for the time deposit.",
  });

export type BankApplicationInput = z.infer<typeof bankApplicationSchema>;
// The nickname may be left out entirely, not only set to undefined.
export type OpenAccountInput = Omit<z.infer<typeof openAccountSchema>, "nickname"> & { nickname?: string };
