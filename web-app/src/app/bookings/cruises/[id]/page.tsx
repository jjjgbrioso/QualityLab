import type { Metadata } from "next";
import Link from "next/link";
import { CancelAction } from "@/components/forms/CancelAction";
import { Alert, Card, linkStyles, PageHeader, StatusBadge, SummaryRow } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { loadForPage, type SearchParams } from "@/lib/page-helpers";
import { getCruiseBooking } from "@/lib/services/cruise-bookings";

export const metadata: Metadata = { title: "Cruise booking" };

export default async function CruiseBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { booked } = await searchParams;
  const user = await requirePageUser(`/bookings/cruises/${id}`);
  const booking = await loadForPage(() => getCruiseBooking(user, id));

  return (
    <>
      <Link href="/bookings?type=cruises" className={linkStyles} data-testid="cruise-booking-back-link">
        Back to cruises
      </Link>
      <div className="mt-4">
        <PageHeader
          title={booking.bookingNumber}
          description={`${booking.sailing.title} on ${booking.ship.name}`}
          actions={<StatusBadge status={booking.status} testId="cruise-booking-detail-status" />}
          testId="cruise-booking-detail"
        />
      </div>

      {booked === "1" && booking.status === "CONFIRMED" ? (
        <div className="mb-4">
          <Alert tone="success" testId="cruise-booking-confirmation">
            Your cruise is booked. Booking number {booking.bookingNumber}.
          </Alert>
        </div>
      ) : null}

      <Card className="max-w-lg p-5" testId="cruise-booking-summary">
        <SummaryRow label="Sailing" value={booking.sailing.title} testId="cruise-booking-detail-sailing" />
        <SummaryRow label="Ship" value={booking.ship.name} testId="cruise-booking-detail-ship" />
        <SummaryRow label="Departs" value={`${formatDisplayDate(booking.sailing.departureDate)} from ${booking.sailing.departurePort}`} testId="cruise-booking-detail-departs" />
        <SummaryRow label="Returns" value={formatDisplayDate(booking.sailing.returnDate)} testId="cruise-booking-detail-returns" />
        <SummaryRow label="Cabin" value={booking.cabin.name} testId="cruise-booking-detail-cabin" />
        <SummaryRow label="Guests" value={String(booking.guests)} testId="cruise-booking-detail-guests" />
        <SummaryRow label="Lead guest" value={booking.leadGuestName || "Not recorded"} testId="cruise-booking-detail-lead-guest" />
        <SummaryRow label="Price per guest" value={formatCents(booking.cabin.pricePerGuestCents)} testId="cruise-booking-detail-price" />
        <div className="mt-2 border-t border-line pt-2">
          <SummaryRow label="Total" value={formatCents(booking.totalCents)} testId="cruise-booking-detail-total" strong />
        </div>
      </Card>

      {booking.canCancel ? (
        <div className="mt-4">
          <CancelAction endpoint={`/cruise-bookings/${booking.id}/cancel`} label="Cancel cruise" testId="cruise-booking-cancel" />
        </div>
      ) : null}
    </>
  );
}
