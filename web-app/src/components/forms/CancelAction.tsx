"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

/** A two-step cancel, shown inline so automation needs no native browser dialog. */
export function CancelAction({ endpoint, label, testId }: { endpoint: string; label: string; testId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const { ready, pending, error, submit } = useSubmit();

  const confirm = () =>
    submit(
      () => apiRequest(endpoint, { method: "POST" }),
      () => {
        setConfirming(false);
        router.refresh();
      },
    );

  return (
    <div className="space-y-2">
      {error ? <Alert tone="error" testId={`${testId}-error`}>{error}</Alert> : null}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Are you sure?</span>
          <button type="button" disabled={!ready || pending} onClick={confirm} className={buttonStyles.danger} data-testid={`${testId}-confirm`}>
            {pending ? "Cancelling..." : "Yes, cancel"}
          </button>
          <button
            type="button"
            disabled={!ready || pending}
            onClick={() => setConfirming(false)}
            className={buttonStyles.secondary}
            data-testid={`${testId}-dismiss`}
          >
            Keep it
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={buttonStyles.secondary} data-testid={`${testId}-button`}>
          {label}
        </button>
      )}
    </div>
  );
}
