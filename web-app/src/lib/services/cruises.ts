import type { Prisma, Sailing, SailingCabin, Ship } from "@/generated/prisma/client";
import { notFound } from "@/lib/api/errors";
import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { addDays, formatDateOnly, todayUtc } from "@/lib/dates";
import { destinationImageUrl } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import type { CruiseQuery } from "@/lib/validation/cruises";

type BookingReader = Pick<Prisma.TransactionClient, "cruiseBooking">;
type SailingWithShipAndCabins = Sailing & { ship: Ship; cabins: SailingCabin[] };

const CABIN_ORDER = ["INTERIOR", "OCEAN_VIEW", "BALCONY", "SUITE"];

/** Cabins left per cabin id: total cabins minus confirmed bookings. */
export async function cabinsLeftById(client: BookingReader, cabins: Pick<SailingCabin, "id" | "quantity">[]) {
  const counts = await client.cruiseBooking.groupBy({
    by: ["cabinId"],
    where: { cabinId: { in: cabins.map((cabin) => cabin.id) }, status: "CONFIRMED" },
    _count: { _all: true },
  });
  const booked = new Map(counts.map((row) => [row.cabinId, row._count._all]));
  return new Map(cabins.map((cabin) => [cabin.id, Math.max(0, cabin.quantity - (booked.get(cabin.id) ?? 0))]));
}

/** Bookings close on the day of departure. */
export const hasDeparted = (departureDate: Date) => formatDateOnly(departureDate) <= todayUtc();

function sailingDates(sailing: Sailing) {
  const departureDate = formatDateOnly(sailing.departureDate);
  return { departureDate, returnDate: addDays(departureDate, sailing.nights) };
}

function toCabinDto(cabin: SailingCabin, left: number, departed: boolean) {
  return {
    id: cabin.id,
    type: cabin.type,
    name: cabin.name,
    pricePerGuestCents: cabin.pricePerGuestCents,
    maxGuests: cabin.maxGuests,
    totalCabins: cabin.quantity,
    cabinsLeft: left,
    available: !departed && left > 0,
  };
}

function toSailingSummary(sailing: SailingWithShipAndCabins, left: Map<string, number>, guests: number) {
  const departed = hasDeparted(sailing.departureDate);
  const bookable = sailing.cabins.filter((cabin) => !departed && (left.get(cabin.id) ?? 0) > 0 && cabin.maxGuests >= guests);
  const priced = bookable.length > 0 ? bookable : sailing.cabins;
  return {
    id: sailing.id,
    title: sailing.title,
    destination: sailing.destination,
    departurePort: sailing.departurePort,
    ports: sailing.ports,
    ...sailingDates(sailing),
    nights: sailing.nights,
    imageUrl: destinationImageUrl(sailing.destination),
    ship: { id: sailing.ship.id, name: sailing.ship.name, imageUrl: sailing.ship.imageUrl },
    fromPricePerGuestCents: Math.min(...priced.map((cabin) => cabin.pricePerGuestCents)),
    cabinsLeft: bookable.reduce((sum, cabin) => sum + (left.get(cabin.id) ?? 0), 0),
    soldOut: bookable.length === 0,
    departed,
  };
}

export type SailingSummaryDto = ReturnType<typeof toSailingSummary>;

