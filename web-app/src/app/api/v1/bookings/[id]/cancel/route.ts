import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { cancelBooking } from "@/lib/services/bookings";

export const POST = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await cancelBooking(user, params.id));
});
