"use client";

import type { ReactNode } from "react";
import type { ZodType } from "zod";

/** Shared pieces for the multi-step banking forms. */

export type FormValues = Record<string, string | boolean | undefined>;
export type FieldErrors = Record<string, string>;

/** Validates a step. Errors are keyed by the dotted field path, such as "current.city". */
export function checkStep<T>(schema: ZodType<T>, input: unknown): { value?: T; errors: FieldErrors } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { value: parsed.data, errors: {} };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) errors[issue.path.map(String).join(".") || "form"] ??= issue.message;
  return { errors };
}

/** Reads every named control in a form. Checkboxes give booleans; unchosen radio groups are left out. */
export function readForm(form: HTMLFormElement): FormValues {
  const values: FormValues = {};
  for (const element of Array.from(form.elements)) {
    const input = element as HTMLInputElement;
    if (!input.name) continue;
    if (input.type === "checkbox") values[input.name] = input.checked;
    else if (input.type === "radio") {
      if (input.checked) values[input.name] = input.value;
    } else values[input.name] = input.value;
  }
  return values;
}

export function StepProgress({ steps, current, testId }: { steps: readonly string[]; current: number; testId: string }) {
  return (
    <ol className="mb-6 flex flex-wrap gap-1.5" aria-label="Application steps" data-testid={testId}>
      {steps.map((name, index) => (
        <li
          key={name}
          aria-current={index === current ? "step" : undefined}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index === current ? "bg-emerald-800 text-white" : index < current ? "bg-emerald-100 text-emerald-900" : "bg-canvas text-muted ring-1 ring-line"}`}
          data-testid={`${testId}-${index + 1}`}
        >
          {index + 1}. {name}
        </li>
      ))}
    </ol>
  );
}

export function CheckboxField({ name, children, checked, error, testId }: { name: string; children: ReactNode; checked: boolean; error?: string; testId: string }) {
  const errorId = `${name.replace(/\./g, "-")}-error`;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-4 w-4 accent-emerald-800"
          data-testid={`${testId}-checkbox`}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={errorId} className="ml-7 mt-1 text-xs text-red-700" data-testid={`${testId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A yes-or-no question as two radio buttons, so "not answered" stays distinct from "no". */
export function YesNoField({ name, question, value, error, testId }: { name: string; question: string; value?: string | boolean; error?: string; testId: string }) {
  const errorId = `${name.replace(/\./g, "-")}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined} data-testid={testId}>
      <legend className="mb-1 text-sm font-medium">{question}</legend>
      <div className="flex gap-4 text-sm">
        {(["yes", "no"] as const).map((option) => (
          <label key={option} className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={value === option}
              className="accent-emerald-800"
              data-testid={`${testId}-${option}`}
            />
            {option === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-700" data-testid={`${testId}-error`}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** "yes" and "no" become booleans; anything else stays undefined, so validation can ask for an answer. */
export const yesNoValue = (value: string | boolean | undefined) => (value === "yes" ? true : value === "no" ? false : undefined);
