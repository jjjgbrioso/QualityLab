"use client";

import { type InputHTMLAttributes, useState } from "react";
import { describedBy, type Shared, Wrapper } from "@/components/forms/fields";
import { inputStyles } from "@/components/ui";

/**
 * A password input with a show/hide button. Test ids match `Field` (`<testId>-input`, `-label`, `-error`),
 * plus `<testId>-toggle` for the button, so existing selectors keep working.
 */
export function PasswordField({
  label,
  testId,
  error,
  hint,
  name,
  ...input
}: Shared & { name: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const id = input.id ?? name;
  return (
    <Wrapper id={id} label={label} testId={testId} error={error} hint={hint}>
      <div className="relative">
        <input
          {...input}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          className={`${inputStyles} pr-12`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          data-testid={`${testId}-input`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-700"
          data-testid={`${testId}-toggle`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
            {visible ? (
              <>
                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                <path d="m2 2 20 20" />
              </>
            ) : (
              <>
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
    </Wrapper>
  );
}
