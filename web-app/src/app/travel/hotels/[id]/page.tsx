import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/art";
import { StayFilter } from "@/components/StayFilter";
import { Alert, Badge, buttonStyles, Card, linkStyles, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { loadForPage, parsePageQuery, pathWithQuery, type SearchParams } from "@/lib/page-helpers";
import { getHotel } from "@/lib/services/hotels";
import { stayQuerySchema } from "@/lib/validation/travel";

export const metadata: Metadata = { title: "Hotel" };

export default async function HotelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const raw = await searchParams;
  await requirePageUser(pathWithQuery(`/travel/hotels/${id}`, raw));
  const { query, errors } = parsePageQuery(raw, stayQuerySchema);
  const hotel = await loadForPage(() => getHotel(id, query));

  const stayQuery = new URLSearchParams();
  if (query.checkIn && query.checkOut) {
    stayQuery.set("checkIn", query.checkIn);
    stayQuery.set("checkOut", query.checkOut);
  }
  if (query.guests) stayQuery.set("guests", String(query.guests));
  const staySuffix = stayQuery.size > 0 ? `?${stayQuery}` : "";

  return (
    <>
      <Link href="/travel/hotels" className={linkStyles} data-testid="hotel-back-link">
        Back to hotels
      </Link>
      <div className="mt-4">
        <PageHeader
          title={hotel.name}
          description={`${hotel.address}, ${hotel.city}, ${hotel.country} · ${hotel.starRating} star`}
          testId="hotel-detail"
        />
      </div>

      {hotel.imageUrl ? (
        <Photo src={hotel.imageUrl} alt={hotel.name} className="mb-4 h-56 rounded-xl sm:h-72" priority testId="hotel-detail-image" />
      ) : null}
      <p className="mb-3 text-sm text-muted" data-testid="hotel-description">{hotel.description}</p>
      <div className="mb-6 flex flex-wrap gap-1" data-testid="hotel-amenities">
        {hotel.amenities.map((amenity) => (
          <Badge key={amenity}>{amenity}</Badge>
        ))}
      </div>

      <Card className="mb-6 p-4">
        <StayFilter action={`/travel/hotels/${hotel.id}`} checkIn={query.checkIn} checkOut={query.checkOut} guests={query.guests} />
      </Card>

      {errors.length > 0 ? (
        <div className="mb-4 space-y-2" data-testid="stay-filter-errors">
          {errors.map((error) => (
            <Alert key={`${error.field}-${error.message}`} tone="error" testId={`stay-error-${error.field ?? "form"}`}>
              {error.message}
            </Alert>
          ))}
        </div>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold">Rooms</h2>
      <div className="space-y-3" data-testid="room-list">
        {hotel.rooms.map((room) => (
          <Card key={room.id} className="flex flex-wrap items-center justify-between gap-4 p-4" testId={`room-card-${room.id}`}>
            <div>
              <h3 className="font-medium" data-testid={`room-name-${room.id}`}>{room.name}</h3>
              <p className="text-xs text-muted">Sleeps up to {room.maxGuests} guests</p>
            </div>
            <div className="flex items-center gap-4">
              {room.available === true ? <Badge tone="success" testId={`room-available-${room.id}`}>{room.availableRooms} left</Badge> : null}
              {room.available === false ? <Badge tone="danger" testId={`room-sold-out-${room.id}`}>Sold out</Badge> : null}
              <p className="text-sm">
                <span className="font-semibold" data-testid={`room-price-${room.id}`}>{formatCents(room.pricePerNightCents)}</span> per night
              </p>
              <Link href={`/travel/rooms/${room.id}${staySuffix}`} className={buttonStyles.secondary} data-testid={`room-view-${room.id}`}>
                View room
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
