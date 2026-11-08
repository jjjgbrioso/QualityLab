import Link from "next/link";
import { Photo, ShipArt } from "@/components/art";
import { Badge } from "@/components/ui";
import { formatDisplayDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import type { SailingSummaryDto } from "@/lib/services/cruises";

/** Travel accent: navy with a gold call to action, shared by every cruise and hotel screen. */
export const seaButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500";

export const seaInput =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-amber-500 aria-[invalid=true]:border-red-600";

export function Itinerary({ ports, compact = false }: { ports: string[]; compact?: boolean }) {
  return (
    <p className={`text-muted ${compact ? "text-xs" : "text-sm"}`}>
      {ports.map((port, index) => (
        <span key={`${port}-${index}`}>
          {index > 0 ? <span aria-hidden="true"> → </span> : null}
          {index > 0 ? <span className="sr-only">, then </span> : null}
          {port}
        </span>
      ))}
    </p>
  );
}

export function SailingCard({ sailing }: { sailing: SailingSummaryDto }) {
  return (
    <article className="grid overflow-hidden rounded-xl border border-line bg-surface shadow-sm md:grid-cols-[260px_1fr]" data-testid={`sailing-card-${sailing.id}`}>
      {sailing.imageUrl ? (
        <Photo src={sailing.imageUrl} alt="" className="h-40 md:h-full md:min-h-44" sizes="(min-width: 768px) 260px, 100vw" testId={`sailing-image-${sailing.id}`} />
      ) : (
        <ShipArt seed={sailing.ship.id} className="h-40 md:h-full" testId={`sailing-image-placeholder-${sailing.id}`} />
      )}
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">{sailing.ship.name}</p>
          <h2 className="text-lg font-bold leading-snug" data-testid={`sailing-title-${sailing.id}`}>{sailing.title}</h2>
          <Itinerary ports={sailing.ports} compact />
          <p className="text-sm" data-testid={`sailing-dates-${sailing.id}`}>
            {formatDisplayDate(sailing.departureDate)} to {formatDisplayDate(sailing.returnDate)} · {sailing.nights} nights
          </p>
          {sailing.soldOut ? (
            <Badge tone="danger" testId={`sailing-sold-out-${sailing.id}`}>Sold out</Badge>
          ) : (
            <Badge tone="success" testId={`sailing-cabins-left-${sailing.id}`}>{sailing.cabinsLeft} cabins left</Badge>
          )}
        </div>
        <div className="shrink-0 text-left md:text-right">
          <p className="text-xs text-muted">From, per guest</p>
          <p className="text-2xl font-bold text-blue-900" data-testid={`sailing-price-${sailing.id}`}>{formatCents(sailing.fromPricePerGuestCents)}</p>
          <Link href={`/travel/cruises/${sailing.id}`} className={`${seaButton} mt-2`} data-testid={`sailing-view-${sailing.id}`}>
            View sailing
          </Link>
        </div>
      </div>
    </article>
  );
}
