"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { ZodType } from "zod";
import { bankButton, bankButtonOutline } from "@/components/bank";
import { Field, SelectField } from "@/components/forms/fields";
import { Alert, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useHydrated } from "@/lib/client/use-submit";
import { BANK_PRODUCTS, MAX_ONLINE_OPENING_CENTS } from "@/lib/bank-products";
import { dollarsToCents, formatPeso } from "@/lib/money";
import {
  accountStep,
  addressStep,
  CIVIL_STATUSES,
  consentStep,
  contactStep,
  EMPLOYMENT_STATUSES,
  ID_TYPE_LABELS,
  ID_TYPES,
  idStep,
  loginStep,
  MONTHLY_INCOME_LABELS,
  MONTHLY_INCOME_RANGES,
  personalStep,
  SEXES,
  SOURCES_OF_FUNDS,
  TEST_OTP,
  workStep,
} from "@/lib/validation/bank-onboarding";

type Values = Record<string, string | boolean | undefined>;
type Errors = Record<string, string>;
type Result = { applicationNumber: string; account: { accountNumber: string; name: string; balanceCents: number } };

const STEPS = ["Eligibility", "Contact", "Personal details", "Address", "Work and income", "Valid ID", "Account", "Login", "Review"] as const;
const STEP_FOR_FIELD: Record<string, number> = { consent: 0, contact: 1, otp: 1, personal: 2, address: 3, work: 4, identification: 5, account: 6, password: 7 };

const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");

/** Validates one step and returns its parsed value, or the error for each field. */
function check<T>(schema: ZodType<T>, input: unknown): { value?: T; errors: Errors } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { value: parsed.data, errors: {} };
  const errors: Errors = {};
  for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { errors };
}

