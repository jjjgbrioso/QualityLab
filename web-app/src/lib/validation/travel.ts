import { z } from "zod";
import { isValidDateOnly, nightsBetween, todayUtc } from "@/lib/dates";
import { pageFields, requiredId } from "@/lib/validation/common";

export const MAX_STAY_NIGHTS = 30;
export const MAX_GUESTS = 10;

export const HOTEL_SORTS = ["name_asc", "price_asc", "price_desc", "stars_desc"] as const;

const date = (label: string) =>
  z.string({ error: `${label} is required.` }).refine(isValidDateOnly, `${label} must be a real date in YYYY-MM-DD form.`);

const guestCount = z.coerce
  .number({ error: "Guests must be a number." })
  .int("Guests must be a whole number.")
  .min(1, "At least 1 guest is required.")
  .max(MAX_GUESTS, `Guests must be at most ${MAX_GUESTS}.`);

function checkStay(value: { checkIn?: string; checkOut?: string }, ctx: z.RefinementCtx) {
  const { checkIn, checkOut } = value;
  if (checkIn === undefined && checkOut === undefined) return;
  if (checkIn === undefined || checkOut === undefined) {
    ctx.addIssue({
      code: "custom",
      path: [checkIn === undefined ? "checkIn" : "checkOut"],
      message: "Provide both check-in and check-out dates.",
    });
    return;
  }
  if (checkIn < todayUtc()) {
    ctx.addIssue({ code: "custom", path: ["checkIn"], message: "Check-in cannot be in the past." });
  }
  if (checkOut <= checkIn) {
    ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in." });
  } else if (nightsBetween(checkIn, checkOut) > MAX_STAY_NIGHTS) {
    ctx.addIssue({
      code: "custom",
      path: ["checkOut"],
      message: `A stay can be at most ${MAX_STAY_NIGHTS} nights.`,
    });
  }
}

export const hotelQuerySchema = z
  .object({
    destination: z.string().trim().max(100, "Destination must be at most 100 characters.").optional(),
    minStars: z.coerce
      .number({ error: "Star rating must be a number." })
      .int("Star rating must be a whole number.")
      .min(1, "Star rating must be from 1 to 5.")
      .max(5, "Star rating must be from 1 to 5.")
      .optional(),
    maxPrice: z.coerce.number({ error: "Maximum price must be a number." }).min(0, "Maximum price cannot be negative.").optional(),
    amenity: z.string().trim().max(50).optional(),
    guests: guestCount.optional(),
    checkIn: date("Check-in").optional(),
    checkOut: date("Check-out").optional(),
    sort: z.enum(HOTEL_SORTS, { error: "Choose a supported sort order." }).default("name_asc"),
    ...pageFields,
  })
  .superRefine(checkStay);

export const stayQuerySchema = z
  .object({
    checkIn: date("Check-in").optional(),
    checkOut: date("Check-out").optional(),
    guests: guestCount.optional(),
  })
  .superRefine(checkStay);

export const bookingCreateSchema = z
  .object({
    roomId: requiredId("Room"),
    checkIn: date("Check-in"),
    checkOut: date("Check-out"),
    guests: guestCount,
  })
  .superRefine(checkStay);

export const BOOKING_STATUSES = ["CONFIRMED", "CANCELLED"] as const;

export const bookingQuerySchema = z.object({
  status: z.enum(BOOKING_STATUSES, { error: "Choose a supported booking status." }).optional(),
  ...pageFields,
});

export type HotelQuery = z.infer<typeof hotelQuerySchema>;
export type StayQuery = z.infer<typeof stayQuerySchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
