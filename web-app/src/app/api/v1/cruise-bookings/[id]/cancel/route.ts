import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { cancelCruiseBooking } from "@/lib/services/cruise-bookings";

export const POST = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await cancelCruiseBooking(user, params.id));
});
