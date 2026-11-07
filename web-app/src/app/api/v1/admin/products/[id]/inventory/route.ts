import { ok, parseBody, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/auth/session";
import { adjustInventory } from "@/lib/services/products";
import { inventoryAdjustSchema } from "@/lib/validation/products";

export const POST = route<{ id: string }>(async ({ req, params }) => {
  const admin = await requireAdmin(req);
  const { delta, note } = await parseBody(req, inventoryAdjustSchema);
  return ok(await adjustInventory(admin.id, params.id, delta, note));
});
