-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "leadGuestName" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "CruiseBooking" ADD COLUMN     "leadGuestName" TEXT NOT NULL DEFAULT '';
