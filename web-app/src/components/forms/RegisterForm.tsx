"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

export function RegisterForm() {
  const router = useRouter();
  const { pending, error, fieldErrors, submit, setFieldErrors, reset } = useSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get("password");

    reset();
    if (password !== form.get("confirmPassword")) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    const credentials = { email: form.get("email"), password };
    await submit(
      () =>
        apiRequest("/auth/register", {
          method: "POST",
          body: { ...credentials, firstName: form.get("firstName"), lastName: form.get("lastName") },
        }),
      async () => {
        await apiRequest("/auth/login", { method: "POST", body: credentials });
        router.replace("/banking");
        router.refresh();
      },
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="register-form">
      {error ? <Alert tone="error" testId="register-error">{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" autoComplete="given-name" testId="register-first-name" error={fieldErrors.firstName} />
        <Field label="Last name" name="lastName" autoComplete="family-name" testId="register-last-name" error={fieldErrors.lastName} />
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" testId="register-email" error={fieldErrors.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        testId="register-password"
        hint="At least 8 characters with upper and lower case letters, a number, and a special character."
        error={fieldErrors.password}
      />
      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        testId="register-confirm-password"
        error={fieldErrors.confirmPassword}
      />
      <button type="submit" disabled={pending} className={`${buttonStyles.primary} w-full`} data-testid="register-submit-button">
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
