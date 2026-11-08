import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { getCruiseBooking } from "@/lib/services/cruise-bookings";

export const GET = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await getCruiseBooking(user, params.id));
});
