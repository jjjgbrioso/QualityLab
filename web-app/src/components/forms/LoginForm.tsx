"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Field, SelectField } from "@/components/forms/fields";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";
import { APP_MODULES, type AppModule, isAppModule, MODULE_HOME, MODULE_LABELS } from "@/lib/modules";

/**
 * Signs in to one module. When the page being opened belongs to a module, that module is fixed.
 * Otherwise, such as on /login itself, the visitor chooses one.
 */
export function LoginForm({ next, module }: { next: string; module: AppModule | null }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit, setFieldErrors, reset } = useSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chosen = module ?? form.get("module");
    reset();
    if (!isAppModule(chosen)) {
      setFieldErrors({ module: "Choose a module." });
      return;
    }
    await submit(
      () =>
        apiRequest("/auth/login", {
          method: "POST",
          body: { email: form.get("email"), password: form.get("password"), module: chosen },
        }),
      () => {
        router.replace(module || next !== "/" ? next : MODULE_HOME[chosen]);
        router.refresh();
      },
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-4" data-testid="login-form">
      {error ? <Alert tone="error" testId="login-error">{error}</Alert> : null}
      {module ? null : (
        <SelectField label="Module" name="module" defaultValue="" testId="login-module" error={fieldErrors.module}>
          <option value="" disabled>
            Choose a module
          </option>
          {APP_MODULES.map((value) => (
            <option key={value} value={value}>
              {MODULE_LABELS[value]}
            </option>
          ))}
        </SelectField>
      )}
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
        {pending ? "Signing in..." : module ? `Sign in to ${MODULE_LABELS[module]}` : "Sign in"}
      </button>
    </form>
  );
}
