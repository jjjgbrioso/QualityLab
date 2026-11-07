import type { Metadata } from "next";
import Link from "next/link";
import { Alert, buttonStyles, Card, EmptyState, inputStyles, linkStyles, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { listBookings } from "@/lib/services/bookings";
import { BOOKING_STATUSES, bookingQuerySchema } from "@/lib/validation/travel";

export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageUser("/bookings");
  const { query, errors } = parsePageQuery(await searchParams, bookingQuerySchema);
  const { items, meta } = await listBookings(query, user.id);

  return (
    <>
      <PageHeader title="Booking history" testId="bookings" />
      <form method="get" action="/bookings" className="mb-4 flex flex-wrap items-end gap-3" data-testid="booking-filter-form">
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

      {items.length === 0 ? (
        <EmptyState title="No bookings yet" testId="bookings-empty-state">
          <Link href="/travel" className={linkStyles}>Find a hotel</Link>
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
