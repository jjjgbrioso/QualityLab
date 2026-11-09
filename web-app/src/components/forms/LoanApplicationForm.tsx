"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { bankButton, bankButtonOutline } from "@/components/bank";
import { Field, SelectField } from "@/components/forms/fields";
import { checkStep, CheckboxField, type FieldErrors, type FormValues, readForm, StepProgress, YesNoField, yesNoValue } from "@/components/forms/wizard";
import { Alert, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useHydrated } from "@/lib/client/use-submit";
import { LOAN_TERMS, MIN_YEARS_AT_ADDRESS, quoteLoan } from "@/lib/loans";
import { dollarsToCents, formatPeso } from "@/lib/money";
import { CIVIL_STATUSES, ID_TYPE_LABELS, ID_TYPES } from "@/lib/validation/bank-onboarding";
import {
  addressHistorySchema,
  borrowerSchema,
  employmentSchema,
  GUARANTOR_RELATIONSHIPS,
  guarantorSchema,
  interviewSchema,
  LOAN_EMPLOYMENT_TYPES,
  LOAN_PURPOSES,
  loanConsentsSchema,
  loanDetailsSchema,
  REPAYMENT_SOURCES,
  RESIDENCE_TYPES,
} from "@/lib/validation/loans";

const STEPS = ["Loan", "Borrower", "Address", "Work and income", "Interview", "Guarantor", "Consent and review"] as const;
const ADDRESS_FIELDS = ["addressLine", "barangay", "city", "province", "postalCode"] as const;
const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
const pesos = (value: string | boolean | undefined) => (typeof value === "string" ? dollarsToCents(value) ?? undefined : undefined);
const num = (value: string | boolean | undefined) => (typeof value === "string" && value.trim() !== "" && /^\d+$/.test(value.trim()) ? Number(value) : undefined);
const text = (value: string | boolean | undefined) => (typeof value === "string" ? value : undefined);

/** Builds the address history for a prefix ("" for the borrower, "g." for the guarantor). */
function addresses(values: FormValues, prefix: string) {
  const pick = (part: string) => Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, text(values[`${prefix}${part}.${field}`])]));
  const years = num(values[`${prefix}current.yearsAtAddress`]);
  return {
    current: { ...pick("current"), yearsAtAddress: years, residenceType: text(values[`${prefix}current.residenceType`]) },
    previous: years !== undefined && years < MIN_YEARS_AT_ADDRESS ? pick("previous") : undefined,
  };
}

function guarantor(values: FormValues) {
  const g = (field: string) => values[`g.${field}`];
  return {
    firstName: text(g("firstName")),
    middleName: text(g("middleName")),
    lastName: text(g("lastName")),
    relationship: text(g("relationship")),
    birthDate: text(g("birthDate")),
    mobileNumber: text(g("mobileNumber")),
    email: text(g("email")),
    idType: text(g("idType")),
    idNumber: text(g("idNumber")),
    addresses: addresses(values, "g."),
    employmentType: text(g("employmentType")),
    employerName: text(g("employerName")),
    monthlyIncomeCents: pesos(g("monthlyIncome")),
    missedPayments: yesNoValue(g("missedPayments")),
    consents: g("consents") === true,
  };
}

function payload(values: FormValues) {
  return {
    loan: {
      amountCents: pesos(values.amount),
      termMonths: num(values.termMonths),
      purpose: text(values.purpose),
      purposeDetails: text(values.purposeDetails),
    },
    borrower: {
      firstName: text(values.firstName),
      middleName: text(values.middleName),
      lastName: text(values.lastName),
      suffix: text(values.suffix),
      birthDate: text(values.birthDate),
      civilStatus: text(values.civilStatus),
      mobileNumber: text(values.mobileNumber),
      idType: text(values.idType),
      idNumber: text(values.idNumber),
    },
    addresses: addresses(values, ""),
    employment: {
      employmentType: text(values.employmentType),
      employerName: text(values.employerName),
      position: text(values.position),
      employmentMonths: num(values.employmentMonths),
      monthlyIncomeCents: pesos(values.monthlyIncome),
    },
    interview: {
      monthlyExpensesCents: pesos(values.monthlyExpenses),
      otherLoanPaymentsCents: pesos(values.otherLoanPayments),
      dependents: num(values.dependents),
      repaymentSource: text(values.repaymentSource),
      missedPayments: yesNoValue(values.missedPayments),
      legalIssues: yesNoValue(values.legalIssues),
      hasOtherBankLoans: yesNoValue(values.hasOtherBankLoans),
    },
    withGuarantor: values.withGuarantor === "yes" ? true : values.withGuarantor === "no" ? false : undefined,
    guarantor: values.withGuarantor === "yes" ? guarantor(values) : undefined,
    consents: {
      authorizesCreditCheck: values.authorizesCreditCheck === true,
      confirmsTruthful: values.confirmsTruthful === true,
      acceptsPrivacy: values.acceptsPrivacy === true,
    },
  };
}

