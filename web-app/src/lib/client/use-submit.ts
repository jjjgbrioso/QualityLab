"use client";

import { useState, useSyncExternalStore } from "react";
import type { ApiFailure, ApiResult } from "@/lib/client/api";

const noSubscription = () => () => {};

/**
 * False in the server HTML, true once React is running. Submit buttons stay disabled until then,
 * so an early click cannot fall back to a plain browser submit that skips validation.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}

/** Tracks the pending and error state of one form. Field errors are keyed by API field path. */
export function useSubmit() {
  const ready = useHydrated();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function showFailure(failure: ApiFailure) {
    const fields: Record<string, string> = {};
    for (const detail of failure.details) {
      if (detail.field && !fields[detail.field]) fields[detail.field] = detail.message;
    }
    setFieldErrors(fields);
    setError(failure.message);
  }

  function reset() {
    setError(null);
    setFieldErrors({});
  }

  async function submit<T>(request: () => Promise<ApiResult<T>>, onSuccess: (data: T) => void) {
    if (pending) return;
    setPending(true);
    reset();
    const result = await request();
    setPending(false);
    if (result.ok) onSuccess(result.data);
    else showFailure(result);
  }

  return { ready, pending, error, fieldErrors, submit, setError, setFieldErrors, reset };
}
