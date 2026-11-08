import type { Metadata } from "next";
import Link from "next/link";
import { Alert, buttonStyles, Card, EmptyState, inputStyles, linkStyles, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { listBookings } from "@/lib/services/bookings";
import { listCruiseBookings } from "@/lib/services/cruise-bookings";
import { BOOKING_STATUSES, bookingQuerySchema } from "@/lib/validation/travel";

export const metadata: Metadata = { title: "Bookings" };

const TABS = [
  { type: "hotels", label: "Hotel stays", href: "/bookings" },
  { type: "cruises", label: "Cruises", href: "/bookings?type=cruises" },
] as const;

export default async function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const type = raw.type === "cruises" ? "cruises" : "hotels";
  const user = await requirePageUser(type === "cruises" ? "/bookings?type=cruises" : "/bookings");
  const { query, errors } = parsePageQuery(raw, bookingQuerySchema);

  return (
    <>
      <PageHeader title="Booking history" testId="bookings" />

      <nav aria-label="Booking type" className="mb-4 flex gap-2 border-b border-line" data-testid="bookings-tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={tab.href}
            aria-current={type === tab.type ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${type === tab.type ? "border-brand-700 text-ink" : "border-transparent text-muted hover:text-ink"}`}
            data-testid={`bookings-tab-${tab.type}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <form method="get" action="/bookings" className="mb-4 flex flex-wrap items-end gap-3" data-testid="booking-filter-form">
        {type === "cruises" ? <input type="hidden" name="type" value="cruises" /> : null}
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium">Status</label>
          <select id="status" name="status" defaultValue={query.status ?? ""} className={inputStyles} data-testid="booking-status-select">
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonStyles.secondary} data-testid="booking-filter-submit">Apply</button>
      </form>

      {errors.length > 0 ? <Alert tone="error" testId="booking-filter-error">{errors[0].message}</Alert> : null}

      {type === "hotels" ? <HotelBookings userId={user.id} query={query} /> : <CruiseBookings userId={user.id} query={query} />}
    </>
  );
}

type Query = ReturnType<typeof bookingQuerySchema.parse>;

async function HotelBookings({ userId, query }: { userId: string; query: Query }) {
  const { items, meta } = await listBookings(query, userId);
  return (
    <>
      {items.length === 0 ? (
        <EmptyState title="No hotel stays yet" testId="bookings-empty-state">
          <Link href="/travel/hotels" className={linkStyles}>Find a hotel</Link>
        </EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="bookings-table">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Booking</th>
                <th scope="col" className="p-3 font-medium">Hotel</th>
                <th scope="col" className="p-3 font-medium">Dates</th>
                <th scope="col" className="p-3 font-medium">Status</th>
                <th scope="col" className="p-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((booking) => (
                <tr key={booking.id} className="border-b border-line last:border-0" data-testid={`booking-row-${booking.id}`}>
                  <td className="p-3">
                    <Link href={`/bookings/${booking.id}`} className={linkStyles} data-testid={`booking-link-${booking.id}`}>
                      {booking.bookingNumber}
                    </Link>
                  </td>
                  <td className="p-3">{booking.hotel.name}</td>
                  <td className="whitespace-nowrap p-3 text-muted">
                    {formatDisplayDate(booking.checkIn)} to {formatDisplayDate(booking.checkOut)}
                  </td>
                  <td className="p-3"><StatusBadge status={booking.status} testId={`booking-status-${booking.id}`} /></td>
                  <td className="p-3 text-right font-medium">{formatCents(booking.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination meta={meta} basePath="/bookings" query={{ status: query.status }} testId="booking-pagination" />
    </>
  );
}

async function CruiseBookings({ userId, query }: { userId: string; query: Query }) {
  const { items, meta } = await listCruiseBookings(query, userId);
  return (
    <>
      {items.length === 0 ? (
        <EmptyState title="No cruises yet" testId="cruise-bookings-empty-state">
          <Link href="/travel/cruises" className={linkStyles}>Find a cruise</Link>
        </EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="cruise-bookings-table">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Booking</th>
                <th scope="col" className="p-3 font-medium">Sailing</th>
                <th scope="col" className="p-3 font-medium">Departs</th>
                <th scope="col" className="p-3 font-medium">Status</th>
                <th scope="col" className="p-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((booking) => (
                <tr key={booking.id} className="border-b border-line last:border-0" data-testid={`cruise-booking-row-${booking.id}`}>
                  <td className="p-3">
                    <Link href={`/bookings/cruises/${booking.id}`} className={linkStyles} data-testid={`cruise-booking-link-${booking.id}`}>
                      {booking.bookingNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    {booking.sailing.title}
                    <span className="block text-xs text-muted">{booking.ship.name} · {booking.cabin.name}</span>
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted">{formatDisplayDate(booking.sailing.departureDate)}</td>
                  <td className="p-3"><StatusBadge status={booking.status} testId={`cruise-booking-status-${booking.id}`} /></td>
                  <td className="p-3 text-right font-medium">{formatCents(booking.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination meta={meta} basePath="/bookings" query={{ type: "cruises", status: query.status }} testId="cruise-booking-pagination" />
    </>
  );
}
