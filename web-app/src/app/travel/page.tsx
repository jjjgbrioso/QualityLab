import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Badge, buttonStyles, Card, EmptyState, inputStyles, PageHeader, Pagination, Thumb } from "@/components/ui";
import { formatCents } from "@/lib/money";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { listAmenities, listHotels } from "@/lib/services/hotels";
import { hotelQuerySchema } from "@/lib/validation/travel";

export const metadata: Metadata = { title: "Travel" };

const SORT_LABELS: Record<string, string> = {
  name_asc: "Name: A to Z",
  price_asc: "Lowest price",
  price_desc: "Highest price",
  stars_desc: "Highest rated",
};

export default async function TravelPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const { query, errors } = parsePageQuery(raw, hotelQuerySchema);
  const [{ items, meta }, amenities] = await Promise.all([listHotels(query), listAmenities()]);

  const stayQuery = new URLSearchParams();
  if (query.checkIn && query.checkOut) {
    stayQuery.set("checkIn", query.checkIn);
    stayQuery.set("checkOut", query.checkOut);
  }
  if (query.guests) stayQuery.set("guests", String(query.guests));
  const staySuffix = stayQuery.size > 0 ? `?${stayQuery}` : "";

  return (
    <>
      <PageHeader title="Travel" description="Search fictional hotels and book simulated stays." testId="travel" />

      <form method="get" action="/travel" className="mb-6" data-testid="hotel-filter-form">
        <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="destination" className="mb-1 block text-xs font-medium">Destination</label>
            <input id="destination" name="destination" type="search" defaultValue={query.destination ?? ""} placeholder="City, country, or hotel" className={inputStyles} data-testid="hotel-destination-input" />
          </div>
          <div>
            <label htmlFor="checkIn" className="mb-1 block text-xs font-medium">Check-in</label>
            <input id="checkIn" name="checkIn" type="date" defaultValue={query.checkIn ?? ""} className={inputStyles} data-testid="hotel-check-in-input" />
          </div>
          <div>
            <label htmlFor="checkOut" className="mb-1 block text-xs font-medium">Check-out</label>
            <input id="checkOut" name="checkOut" type="date" defaultValue={query.checkOut ?? ""} className={inputStyles} data-testid="hotel-check-out-input" />
          </div>
          <div>
            <label htmlFor="guests" className="mb-1 block text-xs font-medium">Guests</label>
            <input id="guests" name="guests" type="number" min={1} max={10} defaultValue={query.guests ?? ""} className={inputStyles} data-testid="hotel-guests-input" />
          </div>
          <div>
            <label htmlFor="minStars" className="mb-1 block text-xs font-medium">Minimum stars</label>
            <select id="minStars" name="minStars" defaultValue={query.minStars ?? ""} className={inputStyles} data-testid="hotel-stars-select">
              <option value="">Any rating</option>
              {[2, 3, 4, 5].map((stars) => (
                <option key={stars} value={stars}>{stars} stars or more</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amenity" className="mb-1 block text-xs font-medium">Amenity</label>
            <select id="amenity" name="amenity" defaultValue={query.amenity ?? ""} className={inputStyles} data-testid="hotel-amenity-select">
              <option value="">Any amenity</option>
              {amenities.map((amenity) => (
                <option key={amenity} value={amenity}>{amenity}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="mb-1 block text-xs font-medium">Sort by</label>
            <select id="sort" name="sort" defaultValue={query.sort} className={inputStyles} data-testid="hotel-sort-select">
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
            <button type="submit" className={buttonStyles.primary} data-testid="hotel-filter-submit">Search</button>
            <Link href="/travel" className={buttonStyles.secondary} data-testid="hotel-filter-clear">Clear</Link>
          </div>
        </Card>
      </form>

      {errors.length > 0 ? (
        <div className="mb-4 space-y-2" data-testid="hotel-filter-errors">
          {errors.map((error) => (
            <Alert key={`${error.field}-${error.message}`} tone="error" testId={`hotel-filter-error-${error.field ?? "form"}`}>
              {error.message}
            </Alert>
          ))}
        </div>
      ) : null}

      <p className="mb-3 text-sm text-muted" data-testid="hotel-result-count">
        {meta.totalItems} {meta.totalItems === 1 ? "hotel" : "hotels"}
      </p>

      {items.length === 0 ? (
        <EmptyState title="No hotels match this search" testId="hotel-empty-state">
          Try other dates or fewer filters.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="hotel-grid">
          {items.map((hotel) => (
            <Link key={hotel.id} href={`/travel/hotels/${hotel.id}${staySuffix}`} className="group" data-testid={`hotel-card-${hotel.id}`}>
              <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-brand-700">
                <Thumb seed={hotel.city} label={hotel.city.slice(0, 2)} className="h-28" />
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h2 className="font-medium" data-testid={`hotel-name-${hotel.id}`}>{hotel.name}</h2>
                  <p className="text-xs text-muted">
                    {hotel.city}, {hotel.country} · {hotel.starRating} star
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {hotel.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity}>{amenity}</Badge>
                    ))}
                  </div>
                  <p className="mt-auto pt-2 text-sm">
                    From{" "}
                    <span className="font-semibold" data-testid={`hotel-price-${hotel.id}`}>
                      {formatCents(hotel.fromPriceCents)}
                    </span>{" "}
                    per night
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination meta={meta} basePath="/travel" query={{ ...raw, page: undefined } as Record<string, string | undefined>} testId="hotel-pagination" />
    </>
  );
}
