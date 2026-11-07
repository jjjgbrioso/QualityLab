import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { inputStyles } from "@/components/ui";

type Shared = { label: string; testId: string; error?: string; hint?: string };

function Wrapper({ id, label, testId, error, hint, children }: Shared & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium" data-testid={`${testId}-label`}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700" data-testid={`${testId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

/** A labelled input. Test ids follow `<testId>-input`, `<testId>-label`, and `<testId>-error`. */
export function Field({
  label,
  testId,
  error,
  hint,
  name,
  ...input
}: Shared & { name: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = input.id ?? name;
  return (
    <Wrapper id={id} label={label} testId={testId} error={error} hint={hint}>
      <input
        {...input}
        id={id}
        name={name}
        className={inputStyles}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        data-testid={`${testId}-input`}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  testId,
  error,
  hint,
  name,
  children,
  ...select
}: Shared & { name: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = select.id ?? name;
  return (
    <Wrapper id={id} label={label} testId={testId} error={error} hint={hint}>
      <select
        {...select}
        id={id}
        name={name}
        className={inputStyles}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        data-testid={`${testId}-select`}
      >
        {children}
      </select>
    </Wrapper>
  );
}
