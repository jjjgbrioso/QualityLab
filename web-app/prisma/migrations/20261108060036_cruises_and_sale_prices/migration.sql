-- CreateEnum
CREATE TYPE "CabinType" AS ENUM ('INTERIOR', 'OCEAN_VIEW', 'BALCONY', 'SUITE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "listPriceCents" INTEGER;

-- CreateTable
CREATE TABLE "Ship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "yearLaunched" INTEGER NOT NULL,
    "guestCapacity" INTEGER NOT NULL,
    "amenities" TEXT[],

    CONSTRAINT "Ship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sailing" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departurePort" TEXT NOT NULL,
    "ports" TEXT[],
    "departureDate" DATE NOT NULL,
    "nights" INTEGER NOT NULL,

    CONSTRAINT "Sailing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SailingCabin" (
    "id" TEXT NOT NULL,
    "sailingId" TEXT NOT NULL,
    "type" "CabinType" NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerGuestCents" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "SailingCabin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CruiseBooking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cabinId" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "CruiseBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sailing_departureDate_idx" ON "Sailing"("departureDate");

-- CreateIndex
CREATE INDEX "Sailing_destination_idx" ON "Sailing"("destination");

-- CreateIndex
CREATE UNIQUE INDEX "SailingCabin_sailingId_type_key" ON "SailingCabin"("sailingId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CruiseBooking_bookingNumber_key" ON "CruiseBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "CruiseBooking_userId_createdAt_idx" ON "CruiseBooking"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CruiseBooking_cabinId_status_idx" ON "CruiseBooking"("cabinId", "status");

-- AddForeignKey
ALTER TABLE "Sailing" ADD CONSTRAINT "Sailing_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "Ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SailingCabin" ADD CONSTRAINT "SailingCabin_sailingId_fkey" FOREIGN KEY ("sailingId") REFERENCES "Sailing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruiseBooking" ADD CONSTRAINT "CruiseBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruiseBooking" ADD CONSTRAINT "CruiseBooking_cabinId_fkey" FOREIGN KEY ("cabinId") REFERENCES "SailingCabin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
