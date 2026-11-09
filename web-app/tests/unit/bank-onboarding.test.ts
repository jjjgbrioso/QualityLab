import { describe, expect, it } from "vitest";
import { addMonths } from "@/lib/dates";
import { formatPeso } from "@/lib/money";
import {
  accountStep,
  addressStep,
  ageOn,
  bankApplicationSchema,
  contactStep,
  idStep,
  mobileNumber,
  openAccountSchema,
  personalStep,
  workStep,
} from "@/lib/validation/bank-onboarding";

const fails = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }, field: string) =>
  result.success === false && result.error!.issues.some((issue) => issue.path.join(".") === field);

describe("pesos and dates", () => {
  it("formats centavos as Philippine pesos", () => {
    expect(formatPeso(250_000)).toBe("₱2,500.00");
    expect(formatPeso(5)).toBe("₱0.05");
  });

  it("adds months without overflowing short months", () => {
    expect(addMonths("2030-01-31", 1)).toBe("2030-02-28");
    expect(addMonths("2030-11-15", 3)).toBe("2031-02-15");
    expect(addMonths("2032-08-31", 6)).toBe("2033-02-28");
  });

  it("counts completed years", () => {
    expect(ageOn("2008-11-09", "2026-11-09")).toBe(18);
    expect(ageOn("2008-11-10", "2026-11-09")).toBe(17);
  });
});

describe("contact step", () => {
  it("normalises Philippine mobile numbers", () => {
    for (const input of ["09171234567", "9171234567", "+639171234567", "0917 123 4567", "0917-123-4567"]) {
      expect(mobileNumber.parse(input), input).toBe("+639171234567");
    }
  });

  it("rejects numbers that are not Philippine mobiles", () => {
    for (const input of ["0817123456", "091712345678", "+11234567890", "02 8123 4567", ""]) {
      expect(mobileNumber.safeParse(input).success, input).toBe(false);
    }
    expect(fails(contactStep.safeParse({ mobileNumber: "09171234567", email: "nope" }), "email")).toBe(true);
  });
});

describe("personal and address steps", () => {
  const person = {
    firstName: "Maria",
    lastName: "Santos",
    birthDate: "1995-06-15",
    birthPlace: "Quezon City",
    sex: "FEMALE",
    civilStatus: "SINGLE",
    nationality: "Filipino",
    mothersMaidenName: "Reyes",
  };

  it("accepts a complete adult applicant and drops blank optional fields", () => {
    const parsed = personalStep.parse({ ...person, middleName: "  ", suffix: "" });
    expect(parsed.middleName).toBeUndefined();
    expect(parsed.suffix).toBeUndefined();
  });

  it("rejects applicants under 18 and impossible dates", () => {
    const year = new Date().getUTCFullYear();
    expect(fails(personalStep.safeParse({ ...person, birthDate: `${year - 10}-01-01` }), "birthDate")).toBe(true);
    expect(fails(personalStep.safeParse({ ...person, birthDate: "1995-02-30" }), "birthDate")).toBe(true);
    expect(fails(personalStep.safeParse({ ...person, sex: "OTHER" }), "sex")).toBe(true);
  });

  it("needs a 4-digit ZIP code", () => {
    const address = { addressLine: "12 Mabini St", barangay: "San Isidro", city: "Makati", province: "Metro Manila", postalCode: "1234" };
    expect(addressStep.safeParse(address).success).toBe(true);
    expect(fails(addressStep.safeParse({ ...address, postalCode: "123" }), "postalCode")).toBe(true);
  });
});

describe("work, ID, and account steps", () => {
  it("requires an employer only for people who work", () => {
    const base = { occupation: "Engineer", sourceOfFunds: "SALARY", monthlyIncome: "20K_50K" };
    expect(fails(workStep.safeParse({ ...base, employmentStatus: "EMPLOYED" }), "employerName")).toBe(true);
    expect(workStep.safeParse({ ...base, employmentStatus: "STUDENT" }).success).toBe(true);
    expect(fails(workStep.safeParse({ ...base, employmentStatus: "STUDENT", tin: "12345" }), "tin")).toBe(true);
    expect(workStep.safeParse({ ...base, employmentStatus: "STUDENT", tin: "123-456-789-000" }).success).toBe(true);
  });

  it("needs an unexpired ID and a selfie check, with no expiry for the National ID", () => {
    expect(idStep.safeParse({ idType: "NATIONAL_ID", idNumber: "1234-5678-9012", selfieVerified: true }).success).toBe(true);
    expect(fails(idStep.safeParse({ idType: "PASSPORT", idNumber: "P1234567A", selfieVerified: true }), "idExpiry")).toBe(true);
    expect(fails(idStep.safeParse({ idType: "PASSPORT", idNumber: "P1234567A", idExpiry: "2001-01-01", selfieVerified: true }), "idExpiry")).toBe(true);
    expect(fails(idStep.safeParse({ idType: "NATIONAL_ID", idNumber: "1234-5678-9012", selfieVerified: false }), "selfieVerified")).toBe(true);
    expect(fails(idStep.safeParse({ idType: "NATIONAL_ID", idNumber: "12", selfieVerified: true }), "idNumber")).toBe(true);
  });

  it("limits online opening deposits and new-customer products", () => {
    expect(accountStep.safeParse({ product: "STARTER_SAVINGS", openingDepositCents: 50_000_00 }).success).toBe(true);
    expect(fails(accountStep.safeParse({ product: "STARTER_SAVINGS", openingDepositCents: 50_000_01 }), "openingDepositCents")).toBe(true);
    expect(fails(accountStep.safeParse({ product: "TIME_DEPOSIT", openingDepositCents: 10_000_00 }), "product")).toBe(true);
  });

  it("needs a term for a time deposit", () => {
    const base = { product: "TIME_DEPOSIT", sourceAccountId: "acct", openingDepositCents: 10_000_00 };
    expect(fails(openAccountSchema.safeParse(base), "termMonths")).toBe(true);
    expect(fails(openAccountSchema.safeParse({ ...base, termMonths: 4 }), "termMonths")).toBe(true);
    expect(openAccountSchema.safeParse({ ...base, termMonths: 6 }).success).toBe(true);
  });

  it("reports nested field paths for the whole application", () => {
    const result = bankApplicationSchema.safeParse({});
    expect(fails(result, "consent")).toBe(true);
    expect(fails(result, "password")).toBe(true);
  });
});