/** Upcoming sailings only. Search is filtered and sorted here, as availability is computed. */
export async function listSailings(query: CruiseQuery) {
  const where: Prisma.SailingWhereInput = { departureDate: { gt: new Date(`${todayUtc()}T00:00:00.000Z`) } };
  if (query.destination) {
    where.OR = [
      { destination: { contains: query.destination, mode: "insensitive" } },
      { title: { contains: query.destination, mode: "insensitive" } },
      { ports: { has: query.destination } },
    ];
  }
  if (query.departurePort) where.departurePort = { equals: query.departurePort, mode: "insensitive" };
  if (query.ship) where.shipId = query.ship;
  if (query.minNights !== undefined || query.maxNights !== undefined) {
    where.nights = {
      ...(query.minNights !== undefined ? { gte: query.minNights } : {}),
      ...(query.maxNights !== undefined ? { lte: query.maxNights } : {}),
    };
  }
  if (query.month) {
    const start = new Date(`${query.month}-01T00:00:00.000Z`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    where.AND = [{ departureDate: { gte: start, lt: end } }];
  }

  const sailings = await prisma.sailing.findMany({ where, include: { ship: true, cabins: true } });
  const left = await cabinsLeftById(prisma, sailings.flatMap((sailing) => sailing.cabins));
  const guests = query.guests ?? 1;

  const summaries = sailings
    .map((sailing) => toSailingSummary(sailing, left, guests))
    .filter((summary) => query.guests === undefined || !summary.soldOut);

  const byDeparture = (a: SailingSummaryDto, b: SailingSummaryDto) =>
    a.departureDate.localeCompare(b.departureDate) || a.id.localeCompare(b.id);
  summaries.sort((a, b) => {
    if (query.sort === "price_asc") return a.fromPricePerGuestCents - b.fromPricePerGuestCents || byDeparture(a, b);
    if (query.sort === "price_desc") return b.fromPricePerGuestCents - a.fromPricePerGuestCents || byDeparture(a, b);
    if (query.sort === "nights_asc") return a.nights - b.nights || byDeparture(a, b);
    return byDeparture(a, b);
  });

  const skip = pageSkip(query.page, query.pageSize);
  return { items: summaries.slice(skip, skip + query.pageSize), meta: pageMeta(query.page, query.pageSize, summaries.length) };
}

export async function getSailing(id: string) {
  const sailing = await prisma.sailing.findUnique({ where: { id }, include: { ship: true, cabins: true } });
  if (!sailing) throw notFound("Sailing", "SAILING_NOT_FOUND");

  const left = await cabinsLeftById(prisma, sailing.cabins);
  const departed = hasDeparted(sailing.departureDate);
  const cabins = [...sailing.cabins]
    .sort((a, b) => CABIN_ORDER.indexOf(a.type) - CABIN_ORDER.indexOf(b.type))
    .map((cabin) => toCabinDto(cabin, left.get(cabin.id) ?? 0, departed));

  return {
    id: sailing.id,
    title: sailing.title,
    destination: sailing.destination,
    departurePort: sailing.departurePort,
    ports: sailing.ports,
    ...sailingDates(sailing),
    nights: sailing.nights,
    departed,
    ship: {
      id: sailing.ship.id,
      name: sailing.ship.name,
      description: sailing.ship.description,
      yearLaunched: sailing.ship.yearLaunched,
      guestCapacity: sailing.ship.guestCapacity,
      amenities: sailing.ship.amenities,
      imageUrl: sailing.ship.imageUrl,
    },
    imageUrl: destinationImageUrl(sailing.destination),
    cabins,
  };
}

export type SailingDetailDto = Awaited<ReturnType<typeof getSailing>>;

export async function listShips() {
  const today = new Date(`${todayUtc()}T00:00:00.000Z`);
  const ships = await prisma.ship.findMany({
    orderBy: { name: "asc" },
    include: { sailings: { where: { departureDate: { gt: today } }, orderBy: { departureDate: "asc" } } },
  });
  return ships.map((ship) => ({
    id: ship.id,
    name: ship.name,
    description: ship.description,
    yearLaunched: ship.yearLaunched,
    guestCapacity: ship.guestCapacity,
    amenities: ship.amenities,
    imageUrl: ship.imageUrl,
    upcomingSailings: ship.sailings.length,
    departurePorts: [...new Set(ship.sailings.map((sailing) => sailing.departurePort))],
    nextDeparture: ship.sailings[0] ? formatDateOnly(ship.sailings[0].departureDate) : null,
  }));
}

export type ShipDto = Awaited<ReturnType<typeof listShips>>[number];

export async function listCruiseFilters() {
  const today = new Date(`${todayUtc()}T00:00:00.000Z`);
  const sailings = await prisma.sailing.findMany({
    where: { departureDate: { gt: today } },
    select: { destination: true, departurePort: true },
  });
  return {
    destinations: [...new Set(sailings.map((sailing) => sailing.destination))].sort(),
    departurePorts: [...new Set(sailings.map((sailing) => sailing.departurePort))].sort(),
  };
}
