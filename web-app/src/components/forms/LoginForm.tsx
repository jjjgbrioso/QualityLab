"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit } = useSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submit(
      () =>
        apiRequest("/auth/login", {
          method: "POST",
          body: { email: form.get("email"), password: form.get("password") },
        }),
      () => {
        router.replace(next);
        router.refresh();
      },
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-4" data-testid="login-form">
      {error ? <Alert tone="error" testId="login-error">{error}</Alert> : null}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        testId="login-email"
        error={fieldErrors.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        testId="login-password"
        error={fieldErrors.password}
      />
      <button type="submit" disabled={!ready || pending} className={`${buttonStyles.primary} w-full`} data-testid="login-submit-button">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
