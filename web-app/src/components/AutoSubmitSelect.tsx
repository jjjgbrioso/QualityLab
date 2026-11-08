"use client";

import type { SelectHTMLAttributes } from "react";

/** A select that submits its form on change. Without JavaScript, the form's own button still works. */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}
