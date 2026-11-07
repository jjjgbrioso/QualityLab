import { ok, okPage, parseBody, parseQuery, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { createBooking, listBookings } from "@/lib/services/bookings";
import { bookingCreateSchema, bookingQuerySchema } from "@/lib/validation/travel";

export const GET = route(async ({ req }) => {
  const user = await requireAuth(req);
  const { items, meta } = await listBookings(parseQuery(req, bookingQuerySchema), user.id);
  return okPage(items, meta);
});

export const POST = route(async ({ req }) => {
  const user = await requireAuth(req);
  const input = await parseBody(req, bookingCreateSchema);
  return ok(await createBooking(user.id, input), 201);
});
