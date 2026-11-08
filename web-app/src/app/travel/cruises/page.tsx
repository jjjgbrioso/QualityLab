import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { SailingCard, seaButton, seaInput } from "@/components/travel";
import { Alert, buttonStyles, EmptyState, Pagination } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { todayUtc } from "@/lib/dates";
import { parsePageQuery, pathWithQuery, type SearchParams } from "@/lib/page-helpers";
import { listCruiseFilters, listSailings, listShips } from "@/lib/services/cruises";
import { cruiseQuerySchema } from "@/lib/validation/cruises";

export const metadata: Metadata = { title: "Cruises" };

const SORT_LABELS: Record<string, string> = {
  departure_asc: "Soonest departure",
  price_asc: "Lowest price",
  price_desc: "Highest price",
  nights_asc: "Shortest first",
};

const FORM_ID = "cruise-filter-form";

export default async function CruisesPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  await requirePageUser(pathWithQuery("/travel/cruises", raw));
  const { query, errors } = parsePageQuery(raw, cruiseQuerySchema);
  const [{ items, meta }, filters, ships] = await Promise.all([listSailings(query), listCruiseFilters(), listShips()]);

  return (
    <div className="space-y-6">
      <section className="-mx-4 -mt-8 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 px-4 py-6 text-white sm:-mx-6 sm:px-6" data-testid="cruises-header">
        <Link href="/travel" className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300 hover:underline" data-testid="cruises-back-link">
          Travel & Cruise
        </Link>
        <h1 className="mt-1 text-3xl font-extrabold" data-testid="cruises-title">Find a cruise</h1>
        <form id={FORM_ID} method="get" action="/travel/cruises" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" data-testid="cruise-filter-form">
          <div className="lg:col-span-2">
            <label htmlFor="destination" className="mb-1 block text-xs font-semibold text-slate-200">Cruising to</label>
            <select id="destination" name="destination" defaultValue={query.destination ?? ""} className={seaInput} data-testid="cruise-destination-select">
              <option value="">Any destination</option>
              {filters.destinations.map((destination) => (
                <option key={destination} value={destination}>{destination}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="departurePort" className="mb-1 block text-xs font-semibold text-slate-200">Leaving from</label>
            <select id="departurePort" name="departurePort" defaultValue={query.departurePort ?? ""} className={seaInput} data-testid="cruise-port-select">
              <option value="">Any port</option>
              {filters.departurePorts.map((port) => (
                <option key={port} value={port}>{port}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ship" className="mb-1 block text-xs font-semibold text-slate-200">Ship</label>
            <select id="ship" name="ship" defaultValue={query.ship ?? ""} className={seaInput} data-testid="cruise-ship-select">
              <option value="">Any ship</option>
              {ships.map((ship) => (
                <option key={ship.id} value={ship.id}>{ship.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="month" className="mb-1 block text-xs font-semibold text-slate-200">Month</label>
            <input id="month" name="month" type="month" min={todayUtc().slice(0, 7)} defaultValue={query.month ?? ""} className={seaInput} data-testid="cruise-month-input" />
          </div>
          <div>
            <label htmlFor="guests" className="mb-1 block text-xs font-semibold text-slate-200">Guests</label>
            <input id="guests" name="guests" type="number" min={1} max={10} defaultValue={query.guests ?? ""} className={seaInput} data-testid="cruise-guests-input" />
          </div>
          <div>
            <label htmlFor="minNights" className="mb-1 block text-xs font-semibold text-slate-200">Min nights</label>
            <input id="minNights" name="minNights" type="number" min={1} max={30} defaultValue={query.minNights ?? ""} className={seaInput} data-testid="cruise-min-nights-input" />
          </div>
          <div>
            <label htmlFor="maxNights" className="mb-1 block text-xs font-semibold text-slate-200">Max nights</label>
            <input id="maxNights" name="maxNights" type="number" min={1} max={30} defaultValue={query.maxNights ?? ""} className={seaInput} data-testid="cruise-max-nights-input" />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" className={seaButton} data-testid="cruise-filter-submit">Search cruises</button>
            <Link href="/travel/cruises" className={`${buttonStyles.secondary} rounded-full`} data-testid="cruise-filter-clear">Clear</Link>
          </div>
        </form>
      </section>

      {errors.length > 0 ? (
        <div className="space-y-2" data-testid="cruise-filter-errors">
          {errors.map((error) => (
            <Alert key={`${error.field}-${error.message}`} tone="error" testId={`cruise-filter-error-${error.field ?? "form"}`}>
              {error.message}
            </Alert>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" data-testid="cruise-result-count">
          {meta.totalItems} {meta.totalItems === 1 ? "sailing" : "sailings"}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="whitespace-nowrap text-sm text-muted">Sort by</label>
          <AutoSubmitSelect id="sort" name="sort" form={FORM_ID} defaultValue={query.sort} className={`${seaInput} w-auto`} data-testid="cruise-sort-select">
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </AutoSubmitSelect>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No sailings match this search" testId="cruise-empty-state">
          Try another month, port, or fewer guests.
        </EmptyState>
      ) : (
        <div className="space-y-4" data-testid="sailing-list">
          {items.map((sailing) => (
            <SailingCard key={sailing.id} sailing={sailing} />
          ))}
        </div>
      )}

      <Pagination meta={meta} basePath="/travel/cruises" query={{ ...raw, page: undefined } as Record<string, string | undefined>} testId="cruise-pagination" />
    </div>
  );
}
