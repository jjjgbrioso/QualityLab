import { ok, parseBody, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/auth/session";
import { updateOrderStatus } from "@/lib/services/orders";
import { orderStatusUpdateSchema } from "@/lib/validation/commerce";

export const PATCH = route<{ id: string }>(async ({ req, params }) => {
  await requireAdmin(req);
  const { status } = await parseBody(req, orderStatusUpdateSchema);
  return ok(await updateOrderStatus(params.id, status));
});
