import type { Metadata } from "next";
import Link from "next/link";
import { CancelAction } from "@/components/forms/CancelAction";
import { Alert, Card, linkStyles, PageHeader, StatusBadge, SummaryRow } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { loadForPage, type SearchParams } from "@/lib/page-helpers";
import { getBooking } from "@/lib/services/bookings";

export const metadata: Metadata = { title: "Booking details" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { booked } = await searchParams;
  const user = await requirePageUser(`/bookings/${id}`);
  const booking = await loadForPage(() => getBooking(user, id));

  return (
    <>
      <Link href="/bookings" className={linkStyles} data-testid="booking-back-link">
        Back to bookings
      </Link>
      <div className="mt-4">
        <PageHeader
          title={booking.bookingNumber}
          description={`${booking.hotel.name}, ${booking.hotel.city}`}
          actions={<StatusBadge status={booking.status} testId="booking-detail-status" />}
          testId="booking-detail"
        />
      </div>

      {booked === "1" && booking.status === "CONFIRMED" ? (
        <div className="mb-4">
          <Alert tone="success" testId="booking-confirmation">Your booking is confirmed.</Alert>
        </div>
      ) : null}

      <Card className="max-w-lg p-5" testId="booking-detail-summary">
        <SummaryRow label="Room" value={booking.room.name} testId="booking-detail-room" />
        <SummaryRow label="Check-in" value={formatDisplayDate(booking.checkIn)} testId="booking-detail-check-in" />
        <SummaryRow label="Check-out" value={formatDisplayDate(booking.checkOut)} testId="booking-detail-check-out" />
        <SummaryRow label="Nights" value={String(booking.nights)} testId="booking-detail-nights" />
        <SummaryRow label="Guests" value={String(booking.guests)} testId="booking-detail-guests" />
        <SummaryRow label="Lead guest" value={booking.leadGuestName || "Not recorded"} testId="booking-detail-lead-guest" />
        <div className="mt-2 border-t border-line pt-2">
          <SummaryRow label="Total" value={formatCents(booking.totalCents)} testId="booking-detail-total" strong />
        </div>
      </Card>

      {booking.canCancel ? (
        <div className="mt-4">
          <CancelAction endpoint={`/bookings/${booking.id}/cancel`} label="Cancel booking" testId="booking-cancel" />
        </div>
      ) : null}
    </>
  );
}
