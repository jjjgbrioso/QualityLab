import type { CruiseBooking, Prisma, Sailing, SailingCabin, Ship } from "@/generated/prisma/client";
import { ApiError, forbidden, notFound } from "@/lib/api/errors";
import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { addDays, formatDateOnly } from "@/lib/dates";
import { reference } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { cabinsLeftById, hasDeparted } from "@/lib/services/cruises";
import type { CruiseBookingCreateInput } from "@/lib/validation/cruises";
import type { BookingQuery } from "@/lib/validation/travel";

type Actor = { id: string; role: string };
type BookingWithCabin = CruiseBooking & { cabin: SailingCabin & { sailing: Sailing & { ship: Ship } } };

const INCLUDE_CABIN = { cabin: { include: { sailing: { include: { ship: true } } } } } as const;

export function toCruiseBookingDto(booking: BookingWithCabin) {
  const { sailing } = booking.cabin;
  const departureDate = formatDateOnly(sailing.departureDate);
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    userId: booking.userId,
    status: booking.status,
    guests: booking.guests,
    leadGuestName: booking.leadGuestName,
    totalCents: booking.totalCents,
    cabin: {
      id: booking.cabin.id,
      type: booking.cabin.type,
      name: booking.cabin.name,
      pricePerGuestCents: booking.cabin.pricePerGuestCents,
    },
    sailing: {
      id: sailing.id,
      title: sailing.title,
      departurePort: sailing.departurePort,
      departureDate,
      returnDate: addDays(departureDate, sailing.nights),
      nights: sailing.nights,
    },
    ship: { id: sailing.ship.id, name: sailing.ship.name },
    canCancel: booking.status === "CONFIRMED" && !hasDeparted(sailing.departureDate),
    createdAt: booking.createdAt.toISOString(),
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
  };
}

export type CruiseBookingDto = ReturnType<typeof toCruiseBookingDto>;

export async function createCruiseBooking(userId: string, input: CruiseBookingCreateInput) {
  const booking = await prisma.$transaction(
    async (tx) => {
      // Parallel bookings for one cabin type wait here, so the last cabin cannot be sold twice.
      await tx.$queryRaw`SELECT id FROM "SailingCabin" WHERE id = ${input.cabinId} FOR UPDATE`;
      const cabin = await tx.sailingCabin.findUnique({ where: { id: input.cabinId }, include: { sailing: true } });
      if (!cabin) throw notFound("Cabin", "CABIN_NOT_FOUND");

      if (hasDeparted(cabin.sailing.departureDate)) {
        throw new ApiError(422, "SAILING_DEPARTED", "Bookings for this sailing have closed.");
      }
      if (input.guests > cabin.maxGuests) {
        throw new ApiError(422, "GUEST_LIMIT_EXCEEDED", `This cabin sleeps at most ${cabin.maxGuests} guests.`, [
          { field: "guests", message: `Maximum is ${cabin.maxGuests} guests.` },
        ]);
      }
      const left = await cabinsLeftById(tx, [cabin]);
      if ((left.get(cabin.id) ?? 0) === 0) {
        throw new ApiError(409, "CABIN_UNAVAILABLE", "This cabin type is sold out on this sailing.");
      }

      return tx.cruiseBooking.create({
        data: {
          bookingNumber: reference("CRZ"),
          userId,
          cabinId: cabin.id,
          guests: input.guests,
          leadGuestName: input.leadGuestName,
          totalCents: cabin.pricePerGuestCents * input.guests,
        },
        include: INCLUDE_CABIN,
      });
    },
    { maxWait: 10_000, timeout: 15_000 },
  );

  return toCruiseBookingDto(booking);
}

export async function listCruiseBookings(query: BookingQuery, userId: string) {
  const where: Prisma.CruiseBookingWhereInput = { userId, ...(query.status ? { status: query.status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.cruiseBooking.findMany({
      where,
      include: INCLUDE_CABIN,
      orderBy: [{ cabin: { sailing: { departureDate: "desc" } } }, { id: "asc" }],
      skip: pageSkip(query.page, query.pageSize),
      take: query.pageSize,
    }),
    prisma.cruiseBooking.count({ where }),
  ]);
  return { items: rows.map(toCruiseBookingDto), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function getCruiseBooking(actor: Actor, id: string) {
  const booking = await prisma.cruiseBooking.findUnique({ where: { id }, include: INCLUDE_CABIN });
  if (!booking) throw notFound("Cruise booking", "CRUISE_BOOKING_NOT_FOUND");
  if (booking.userId !== actor.id && actor.role !== "ADMIN") {
    throw forbidden("This cruise booking belongs to another user.");
  }
  return toCruiseBookingDto(booking);
}

export async function cancelCruiseBooking(actor: Actor, id: string) {
  const booking = await getCruiseBooking(actor, id);
  const notCancellable = () =>
    new ApiError(409, "CRUISE_BOOKING_NOT_CANCELLABLE", "Only confirmed bookings for sailings that have not departed can be cancelled.");
  if (!booking.canCancel) throw notCancellable();

  const { count } = await prisma.cruiseBooking.updateMany({
    where: { id, status: "CONFIRMED" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  if (count === 0) throw notCancellable();
  return getCruiseBooking(actor, id);
}
