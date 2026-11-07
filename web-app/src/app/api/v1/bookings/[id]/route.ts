import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { getBooking } from "@/lib/services/bookings";

export const GET = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await getBooking(user, params.id));
});
