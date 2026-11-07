import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { getOrder } from "@/lib/services/orders";

export const GET = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await getOrder(user, params.id));
});
