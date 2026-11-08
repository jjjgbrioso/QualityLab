import type { Hotel, Prisma, Room } from "@/generated/prisma/client";
import { notFound } from "@/lib/api/errors";
import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { addDays, formatDateOnly, nightsBetween, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type { HotelQuery, StayQuery } from "@/lib/validation/travel";

type Stay = { checkIn: string; checkOut: string };
type Span = Stay;

/** The most rooms taken on any single night of the stay. Half-open, so check-out day is free. */
export function peakOccupancy(bookings: Span[], { checkIn, checkOut }: Stay): number {
  let peak = 0;
  for (let night = checkIn; night < checkOut; night = addDays(night, 1)) {
    const occupied = bookings.filter((booking) => booking.checkIn <= night && booking.checkOut > night).length;
    peak = Math.max(peak, occupied);
  }
  return peak;
}

type BookingReader = Pick<Prisma.TransactionClient, "booking">;

/** Returns rooms left per room id, using one query however many rooms are checked. */
export async function roomsLeftByRoom(client: BookingReader, rooms: Pick<Room, "id" | "quantity">[], stay: Stay) {
  const bookings = await client.booking.findMany({
    where: {
      roomId: { in: rooms.map((room) => room.id) },
      status: "CONFIRMED",
      checkIn: { lt: parseDateOnly(stay.checkOut) },
      checkOut: { gt: parseDateOnly(stay.checkIn) },
    },
    select: { roomId: true, checkIn: true, checkOut: true },
  });

  const left = new Map<string, number>();
  for (const room of rooms) {
    const spans = bookings
      .filter((booking) => booking.roomId === room.id)
      .map((booking) => ({
        checkIn: formatDateOnly(booking.checkIn),
        checkOut: formatDateOnly(booking.checkOut),
      }));
    left.set(room.id, Math.max(0, room.quantity - peakOccupancy(spans, stay)));
  }
  return left;
}

export async function roomsLeft(client: BookingReader, room: Pick<Room, "id" | "quantity">, stay: Stay) {
  const left = await roomsLeftByRoom(client, [room], stay);
  return left.get(room.id) ?? 0;
}

function toRoomDto(room: Room, availableRooms: number | null, stay?: Stay) {
  const nights = stay ? nightsBetween(stay.checkIn, stay.checkOut) : null;
  return {
    id: room.id,
    hotelId: room.hotelId,
    name: room.name,
    type: room.type,
    description: room.description,
    maxGuests: room.maxGuests,
    pricePerNightCents: room.pricePerNightCents,
    totalRooms: room.quantity,
    availableRooms,
    available: availableRooms === null ? null : availableRooms > 0,
    nights,
    stayTotalCents: nights === null ? null : nights * room.pricePerNightCents,
  };
}

function toHotelSummary(hotel: Hotel) {
  return {
    id: hotel.id,
    name: hotel.name,
    city: hotel.city,
    country: hotel.country,
    address: hotel.address,
    description: hotel.description,
    starRating: hotel.starRating,
    amenities: hotel.amenities,
    imageUrl: hotel.imageUrl,
  };
}

export type RoomDto = ReturnType<typeof toRoomDto>;

const stayFrom = (query: { checkIn?: string; checkOut?: string }): Stay | undefined =>
  query.checkIn && query.checkOut ? { checkIn: query.checkIn, checkOut: query.checkOut } : undefined;

export async function listHotels(query: HotelQuery) {
  const where: Prisma.HotelWhereInput = {
    ...(query.minStars ? { starRating: { gte: query.minStars } } : {}),
    ...(query.amenity ? { amenities: { has: query.amenity } } : {}),
    ...(query.destination
      ? {
          OR: [
            { city: { contains: query.destination, mode: "insensitive" } },
            { country: { contains: query.destination, mode: "insensitive" } },
            { name: { contains: query.destination, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const stay = stayFrom(query);
  const hotels = await prisma.hotel.findMany({ where, include: { rooms: true } });
  const left = stay ? await roomsLeftByRoom(prisma, hotels.flatMap((hotel) => hotel.rooms), stay) : null;

  // Availability depends on per-night occupancy, so this filter runs here rather than in SQL.
  const summaries = [];
  for (const hotel of hotels) {
    const eligible = hotel.rooms.filter((room) => {
      if (query.guests && room.maxGuests < query.guests) return false;
      if (query.maxPrice !== undefined && room.pricePerNightCents > Math.round(query.maxPrice * 100)) return false;
      return !left || (left.get(room.id) ?? 0) > 0;
    });
    if (eligible.length === 0) continue;
    summaries.push({
      ...toHotelSummary(hotel),
      fromPriceCents: Math.min(...eligible.map((room) => room.pricePerNightCents)),
      matchingRooms: eligible.length,
    });
  }

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  const sorted = summaries.sort((a, b) => {
    if (query.sort === "price_asc") return a.fromPriceCents - b.fromPriceCents || byName(a, b);
    if (query.sort === "price_desc") return b.fromPriceCents - a.fromPriceCents || byName(a, b);
    if (query.sort === "stars_desc") return b.starRating - a.starRating || byName(a, b);
    return byName(a, b);
  });

  const skip = pageSkip(query.page, query.pageSize);
  return {
    items: sorted.slice(skip, skip + query.pageSize),
    meta: pageMeta(query.page, query.pageSize, sorted.length),
  };
}

export type HotelSummaryDto = Awaited<ReturnType<typeof listHotels>>["items"][number];

export async function listAmenities(): Promise<string[]> {
  const rows = await prisma.hotel.findMany({ select: { amenities: true } });
  return [...new Set(rows.flatMap((row) => row.amenities))].sort();
}

export async function getHotel(id: string, query: StayQuery = {}) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { rooms: { orderBy: { pricePerNightCents: "asc" } } },
  });
  if (!hotel) throw notFound("Hotel", "HOTEL_NOT_FOUND");

  const stay = stayFrom(query);
  const left = stay ? await roomsLeftByRoom(prisma, hotel.rooms, stay) : null;
  const rooms = hotel.rooms.map((room) => toRoomDto(room, left ? (left.get(room.id) ?? 0) : null, stay));
  return { ...toHotelSummary(hotel), rooms };
}

export async function getRoom(id: string, query: StayQuery = {}) {
  const room = await prisma.room.findUnique({ where: { id }, include: { hotel: true } });
  if (!room) throw notFound("Room", "ROOM_NOT_FOUND");

  const stay = stayFrom(query);
  const dto = toRoomDto(room, stay ? await roomsLeft(prisma, room, stay) : null, stay);
  return { ...dto, hotel: toHotelSummary(room.hotel) };
}

/** Cities with hotels, for destination cards. */
export async function listHotelCities() {
  const hotels = await prisma.hotel.findMany({ include: { rooms: { select: { pricePerNightCents: true } } } });
  const byCity = new Map<string, { city: string; country: string; hotels: number; fromPriceCents: number }>();
  for (const hotel of hotels) {
    const from = Math.min(...hotel.rooms.map((room) => room.pricePerNightCents));
    const entry = byCity.get(hotel.city);
    if (entry) {
      entry.hotels += 1;
      entry.fromPriceCents = Math.min(entry.fromPriceCents, from);
    } else {
      byCity.set(hotel.city, { city: hotel.city, country: hotel.country, hotels: 1, fromPriceCents: from });
    }
  }
  return [...byCity.values()].sort((a, b) => a.city.localeCompare(b.city));
}