function Checkbox({ name, children, checked, error, testId }: { name: string; children: ReactNode; checked: boolean; error?: string; testId: string }) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="mt-0.5 h-4 w-4 accent-emerald-800"
          data-testid={`${testId}-checkbox`}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={`${name}-error`} className="ml-7 mt-1 text-xs text-red-700" data-testid={`${testId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AccountApplication() {
  const router = useRouter();
  const ready = useHydrated();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ nationality: "Filipino", product: "STARTER_SAVINGS", idType: "NATIONAL_ID" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [selfieVerified, setSelfieVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const str = (key: string) => (typeof values[key] === "string" ? (values[key] as string) : "");

  function read(form: HTMLFormElement): Values {
    const data = new FormData(form);
    const next: Values = {};
    for (const element of Array.from(form.elements)) {
      const input = element as HTMLInputElement;
      if (!input.name) continue;
      next[input.name] = input.type === "checkbox" ? input.checked : String(data.get(input.name) ?? "");
    }
    return next;
  }

  function go(to: number) {
    setErrors({});
    setFormError(null);
    setStep(to);
    window.scrollTo({ top: 0 });
  }

  async function sendOtp(form: HTMLFormElement) {
    const merged = { ...values, ...read(form) };
    setValues(merged);
    const { errors: found } = check(contactStep, { mobileNumber: merged.mobileNumber, email: merged.email });
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setOtpSent(true);
      setOtpVerified(false);
    }
  }

  async function verifyOtp(form: HTMLFormElement) {
    const merged = { ...values, ...read(form) };
    setValues(merged);
    setPending(true);
    const response = await apiRequest("/bank/applications/verify-otp", {
      method: "POST",
      body: { mobileNumber: merged.mobileNumber, email: merged.email, otp: merged.otp },
    });
    setPending(false);
    setOtpVerified(response.ok);
    if (response.ok) {
      setErrors({});
    } else {
      const otpDetail = response.details.find((detail) => detail.field === "otp");
      const contactDetail = response.details.find((detail) => detail.field === "mobileNumber" || detail.field === "email");
      setErrors(contactDetail ? { [contactDetail.field!]: contactDetail.message } : { otp: otpDetail?.message ?? response.message });
    }
  }

  function payload(all: Values) {
    return {
      consent: { isAdult: all.isAdult, isResident: all.isResident, hasValidId: all.hasValidId, acceptsTerms: all.acceptsTerms },
      contact: { mobileNumber: all.mobileNumber, email: all.email },
      otp: all.otp,
      personal: {
        firstName: all.firstName,
        middleName: all.middleName,
        lastName: all.lastName,
        suffix: all.suffix,
        birthDate: all.birthDate,
        birthPlace: all.birthPlace,
        sex: all.sex,
        civilStatus: all.civilStatus,
        nationality: all.nationality,
        mothersMaidenName: all.mothersMaidenName,
      },
      address: { addressLine: all.addressLine, barangay: all.barangay, city: all.city, province: all.province, postalCode: all.postalCode },
      work: {
        employmentStatus: all.employmentStatus,
        employerName: all.employerName,
        occupation: all.occupation,
        sourceOfFunds: all.sourceOfFunds,
        monthlyIncome: all.monthlyIncome,
        tin: all.tin,
      },
      identification: { idType: all.idType, idNumber: all.idNumber, idExpiry: all.idExpiry, selfieVerified },
      account: { product: all.product, openingDepositCents: dollarsToCents(String(all.openingDeposit ?? "")) ?? -1 },
      password: all.password,
    };
  }

  async function submitApplication(all: Values) {
    setPending(true);
    setFormError(null);
    const response = await apiRequest<Result>("/bank/applications", { method: "POST", body: payload(all) });
    if (response.ok) {
      // Sign the new customer in to Banking, as the bank apps do once the login is created.
      await apiRequest("/auth/login", { method: "POST", body: { email: all.email, password: all.password, module: "banking" } });
      setPending(false);
      setResult(response.data);
      router.refresh();
      window.scrollTo({ top: 0 });
      return;
    }
    setPending(false);
    setFormError(response.message);
    const field = response.details[0]?.field ?? "";
    const [section, name] = field.includes(".") ? field.split(".") : [field, field];
    const target = STEP_FOR_FIELD[section];
    if (target !== undefined && response.details[0]) {
      setStep(target);
      setErrors({ [name === "openingDepositCents" ? "openingDeposit" : name]: response.details[0].message });
    }
  }

  async function onContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const merged = { ...values, ...read(event.currentTarget) };
    setValues(merged);
    let found: Errors = {};
    switch (step) {
      case 0:
        found = check(consentStep, merged).errors;
        break;
      case 1:
        found = check(contactStep, merged).errors;
        if (Object.keys(found).length === 0 && !otpVerified) found = { otp: "Verify your mobile number and email with the one-time PIN." };
        break;
      case 2:
        found = check(personalStep, merged).errors;
        break;
      case 3:
        found = check(addressStep, merged).errors;
        break;
      case 4:
        found = check(workStep, merged).errors;
        break;
      case 5:
        found = check(idStep, { ...merged, selfieVerified }).errors;
        break;
      case 6: {
        const cents = dollarsToCents(String(merged.openingDeposit ?? ""));
        const result = check(accountStep, { product: merged.product, openingDepositCents: cents ?? -1 });
        found = cents === null ? { openingDeposit: "Enter an amount such as 500.00." } : result.errors.openingDepositCents ? { openingDeposit: result.errors.openingDepositCents } : result.errors;
        const product = BANK_PRODUCTS[merged.product as keyof typeof BANK_PRODUCTS];
        if (!found.openingDeposit && product && cents !== null && cents < product.minimumOpeningCents) {
          found = { openingDeposit: `The opening deposit for ${product.name} is at least ${formatPeso(product.minimumOpeningCents)}.` };
        }
        break;
      }
      case 7:
        found = check(loginStep, merged).errors;
        if (!found.password && merged.password !== merged.confirmPassword) found = { confirmPassword: "Passwords do not match." };
        break;
      case 8:
        await submitApplication(merged);
        return;
    }
    setErrors(found);
    if (Object.keys(found).length === 0) go(step + 1);
  }

  if (result) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center" testId="application-success">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800" aria-hidden="true">
          ✓
        </div>
        <h2 className="text-2xl font-bold">Your account is open</h2>
        <p className="mt-2 text-sm text-muted">
          Application <span className="font-mono" data-testid="application-number">{result.applicationNumber}</span>
        </p>
        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-2 text-left text-sm">
          <dt className="text-muted">Account</dt>
          <dd data-testid="application-account-name">{result.account.name}</dd>
          <dt className="text-muted">Account number</dt>
          <dd className="font-mono" data-testid="application-account-number">{result.account.accountNumber}</dd>
          <dt className="text-muted">Opening balance</dt>
          <dd data-testid="application-account-balance">{formatPeso(result.account.balanceCents)}</dd>
        </dl>
        <p className="mt-6 text-sm text-muted">You are signed in to Banking with your email and the password you just created.</p>
        <Link href="/banking" className={`${bankButton} mt-4`} data-testid="application-go-to-banking">
          Go to my accounts
        </Link>
      </Card>
    );
  }

  const product = BANK_PRODUCTS[(str("product") || "STARTER_SAVINGS") as keyof typeof BANK_PRODUCTS];

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-6 flex flex-wrap gap-1.5" aria-label="Application steps" data-testid="application-progress">
        {STEPS.map((name, index) => (
          <li
            key={name}
            aria-current={index === step ? "step" : undefined}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index === step ? "bg-emerald-800 text-white" : index < step ? "bg-emerald-100 text-emerald-900" : "bg-canvas text-muted ring-1 ring-line"}`}
            data-testid={`application-progress-${index + 1}`}
          >
            {index + 1}. {name}
          </li>
        ))}
      </ol>

      <Card className="p-6">
        <form key={step} method="post" onSubmit={onContinue} noValidate className="space-y-5" data-testid="application-form">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-xl font-bold" data-testid="application-step-title">
              {STEPS[step]}
            </h2>
          </div>
          {formError ? <Alert tone="error" testId="application-error">{formError}</Alert> : null}

          {step === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">To open an account online you must meet all of these.</p>
              <Checkbox name="isAdult" checked={values.isAdult === true} error={errors.isAdult} testId="app-consent-adult">
                I am 18 years old or older.
              </Checkbox>
              <Checkbox name="isResident" checked={values.isResident === true} error={errors.isResident} testId="app-consent-resident">
                I live in the Philippines.
              </Checkbox>
              <Checkbox name="hasValidId" checked={values.hasValidId === true} error={errors.hasValidId} testId="app-consent-valid-id">
                I have a valid government-issued ID.
              </Checkbox>
              <Checkbox name="acceptsTerms" checked={values.acceptsTerms === true} error={errors.acceptsTerms} testId="app-consent-terms">
                I agree to the QualityLab Bank terms and the privacy notice, and I understand that this is a simulation that stores only fictional data.
              </Checkbox>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mobile number" name="mobileNumber" type="tel" inputMode="tel" autoComplete="off" placeholder="0917 123 4567" defaultValue={str("mobileNumber")} testId="app-mobile" error={errors.mobileNumber} />
                <Field label="Email" name="email" type="email" autoComplete="off" defaultValue={str("email")} testId="app-email" error={errors.email} />
              </div>
              <button type="button" disabled={!ready} onClick={(event) => sendOtp(event.currentTarget.form!)} className={bankButtonOutline} data-testid="app-send-otp-button">
                {otpSent ? "Send the PIN again" : "Send one-time PIN"}
              </button>
              {otpSent ? (
                <div className="space-y-3 rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm" data-testid="app-otp-hint">
                    A PIN was sent to your mobile and email. <strong>Demo only:</strong> no message is sent, and the PIN is always {TEST_OTP}.
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-40">
                      <Field label="One-time PIN" name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} defaultValue={str("otp")} testId="app-otp" error={errors.otp} />
                    </div>
                    <button type="button" disabled={!ready || pending} onClick={(event) => verifyOtp(event.currentTarget.form!)} className={bankButton} data-testid="app-verify-otp-button">
                      Verify
                    </button>
                  </div>
                  {otpVerified ? <Alert tone="success" testId="app-otp-verified">Mobile number and email verified.</Alert> : null}
                </div>
              ) : errors.otp ? (
                <p className="text-xs text-red-700" data-testid="app-otp-error">{errors.otp}</p>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="firstName" autoComplete="off" defaultValue={str("firstName")} testId="app-first-name" error={errors.firstName} />
              <Field label="Middle name (optional)" name="middleName" autoComplete="off" defaultValue={str("middleName")} testId="app-middle-name" error={errors.middleName} />
              <Field label="Last name" name="lastName" autoComplete="off" defaultValue={str("lastName")} testId="app-last-name" error={errors.lastName} />
              <Field label="Suffix (optional)" name="suffix" autoComplete="off" placeholder="Jr., III" defaultValue={str("suffix")} testId="app-suffix" error={errors.suffix} />
              <Field label="Birth date" name="birthDate" type="date" defaultValue={str("birthDate")} testId="app-birth-date" error={errors.birthDate} />
              <Field label="Place of birth" name="birthPlace" autoComplete="off" defaultValue={str("birthPlace")} testId="app-birth-place" error={errors.birthPlace} />
              <SelectField label="Sex" name="sex" defaultValue={str("sex")} testId="app-sex" error={errors.sex}>
                <option value="">Choose</option>
                {SEXES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </SelectField>
              <SelectField label="Civil status" name="civilStatus" defaultValue={str("civilStatus")} testId="app-civil-status" error={errors.civilStatus}>
                <option value="">Choose</option>
                {CIVIL_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </SelectField>
              <Field label="Nationality" name="nationality" autoComplete="off" defaultValue={str("nationality")} testId="app-nationality" error={errors.nationality} />
              <Field label="Mother's maiden name" name="mothersMaidenName" autoComplete="off" defaultValue={str("mothersMaidenName")} testId="app-mothers-maiden-name" error={errors.mothersMaidenName} />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="House number and street" name="addressLine" autoComplete="off" defaultValue={str("addressLine")} testId="app-address-line" error={errors.addressLine} />
              </div>
              <Field label="Barangay" name="barangay" autoComplete="off" defaultValue={str("barangay")} testId="app-barangay" error={errors.barangay} />
              <Field label="City or municipality" name="city" autoComplete="off" defaultValue={str("city")} testId="app-city" error={errors.city} />
              <Field label="Province" name="province" autoComplete="off" defaultValue={str("province")} testId="app-province" error={errors.province} />
              <Field label="ZIP code" name="postalCode" inputMode="numeric" maxLength={4} autoComplete="off" defaultValue={str("postalCode")} testId="app-postal-code" error={errors.postalCode} />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Employment status" name="employmentStatus" defaultValue={str("employmentStatus")} testId="app-employment-status" error={errors.employmentStatus}>
                <option value="">Choose</option>
                {EMPLOYMENT_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </SelectField>
              <Field label="Employer or business name" name="employerName" autoComplete="off" hint="Required if you are employed or self-employed." defaultValue={str("employerName")} testId="app-employer-name" error={errors.employerName} />
              <Field label="Occupation" name="occupation" autoComplete="off" defaultValue={str("occupation")} testId="app-occupation" error={errors.occupation} />
              <SelectField label="Source of funds" name="sourceOfFunds" defaultValue={str("sourceOfFunds")} testId="app-source-of-funds" error={errors.sourceOfFunds}>
                <option value="">Choose</option>
                {SOURCES_OF_FUNDS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </SelectField>
              <SelectField label="Monthly income" name="monthlyIncome" defaultValue={str("monthlyIncome")} testId="app-monthly-income" error={errors.monthlyIncome}>
                <option value="">Choose</option>
                {MONTHLY_INCOME_RANGES.map((value) => <option key={value} value={value}>{MONTHLY_INCOME_LABELS[value]}</option>)}
              </SelectField>
              <Field label="TIN (optional)" name="tin" autoComplete="off" placeholder="123-456-789" hint="Fictional numbers only." defaultValue={str("tin")} testId="app-tin" error={errors.tin} />
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <Alert tone="info" testId="app-id-notice">
                Demo only: enter a made-up ID number. Do not enter a real ID. An ID number ending in 0000 fails verification on purpose.
              </Alert>
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField label="ID type" name="idType" defaultValue={str("idType")} testId="app-id-type" error={errors.idType}>
                  {ID_TYPES.map((value) => <option key={value} value={value}>{ID_TYPE_LABELS[value]}</option>)}
                </SelectField>
                <Field label="ID number" name="idNumber" autoComplete="off" defaultValue={str("idNumber")} testId="app-id-number" error={errors.idNumber} />
                <Field label="Expiry date" name="idExpiry" type="date" hint="Not needed for the National ID." defaultValue={str("idExpiry")} testId="app-id-expiry" error={errors.idExpiry} />
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-emerald-700 p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-900" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="9" r="4" />
                    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                  </svg>
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold">Selfie check</p>
                  <p className="text-muted">A real bank app uses your camera here. This demo never uses the camera.</p>
                </div>
                <button type="button" disabled={!ready} onClick={() => setSelfieVerified(true)} className={selfieVerified ? bankButtonOutline : bankButton} data-testid="app-selfie-button">
                  {selfieVerified ? "Retake" : "Simulate selfie check"}
                </button>
              </div>
              {selfieVerified ? <Alert tone="success" testId="app-selfie-status">Selfie check passed.</Alert> : null}
              {errors.selfieVerified ? <p className="text-xs text-red-700" data-testid="app-selfie-error">{errors.selfieVerified}</p> : null}
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Account type</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.values(BANK_PRODUCTS)
                    .filter((option) => option.forNewCustomers)
                    .map((option) => (
                      <label
                        key={option.code}
                        className="flex cursor-pointer flex-col gap-1 rounded-xl border p-4 text-sm has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50"
                        data-testid={`app-product-${option.code.toLowerCase()}`}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <input type="radio" name="product" value={option.code} defaultChecked={str("product") === option.code} className="accent-emerald-800" data-testid={`app-product-radio-${option.code.toLowerCase()}`} />
                          {option.name}
                        </span>
                        <span className="text-muted">{option.summary}</span>
                        <span>Opening deposit from {formatPeso(option.minimumOpeningCents)}</span>
                        <span>Maintaining balance {option.maintainingBalanceCents ? formatPeso(option.maintainingBalanceCents) : "none"}</span>
                      </label>
                    ))}
                </div>
                {errors.product ? <p className="mt-1 text-xs text-red-700">{errors.product}</p> : null}
              </fieldset>
              <Field
                label="Opening deposit (PHP)"
                name="openingDeposit"
                inputMode="decimal"
                autoComplete="off"
                hint={`Simulated: no payment is taken. At most ${formatPeso(MAX_ONLINE_OPENING_CENTS)} online.`}
                defaultValue={str("openingDeposit")}
                testId="app-opening-deposit"
                error={errors.openingDeposit}
              />
            </div>
          ) : null}

          {step === 7 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Your user ID is your email, <strong data-testid="app-user-id">{str("email")}</strong>. Create a password for online banking.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters, with upper and lower case letters, a number, and a symbol." testId="app-password" error={errors.password} />
                <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" testId="app-confirm-password" error={errors.confirmPassword} />
              </div>
            </div>
          ) : null}

          {step === 8 ? (
            <div className="space-y-4" data-testid="application-review">
              {[
                { section: 1, title: "Contact", lines: [str("mobileNumber"), str("email")] },
                { section: 2, title: "Personal details", lines: [[str("firstName"), str("middleName"), str("lastName"), str("suffix")].filter(Boolean).join(" "), `Born ${str("birthDate")} in ${str("birthPlace")}`, `${label(str("sex"))}, ${label(str("civilStatus"))}, ${str("nationality")}`] },
                { section: 3, title: "Address", lines: [str("addressLine"), `${str("barangay")}, ${str("city")}`, `${str("province")} ${str("postalCode")}`] },
                { section: 4, title: "Work and income", lines: [`${label(str("employmentStatus"))}${str("employerName") ? ` at ${str("employerName")}` : ""}, ${str("occupation")}`, `${label(str("sourceOfFunds"))}, ${MONTHLY_INCOME_LABELS[str("monthlyIncome") as keyof typeof MONTHLY_INCOME_LABELS] ?? ""}`] },
                { section: 5, title: "Valid ID", lines: [`${ID_TYPE_LABELS[str("idType") as keyof typeof ID_TYPE_LABELS] ?? ""} ${str("idNumber")}`, selfieVerified ? "Selfie check passed" : "Selfie check missing"] },
                { section: 6, title: "Account", lines: [`${product.name}, opening deposit ${formatPeso(dollarsToCents(str("openingDeposit")) ?? 0)}`] },
              ].map((block) => (
                <section key={block.title} className="flex items-start justify-between gap-3 rounded-xl border border-line p-4" data-testid={`app-review-${block.section + 1}`}>
                  <div>
                    <h3 className="text-sm font-semibold">{block.title}</h3>
                    {block.lines.map((line) => <p key={line} className="text-sm text-muted">{line}</p>)}
                  </div>
                  <button type="button" onClick={() => go(block.section)} className="text-sm font-semibold text-emerald-800 hover:underline" data-testid={`app-review-edit-${block.section + 1}`}>
                    Edit
                  </button>
                </section>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  setValues({ ...values, ...read(event.currentTarget.form!) });
                  go(step - 1);
                }}
                className={bankButtonOutline}
                data-testid="application-back-button"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" disabled={!ready || pending} className={bankButton} data-testid="application-continue-button">
              {step === STEPS.length - 1 ? (pending ? "Opening your account..." : "Open my account") : "Continue"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