type Result = { id: string };

export function LoanApplicationForm({ initial }: { initial: FormValues }) {
  const router = useRouter();
  const ready = useHydrated();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>({ termMonths: "12", withGuarantor: "no", ...initial });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Live values that change what the form shows.
  const [years, setYears] = useState(String(values["current.yearsAtAddress"] ?? ""));
  const [guarantorYears, setGuarantorYears] = useState(String(values["g.current.yearsAtAddress"] ?? ""));
  const [withGuarantor, setWithGuarantor] = useState(values.withGuarantor === "yes");
  const [amount, setAmount] = useState(String(values.amount ?? ""));
  const [term, setTerm] = useState(String(values.termMonths ?? "12"));

  const v = (key: string) => (typeof values[key] === "string" ? (values[key] as string) : "");
  const err = (key: string) => errors[key];
  const showPrevious = years.trim() !== "" && Number(years) < MIN_YEARS_AT_ADDRESS;
  const showGuarantorPrevious = guarantorYears.trim() !== "" && Number(guarantorYears) < MIN_YEARS_AT_ADDRESS;
  const amountCents = dollarsToCents(amount);
  const estimate = amountCents && amountCents > 0 ? quoteLoan(amountCents, Number(term)) : null;

  function go(to: number) {
    setErrors({});
    setFormError(null);
    setStep(to);
    window.scrollTo({ top: 0 });
  }

  function validate(all: FormValues): FieldErrors {
    const body = payload(all);
    switch (step) {
      case 0: {
        const found = checkStep(loanDetailsSchema, body.loan).errors;
        return Object.fromEntries(Object.entries(found).map(([key, message]) => [key === "amountCents" ? "amount" : key, message]));
      }
      case 1:
        return checkStep(borrowerSchema, body.borrower).errors;
      case 2:
        return checkStep(addressHistorySchema, body.addresses).errors;
      case 3: {
        const found = checkStep(employmentSchema, body.employment).errors;
        return Object.fromEntries(Object.entries(found).map(([key, message]) => [key === "monthlyIncomeCents" ? "monthlyIncome" : key, message]));
      }
      case 4: {
        const found = checkStep(interviewSchema, body.interview).errors;
        const rename: Record<string, string> = { monthlyExpensesCents: "monthlyExpenses", otherLoanPaymentsCents: "otherLoanPayments" };
        return Object.fromEntries(Object.entries(found).map(([key, message]) => [rename[key] ?? key, message]));
      }
      case 5: {
        if (body.withGuarantor === undefined) return { withGuarantor: "Choose primary borrower only or with a guarantor." };
        if (!body.withGuarantor) return {};
        const found = checkStep(guarantorSchema, body.guarantor).errors;
        if (body.guarantor?.mobileNumber && body.guarantor.mobileNumber.replace(/\D/g, "").slice(-10) === (body.borrower.mobileNumber ?? "").replace(/\D/g, "").slice(-10)) {
          found.mobileNumber ??= "The guarantor needs their own mobile number.";
        }
        return Object.fromEntries(
          Object.entries(found).map(([key, message]) => [`g.${key.replace(/^addresses\./, "").replace(/^monthlyIncomeCents$/, "monthlyIncome")}`, message]),
        );
      }
      case 6:
        return checkStep(loanConsentsSchema, body.consents).errors;
      default:
        return {};
    }
  }

  async function submit(all: FormValues) {
    setPending(true);
    setFormError(null);
    const response = await apiRequest<Result>("/bank/loans/applications", { method: "POST", body: payload(all) });
    if (response.ok) {
      router.push(`/banking/loans/applications/${response.data.id}`);
      router.refresh();
      return;
    }
    setPending(false);
    setFormError(response.message);
  }

  async function onContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const merged = { ...values, ...readForm(event.currentTarget) };
    setValues(merged);
    const found = validate(merged);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step === STEPS.length - 1) await submit(merged);
    else go(step + 1);
  }

  const addressBlock = (prefix: string, part: "current" | "previous", testPrefix: string) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="House number and street" name={`${prefix}${part}.addressLine`} autoComplete="off" defaultValue={v(`${prefix}${part}.addressLine`)} testId={`${testPrefix}-address-line`} error={err(`${prefix}${part}.addressLine`)} />
      </div>
      <Field label="Barangay" name={`${prefix}${part}.barangay`} autoComplete="off" defaultValue={v(`${prefix}${part}.barangay`)} testId={`${testPrefix}-barangay`} error={err(`${prefix}${part}.barangay`)} />
      <Field label="City or municipality" name={`${prefix}${part}.city`} autoComplete="off" defaultValue={v(`${prefix}${part}.city`)} testId={`${testPrefix}-city`} error={err(`${prefix}${part}.city`)} />
      <Field label="Province" name={`${prefix}${part}.province`} autoComplete="off" defaultValue={v(`${prefix}${part}.province`)} testId={`${testPrefix}-province`} error={err(`${prefix}${part}.province`)} />
      <Field label="ZIP code" name={`${prefix}${part}.postalCode`} inputMode="numeric" maxLength={4} autoComplete="off" defaultValue={v(`${prefix}${part}.postalCode`)} testId={`${testPrefix}-postal-code`} error={err(`${prefix}${part}.postalCode`)} />
    </div>
  );

  const addressHistory = (prefix: string, testPrefix: string, yearsValue: string, setYearsValue: (value: string) => void, showPrev: boolean) => (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Current address</h3>
        {addressBlock(prefix, "current", `${testPrefix}-current`)}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Years at this address"
            name={`${prefix}current.yearsAtAddress`}
            inputMode="numeric"
            autoComplete="off"
            defaultValue={yearsValue}
            onChange={(event) => setYearsValue(event.currentTarget.value)}
            hint={`Under ${MIN_YEARS_AT_ADDRESS} years? We also need your previous address.`}
            testId={`${testPrefix}-years-at-address`}
            error={err(`${prefix}current.yearsAtAddress`)}
          />
          <SelectField label="Residence type" name={`${prefix}current.residenceType`} defaultValue={v(`${prefix}current.residenceType`)} testId={`${testPrefix}-residence-type`} error={err(`${prefix}current.residenceType`)}>
            <option value="">Choose</option>
            {RESIDENCE_TYPES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </SelectField>
        </div>
      </section>
      {showPrev ? (
        <section className="space-y-3 rounded-xl bg-emerald-50 p-4" data-testid={`${testPrefix}-previous-address`}>
          <h3 className="text-sm font-semibold">Previous address</h3>
          {addressBlock(prefix, "previous", `${testPrefix}-previous`)}
        </section>
      ) : null}
      {err(`${prefix}previous`) ? <p className="text-xs text-red-700" data-testid={`${testPrefix}-previous-error`}>{err(`${prefix}previous`)}</p> : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <StepProgress steps={STEPS} current={step} testId="loan-progress" />
      <Card className="p-6">
        <form key={step} method="post" onSubmit={onContinue} noValidate className="space-y-5" data-testid="loan-application-form">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-xl font-bold" data-testid="loan-step-title">{STEPS[step]}</h2>
          </div>
          {formError ? <Alert tone="error" testId="loan-application-error">{formError}</Alert> : null}

          {step === 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Loan amount (PHP)" name="amount" inputMode="decimal" autoComplete="off" hint="₱20,000.00 to ₱500,000.00" defaultValue={amount} onChange={(event) => setAmount(event.currentTarget.value)} testId="loan-amount" error={err("amount")} />
                <SelectField label="Term" name="termMonths" defaultValue={term} onChange={(event) => setTerm(event.currentTarget.value)} testId="loan-term" error={err("termMonths")}>
                  {LOAN_TERMS.map((value) => <option key={value} value={value}>{value} months</option>)}
                </SelectField>
                <SelectField label="Purpose" name="purpose" defaultValue={v("purpose")} testId="loan-purpose" error={err("purpose")}>
                  <option value="">Choose</option>
                  {LOAN_PURPOSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </SelectField>
                <Field label="Purpose details (optional)" name="purposeDetails" autoComplete="off" defaultValue={v("purposeDetails")} testId="loan-purpose-details" error={err("purposeDetails")} />
              </div>
              {estimate ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-emerald-50 p-4 text-sm sm:grid-cols-4" data-testid="loan-estimate">
                  <dt className="text-muted">Monthly instalment</dt>
                  <dd className="font-semibold" data-testid="loan-estimate-instalment">{formatPeso(estimate.monthlyInstalmentCents)}</dd>
                  <dt className="text-muted">Total interest</dt>
                  <dd data-testid="loan-estimate-interest">{formatPeso(estimate.totalInterestCents)}</dd>
                  <dt className="text-muted">Processing fee</dt>
                  <dd>{formatPeso(estimate.processingFeeCents)}</dd>
                  <dt className="text-muted">You receive</dt>
                  <dd data-testid="loan-estimate-net">{formatPeso(estimate.netProceedsCents)}</dd>
                  <dd className="col-span-2 text-xs text-muted sm:col-span-4">Estimate at a 1.20% monthly add-on rate. The final offer depends on the credit check.</dd>
                </dl>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="text-sm text-muted sm:col-span-2">Details you gave when you opened your account are filled in. Check and complete them.</p>
              <Field label="First name" name="firstName" autoComplete="off" defaultValue={v("firstName")} testId="loan-first-name" error={err("firstName")} />
              <Field label="Middle name (optional)" name="middleName" autoComplete="off" defaultValue={v("middleName")} testId="loan-middle-name" error={err("middleName")} />
              <Field label="Last name" name="lastName" autoComplete="off" defaultValue={v("lastName")} testId="loan-last-name" error={err("lastName")} />
              <Field label="Suffix (optional)" name="suffix" autoComplete="off" defaultValue={v("suffix")} testId="loan-suffix" error={err("suffix")} />
              <Field label="Birth date" name="birthDate" type="date" defaultValue={v("birthDate")} testId="loan-birth-date" error={err("birthDate")} />
              <SelectField label="Civil status" name="civilStatus" defaultValue={v("civilStatus")} testId="loan-civil-status" error={err("civilStatus")}>
                <option value="">Choose</option>
                {CIVIL_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </SelectField>
              <Field label="Mobile number" name="mobileNumber" type="tel" autoComplete="off" defaultValue={v("mobileNumber")} testId="loan-mobile" error={err("mobileNumber")} />
              <SelectField label="ID type" name="idType" defaultValue={v("idType")} testId="loan-id-type" error={err("idType")}>
                <option value="">Choose</option>
                {ID_TYPES.map((value) => <option key={value} value={value}>{ID_TYPE_LABELS[value]}</option>)}
              </SelectField>
              <Field label="ID number" name="idNumber" autoComplete="off" hint="Made-up numbers only." defaultValue={v("idNumber")} testId="loan-id-number" error={err("idNumber")} />
            </div>
          ) : null}

          {step === 2 ? addressHistory("", "loan", years, setYears, showPrevious) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Employment type" name="employmentType" defaultValue={v("employmentType")} testId="loan-employment-type" error={err("employmentType")}>
                <option value="">Choose</option>
                {LOAN_EMPLOYMENT_TYPES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </SelectField>
              <Field label="Employer, business, or pension source" name="employerName" autoComplete="off" defaultValue={v("employerName")} testId="loan-employer-name" error={err("employerName")} />
              <Field label="Position or nature of business" name="position" autoComplete="off" defaultValue={v("position")} testId="loan-position" error={err("position")} />
              <Field label="Months with this employer or business" name="employmentMonths" inputMode="numeric" autoComplete="off" defaultValue={v("employmentMonths")} testId="loan-employment-months" error={err("employmentMonths")} />
              <Field label="Gross monthly income (PHP)" name="monthlyIncome" inputMode="decimal" autoComplete="off" defaultValue={v("monthlyIncome")} testId="loan-monthly-income" error={err("monthlyIncome")} />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <p className="text-sm text-muted">A loan officer would ask you these questions. Answer them as part of the credit check.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Monthly household expenses (PHP)" name="monthlyExpenses" inputMode="decimal" autoComplete="off" defaultValue={v("monthlyExpenses")} testId="loan-monthly-expenses" error={err("monthlyExpenses")} />
                <Field label="Monthly payments on other loans and cards (PHP)" name="otherLoanPayments" inputMode="decimal" autoComplete="off" hint="Enter 0 if none." defaultValue={v("otherLoanPayments")} testId="loan-other-payments" error={err("otherLoanPayments")} />
                <Field label="Number of dependents" name="dependents" inputMode="numeric" autoComplete="off" defaultValue={v("dependents")} testId="loan-dependents" error={err("dependents")} />
                <SelectField label="How will you repay the loan?" name="repaymentSource" defaultValue={v("repaymentSource")} testId="loan-repayment-source" error={err("repaymentSource")}>
                  <option value="">Choose</option>
                  {REPAYMENT_SOURCES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </SelectField>
              </div>
              <YesNoField name="missedPayments" question="Have you missed a loan or credit card payment in the last 12 months?" value={values.missedPayments} error={err("missedPayments")} testId="loan-missed-payments" />
              <YesNoField name="legalIssues" question="Do you have a pending court case or bankruptcy?" value={values.legalIssues} error={err("legalIssues")} testId="loan-legal-issues" />
              <YesNoField name="hasOtherBankLoans" question="Do you have loans with other banks or lenders?" value={values.hasOtherBankLoans} error={err("hasOtherBankLoans")} testId="loan-other-bank-loans" />
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              <fieldset data-testid="loan-borrower-type">
                <legend className="mb-2 text-sm font-semibold">Who is applying?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: "no", title: "Primary borrower only", text: "You apply on your own." },
                    { value: "yes", title: "With a guarantor", text: "Someone agrees to pay if you cannot. A guarantor with a steady income improves your credit check." },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 text-sm has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50" data-testid={`loan-borrower-type-${option.value === "yes" ? "guarantor" : "primary"}`}>
                      <span className="flex items-center gap-2 font-semibold">
                        <input type="radio" name="withGuarantor" value={option.value} defaultChecked={(withGuarantor ? "yes" : "no") === option.value} onChange={() => setWithGuarantor(option.value === "yes")} className="accent-emerald-800" data-testid={`loan-borrower-type-radio-${option.value === "yes" ? "guarantor" : "primary"}`} />
                        {option.title}
                      </span>
                      <span className="text-muted">{option.text}</span>
                    </label>
                  ))}
                </div>
                {err("withGuarantor") ? <p className="mt-1 text-xs text-red-700" data-testid="loan-borrower-type-error">{err("withGuarantor")}</p> : null}
              </fieldset>

              {withGuarantor ? (
                <div className="space-y-5" data-testid="loan-guarantor">
                  <section className="grid gap-4 sm:grid-cols-2">
                    <h3 className="text-sm font-semibold sm:col-span-2">Guarantor details</h3>
                    <Field label="First name" name="g.firstName" autoComplete="off" defaultValue={v("g.firstName")} testId="loan-g-first-name" error={err("g.firstName")} />
                    <Field label="Middle name (optional)" name="g.middleName" autoComplete="off" defaultValue={v("g.middleName")} testId="loan-g-middle-name" error={err("g.middleName")} />
                    <Field label="Last name" name="g.lastName" autoComplete="off" defaultValue={v("g.lastName")} testId="loan-g-last-name" error={err("g.lastName")} />
                    <SelectField label="Relationship to you" name="g.relationship" defaultValue={v("g.relationship")} testId="loan-g-relationship" error={err("g.relationship")}>
                      <option value="">Choose</option>
                      {GUARANTOR_RELATIONSHIPS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                    </SelectField>
                    <Field label="Birth date" name="g.birthDate" type="date" defaultValue={v("g.birthDate")} testId="loan-g-birth-date" error={err("g.birthDate")} />
                    <Field label="Mobile number" name="g.mobileNumber" type="tel" autoComplete="off" defaultValue={v("g.mobileNumber")} testId="loan-g-mobile" error={err("g.mobileNumber")} />
                    <Field label="Email" name="g.email" type="email" autoComplete="off" defaultValue={v("g.email")} testId="loan-g-email" error={err("g.email")} />
                    <SelectField label="ID type" name="g.idType" defaultValue={v("g.idType")} testId="loan-g-id-type" error={err("g.idType")}>
                      <option value="">Choose</option>
                      {ID_TYPES.map((value) => <option key={value} value={value}>{ID_TYPE_LABELS[value]}</option>)}
                    </SelectField>
                    <Field label="ID number" name="g.idNumber" autoComplete="off" defaultValue={v("g.idNumber")} testId="loan-g-id-number" error={err("g.idNumber")} />
                  </section>
                  {addressHistory("g.", "loan-g", guarantorYears, setGuarantorYears, showGuarantorPrevious)}
                  <section className="grid gap-4 sm:grid-cols-2">
                    <h3 className="text-sm font-semibold sm:col-span-2">Guarantor&apos;s work and credit</h3>
                    <SelectField label="Employment type" name="g.employmentType" defaultValue={v("g.employmentType")} testId="loan-g-employment-type" error={err("g.employmentType")}>
                      <option value="">Choose</option>
                      {LOAN_EMPLOYMENT_TYPES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                    </SelectField>
                    <Field label="Employer or business" name="g.employerName" autoComplete="off" defaultValue={v("g.employerName")} testId="loan-g-employer-name" error={err("g.employerName")} />
                    <Field label="Gross monthly income (PHP)" name="g.monthlyIncome" inputMode="decimal" autoComplete="off" defaultValue={v("g.monthlyIncome")} testId="loan-g-monthly-income" error={err("g.monthlyIncome")} />
                    <div className="sm:col-span-2">
                      <YesNoField name="g.missedPayments" question="Has the guarantor missed a loan or credit card payment in the last 12 months?" value={values["g.missedPayments"]} error={err("g.missedPayments")} testId="loan-g-missed-payments" />
                    </div>
                    <div className="sm:col-span-2">
                      <CheckboxField name="g.consents" checked={values["g.consents"] === true} error={err("g.consents")} testId="loan-g-consent">
                        The guarantor agrees to guarantee this loan and to the credit check. (Simulated: no one is contacted.)
                      </CheckboxField>
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-4">
              <dl className="grid gap-x-4 gap-y-1 rounded-xl border border-line p-4 text-sm sm:grid-cols-2" data-testid="loan-review">
                <dt className="text-muted">Loan</dt>
                <dd data-testid="loan-review-loan">{formatPeso(pesos(values.amount) ?? 0)} over {v("termMonths")} months, for {label(v("purpose"))}</dd>
                <dt className="text-muted">Borrower</dt>
                <dd>{[v("firstName"), v("middleName"), v("lastName"), v("suffix")].filter(Boolean).join(" ")}</dd>
                <dt className="text-muted">Current address</dt>
                <dd>{[v("current.addressLine"), v("current.barangay"), v("current.city"), v("current.province")].filter(Boolean).join(", ")} ({v("current.yearsAtAddress")} years)</dd>
                {showPrevious ? (
                  <>
                    <dt className="text-muted">Previous address</dt>
                    <dd>{[v("previous.addressLine"), v("previous.barangay"), v("previous.city"), v("previous.province")].filter(Boolean).join(", ")}</dd>
                  </>
                ) : null}
                <dt className="text-muted">Income</dt>
                <dd>{formatPeso(pesos(values.monthlyIncome) ?? 0)} a month from {v("employerName")}</dd>
                <dt className="text-muted">Applying as</dt>
                <dd data-testid="loan-review-borrower-type">{withGuarantor ? `With a guarantor: ${v("g.firstName")} ${v("g.lastName")}` : "Primary borrower only"}</dd>
              </dl>
              <CheckboxField name="authorizesCreditCheck" checked={values.authorizesCreditCheck === true} error={err("authorizesCreditCheck")} testId="loan-consent-credit-check">
                I allow QualityLab Bank to run a credit check using the details above. (Simulated: no credit bureau is contacted.)
              </CheckboxField>
              <CheckboxField name="confirmsTruthful" checked={values.confirmsTruthful === true} error={err("confirmsTruthful")} testId="loan-consent-truthful">
                I confirm that these details are true and complete.
              </CheckboxField>
              <CheckboxField name="acceptsPrivacy" checked={values.acceptsPrivacy === true} error={err("acceptsPrivacy")} testId="loan-consent-privacy">
                I accept the privacy notice, and I understand that this demo stores only fictional data.
              </CheckboxField>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  setValues({ ...values, ...readForm(event.currentTarget.form!) });
                  go(step - 1);
                }}
                className={bankButtonOutline}
                data-testid="loan-back-button"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" disabled={!ready || pending} className={bankButton} data-testid="loan-continue-button">
              {step === STEPS.length - 1 ? (pending ? "Running the credit check..." : "Submit application") : "Continue"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
