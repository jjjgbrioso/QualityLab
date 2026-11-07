import type { Metadata } from "next";
import Link from "next/link";
import { BookRoomButton } from "@/components/forms/BookRoomButton";
import { StayFilter } from "@/components/StayFilter";
import { Alert, buttonStyles, Card, linkStyles, PageHeader, SummaryRow } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { formatDisplayDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { loadForPage, parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { getRoom } from "@/lib/services/hotels";
import { stayQuerySchema } from "@/lib/validation/travel";

export const metadata: Metadata = { title: "Room" };

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const raw = await searchParams;
  const { query, errors } = parsePageQuery(raw, stayQuerySchema);
  const [room, user] = await Promise.all([loadForPage(() => getRoom(id, query)), getSessionUser()]);

  const { checkIn, checkOut } = query;
  const guests = query.guests ?? 2;
  const tooManyGuests = guests > room.maxGuests;
  const canBook = errors.length === 0 && room.available === true && !tooManyGuests;
  const here = `/travel/rooms/${id}?${new URLSearchParams({ checkIn: checkIn ?? "", checkOut: checkOut ?? "", guests: String(guests) })}`;

  return (
    <>
      <Link href={`/travel/hotels/${room.hotelId}`} className={linkStyles} data-testid="room-back-link">
        Back to {room.hotel.name}
      </Link>
      <div className="mt-4">
        <PageHeader
          title={room.name}
          description={`${room.hotel.name}, ${room.hotel.city}`}
          testId="room-detail"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <p className="text-sm text-muted" data-testid="room-description">{room.description}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted">Room type</dt>
              <dd data-testid="room-type">{room.type}</dd>
              <dt className="text-muted">Sleeps</dt>
              <dd data-testid="room-max-guests">{room.maxGuests} guests</dd>
              <dt className="text-muted">Nightly rate</dt>
              <dd data-testid="room-nightly-rate">{formatCents(room.pricePerNightCents)}</dd>
            </dl>
          </Card>
          <Card className="p-4">
            <StayFilter action={`/travel/rooms/${room.id}`} checkIn={checkIn} checkOut={checkOut} guests={query.guests} />
          </Card>
          {errors.length > 0 ? (
            <div className="space-y-2" data-testid="stay-filter-errors">
              {errors.map((error) => (
                <Alert key={`${error.field}-${error.message}`} tone="error" testId={`stay-error-${error.field ?? "form"}`}>
                  {error.message}
                </Alert>
              ))}
            </div>
          ) : null}
        </div>

        <Card className="h-fit space-y-3 p-5" testId="booking-summary">
          <h2 className="font-semibold">Your stay</h2>
          {room.available === null || !checkIn || !checkOut ? (
            <p className="text-sm text-muted" data-testid="booking-choose-dates">Choose dates to see availability.</p>
          ) : (
            <>
              <div>
                <SummaryRow label="Check-in" value={formatDisplayDate(checkIn)} testId="booking-check-in" />
                <SummaryRow label="Check-out" value={formatDisplayDate(checkOut)} testId="booking-check-out" />
                <SummaryRow label="Nights" value={String(room.nights)} testId="booking-nights" />
                <SummaryRow label="Guests" value={String(guests)} testId="booking-guests" />
                <div className="mt-2 border-t border-line pt-2">
                  <SummaryRow label="Total" value={formatCents(room.stayTotalCents ?? 0)} testId="booking-total" strong />
                </div>
              </div>
              {room.available === false ? (
                <Alert tone="error" testId="booking-sold-out">This room is sold out for these dates.</Alert>
              ) : null}
              {tooManyGuests ? (
                <Alert tone="error" testId="booking-guest-limit">This room sleeps at most {room.maxGuests} guests.</Alert>
              ) : null}
              {canBook && user ? <BookRoomButton roomId={room.id} checkIn={checkIn} checkOut={checkOut} guests={guests} /> : null}
              {canBook && !user ? (
                <Link href={`/login?next=${encodeURIComponent(here)}`} className={buttonStyles.primary} data-testid="booking-login-link">
                  Sign in to book
                </Link>
              ) : null}
            </>
          )}
        </Card>
      </div>
    </>
  );
}
