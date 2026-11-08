import { ok, okPage, parseBody, parseQuery, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { createCruiseBooking, listCruiseBookings } from "@/lib/services/cruise-bookings";
import { cruiseBookingCreateSchema } from "@/lib/validation/cruises";
import { bookingQuerySchema } from "@/lib/validation/travel";

export const GET = route(async ({ req }) => {
  const user = await requireAuth(req);
  const { items, meta } = await listCruiseBookings(parseQuery(req, bookingQuerySchema), user.id);
  return okPage(items, meta);
});

export const POST = route(async ({ req }) => {
  const user = await requireAuth(req);
  const input = await parseBody(req, cruiseBookingCreateSchema);
  return ok(await createCruiseBooking(user.id, input), 201);
});
