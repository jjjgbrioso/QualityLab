import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { cancelOrder } from "@/lib/services/orders";

export const POST = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await cancelOrder(user, params.id));
});
