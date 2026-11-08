/** Placeholder shown while a page loads. Automation can wait for `page-loading` to disappear. */
export function PageSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading" aria-live="polite" data-testid="page-loading" className="animate-pulse">
      <div className="mb-3 h-8 w-56 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-80 max-w-full rounded bg-slate-200" />
      <div className="mb-6 h-28 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="h-56 rounded-lg bg-slate-200" />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
