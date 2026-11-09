import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  BANK_ACCOUNTS,
  BANK_TRANSACTIONS,
  BOOKINGS,
  CABIN_TYPES,
  CRUISE_BOOKINGS,
  HOTELS,
  hotelImageUrl,
  ORDERS,
  PRODUCTS,
  productImageUrl,
  SAILINGS,
  SHIPS,
  shipImageUrl,
  USERS,
} from "./seed-data";

/** Cabin ids follow cabin_<sailing number>_<type suffix>, such as cabin_0001_bal. */
export function cabinSeeds() {
  return SAILINGS.flatMap((sailing) =>
    CABIN_TYPES.map((cabin) => ({
      id: `cabin_${sailing.id.slice(-4)}_${cabin.suffix}`,
      sailingId: sailing.id,
      type: cabin.type,
      name: cabin.name,
      pricePerGuestCents: Math.round((sailing.basePriceCents * cabin.priceFactor) / 100) * 100,
      maxGuests: cabin.maxGuests,
      quantity: cabin.type === "SUITE" && sailing.suiteQuantity !== undefined ? sailing.suiteQuantity : cabin.quantity,
    })),
  );
}

// A fixed instant keeps generated timestamps identical between runs.
const BASELINE_DATE = new Date("2026-01-01T00:00:00.000Z");

/** Tables are listed so a new model has to be added here on purpose. */
const TABLES = [
  "LoanInstalment",
  "Loan",
  "LoanApplication",
  "CustomerProfile",
  "IdempotencyKey",
  "RevokedToken",
  "CruiseBooking",
  "SailingCabin",
  "Sailing",
  "Ship",
  "CartItem",
  "InventoryMovement",
  "OrderItem",
  "Order",
  "BankTransaction",
  "BankAccount",
  "Booking",
  "Room",
  "Hotel",
  "Product",
  "User",
];

export function connect(url: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

export function databaseUrl(): string {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  return url;
}

export async function wipeDatabase(prisma: PrismaClient) {
  const list = TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
}

export async function seedDatabase(prisma: PrismaClient) {
  const hashes = new Map<string, string>();
  for (const password of new Set(USERS.map((user) => user.password))) {
    hashes.set(password, await bcrypt.hash(password, 10));
  }

  await prisma.user.createMany({
    data: USERS.map(({ password, ...user }) => ({
      ...user,
      passwordHash: hashes.get(password)!,
      createdAt: BASELINE_DATE,
      updatedAt: BASELINE_DATE,
    })),
  });

  await prisma.product.createMany({
    data: PRODUCTS.map((product) => ({ ...product, imageUrl: productImageUrl(product.id), createdAt: BASELINE_DATE, updatedAt: BASELINE_DATE })),
  });

  await prisma.bankAccount.createMany({
    data: BANK_ACCOUNTS.map((account) => ({
      ...account,
      product: account.type === "SAVINGS" ? "STARTER_SAVINGS" : "EVERYDAY_CHECKING",
      createdAt: BASELINE_DATE,
      updatedAt: BASELINE_DATE,
    })),
  });

  await prisma.bankTransaction.createMany({
    data: BANK_TRANSACTIONS.map((transaction) => ({ ...transaction, createdAt: new Date(transaction.createdAt) })),
  });

  await prisma.hotel.createMany({
    data: HOTELS.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      address: hotel.address,
      description: hotel.description,
      starRating: hotel.starRating,
      amenities: hotel.amenities,
      imageUrl: hotelImageUrl(hotel.id),
      createdAt: BASELINE_DATE,
    })),
  });

  await prisma.room.createMany({
    data: HOTELS.flatMap((hotel) =>
      hotel.rooms.map(({ suffix, ...room }) => ({
        ...room,
        id: `room_${hotel.id.slice(-4)}_${suffix}`,
        hotelId: hotel.id,
        description: `${room.name} at ${hotel.name}. Sleeps up to ${room.maxGuests} guests.`,
      })),
    ),
  });

  const productById = new Map(PRODUCTS.map((product) => [product.id, product]));
  for (const { items, ...order } of ORDERS) {
    await prisma.order.create({
      data: {
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.createdAt),
        cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
        shipFullName: order.userId === "user_bob" ? "Bob Tester" : "Alice Tester",
        shipAddress: "100 Test Avenue",
        shipCity: "Sampletown",
        shipPostcode: "00000",
        shipCountry: "United States",
        cardBrand: "Visa",
        cardLast4: "4242",
        items: {
          create: items.map((item) => {
            const product = productById.get(item.productId)!;
            return {
              ...item,
              productName: product.name,
              sku: product.sku,
              unitPriceCents: product.priceCents,
              lineTotalCents: product.priceCents * item.quantity,
            };
          }),
        },
      },
    });
  }

  const rooms = await prisma.room.findMany();
  const priceByRoom = new Map(rooms.map((room) => [room.id, room.pricePerNightCents]));
  const DAY_MS = 86_400_000;

  await prisma.booking.createMany({
    data: BOOKINGS.map((booking) => {
      const checkIn = new Date(`${booking.checkIn}T00:00:00.000Z`);
      const checkOut = new Date(`${booking.checkOut}T00:00:00.000Z`);
      const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
      return {
        ...booking,
        checkIn,
        checkOut,
        nights,
        totalCents: nights * priceByRoom.get(booking.roomId)!,
        createdAt: new Date(booking.createdAt),
        cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null,
      };
    }),
  });

  await prisma.ship.createMany({ data: SHIPS.map((ship) => ({ ...ship, amenities: [...ship.amenities], imageUrl: shipImageUrl(ship.id) })) });

  await prisma.sailing.createMany({
    data: SAILINGS.map((sailing) => ({
      id: sailing.id,
      shipId: sailing.shipId,
      title: sailing.title,
      destination: sailing.destination,
      departurePort: sailing.departurePort,
      ports: sailing.ports,
      nights: sailing.nights,
      departureDate: new Date(`${sailing.departureDate}T00:00:00.000Z`),
    })),
  });

  const cabins = cabinSeeds();
  await prisma.sailingCabin.createMany({ data: cabins });

  const cabinPrice = new Map(cabins.map((cabin) => [cabin.id, cabin.pricePerGuestCents]));
  await prisma.cruiseBooking.createMany({
    data: CRUISE_BOOKINGS.map((booking) => ({
      ...booking,
      totalCents: cabinPrice.get(booking.cabinId)! * booking.guests,
      createdAt: new Date(booking.createdAt),
      cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null,
    })),
  });

  return {
    users: USERS.length,
    products: PRODUCTS.length,
    bankAccounts: BANK_ACCOUNTS.length,
    hotels: HOTELS.length,
    rooms: rooms.length,
    orders: ORDERS.length,
    bookings: BOOKINGS.length,
    ships: SHIPS.length,
    sailings: SAILINGS.length,
    cabins: cabins.length,
    cruiseBookings: CRUISE_BOOKINGS.length,
  };
}
