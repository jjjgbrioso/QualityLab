import { z } from "zod";
import { pageFields, requiredId } from "@/lib/validation/common";
import { leadGuestName, MAX_GUESTS } from "@/lib/validation/travel";

export const CRUISE_SORTS = ["departure_asc", "price_asc", "price_desc", "nights_asc"] as const;
export type CruiseSort = (typeof CRUISE_SORTS)[number];

const nights = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(1, `${label} must be at least 1.`)
    .max(30, `${label} must be at most 30.`)
    .optional();

export const cruiseQuerySchema = z
  .object({
    destination: z.string().trim().max(100, "Destination must be at most 100 characters.").optional(),
    departurePort: z.string().trim().max(100, "Departure port must be at most 100 characters.").optional(),
    ship: z.string().trim().max(50).optional(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM.").optional(),
    guests: z.coerce
      .number({ error: "Guests must be a number." })
      .int("Guests must be a whole number.")
      .min(1, "At least 1 guest is required.")
      .max(MAX_GUESTS, `Guests must be at most ${MAX_GUESTS}.`)
      .optional(),
    minNights: nights("Minimum nights"),
    maxNights: nights("Maximum nights"),
    sort: z.enum(CRUISE_SORTS, { error: "Choose a supported sort order." }).default("departure_asc"),
    ...pageFields,
  })
  .refine((v) => v.minNights === undefined || v.maxNights === undefined || v.minNights <= v.maxNights, {
    path: ["maxNights"],
    message: "Maximum nights must not be below the minimum.",
  });

export const cruiseBookingCreateSchema = z.object({
  cabinId: requiredId("Cabin"),
  guests: z
    .number({ error: "Guests is required." })
    .int("Guests must be a whole number.")
    .min(1, "At least 1 guest is required.")
    .max(MAX_GUESTS, `Guests must be at most ${MAX_GUESTS}.`),
  leadGuestName,
});

export type CruiseQuery = z.infer<typeof cruiseQuerySchema>;
export type CruiseBookingCreateInput = z.infer<typeof cruiseBookingCreateSchema>;
