"use client";

import { buttonStyles } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="py-16 text-center" data-testid="error-page">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">The page could not be loaded. Try again in a moment.</p>
      <button type="button" onClick={reset} className={`${buttonStyles.primary} mt-5`} data-testid="error-retry-button">
        Try again
      </button>
    </div>
  );
}
