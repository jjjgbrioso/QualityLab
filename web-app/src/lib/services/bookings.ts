import type { Booking, Hotel, Prisma, Room } from "@/generated/prisma/client";
import { ApiError, forbidden, notFound } from "@/lib/api/errors";
import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { formatDateOnly, nightsBetween, parseDateOnly, todayUtc } from "@/lib/dates";
import { reference } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { roomsLeft } from "@/lib/services/hotels";
import type { BookingCreateInput, BookingQuery } from "@/lib/validation/travel";

type Actor = { id: string; role: string };
type BookingWithRoom = Booking & { room: Room & { hotel: Hotel } };

const INCLUDE_ROOM = { room: { include: { hotel: true } } } as const;

function isCancellable(booking: Booking) {
  return booking.status === "CONFIRMED" && formatDateOnly(booking.checkIn) > todayUtc();
}

export function toBookingDto(booking: BookingWithRoom) {
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    userId: booking.userId,
    status: booking.status,
    checkIn: formatDateOnly(booking.checkIn),
    checkOut: formatDateOnly(booking.checkOut),
    guests: booking.guests,
    nights: booking.nights,
    totalCents: booking.totalCents,
    room: {
      id: booking.room.id,
      name: booking.room.name,
      type: booking.room.type,
      pricePerNightCents: booking.room.pricePerNightCents,
    },
    hotel: {
      id: booking.room.hotel.id,
      name: booking.room.hotel.name,
      city: booking.room.hotel.city,
      country: booking.room.hotel.country,
    },
    canCancel: isCancellable(booking),
    createdAt: booking.createdAt.toISOString(),
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
  };
}

export type BookingDto = ReturnType<typeof toBookingDto>;

export async function createBooking(userId: string, input: BookingCreateInput) {
  const nights = nightsBetween(input.checkIn, input.checkOut);

  const booking = await prisma.$transaction(
    async (tx) => {
      // Parallel bookings for one room wait here, so the last room cannot be sold twice.
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${input.roomId} FOR UPDATE`;
      const room = await tx.room.findUnique({ where: { id: input.roomId } });
      if (!room) throw notFound("Room", "ROOM_NOT_FOUND");

      if (input.guests > room.maxGuests) {
        throw new ApiError(422, "GUEST_LIMIT_EXCEEDED", `This room sleeps at most ${room.maxGuests} guests.`, [
          { field: "guests", message: `Maximum is ${room.maxGuests} guests.` },
        ]);
      }
      if ((await roomsLeft(tx, room, input)) === 0) {
        throw new ApiError(409, "ROOM_UNAVAILABLE", "This room is not available for the selected dates.");
      }

      return tx.booking.create({
        data: {
          bookingNumber: reference("BKG"),
          userId,
          roomId: room.id,
          checkIn: parseDateOnly(input.checkIn),
          checkOut: parseDateOnly(input.checkOut),
          guests: input.guests,
          nights,
          totalCents: nights * room.pricePerNightCents,
        },
        include: INCLUDE_ROOM,
      });
    },
    { maxWait: 10_000, timeout: 15_000 },
  );

  return toBookingDto(booking);
}

export async function listBookings(query: BookingQuery, userId: string) {
  const where: Prisma.BookingWhereInput = { userId, ...(query.status ? { status: query.status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: INCLUDE_ROOM,
      orderBy: [{ checkIn: "desc" }, { id: "asc" }],
      skip: pageSkip(query.page, query.pageSize),
      take: query.pageSize,
    }),
    prisma.booking.count({ where }),
  ]);
  return { items: rows.map(toBookingDto), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function getBooking(actor: Actor, id: string) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: INCLUDE_ROOM });
  if (!booking) throw notFound("Booking", "BOOKING_NOT_FOUND");
  if (booking.userId !== actor.id && actor.role !== "ADMIN") {
    throw forbidden("This booking belongs to another user.");
  }
  return toBookingDto(booking);
}

export async function cancelBooking(actor: Actor, id: string) {
  const booking = await getBooking(actor, id);
  if (!booking.canCancel) {
    throw new ApiError(409, "BOOKING_NOT_CANCELLABLE", "Only confirmed bookings that have not started can be cancelled.");
  }

  const { count } = await prisma.booking.updateMany({
    where: { id, status: "CONFIRMED" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  if (count === 0) {
    throw new ApiError(409, "BOOKING_NOT_CANCELLABLE", "Only confirmed bookings that have not started can be cancelled.");
  }
  return getBooking(actor, id);
}
