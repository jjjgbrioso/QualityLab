import { okPage, parseQuery, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/auth/session";
import { listOrders } from "@/lib/services/orders";
import { orderQuerySchema } from "@/lib/validation/commerce";

export const GET = route(async ({ req }) => {
  await requireAdmin(req);
  const { items, meta } = await listOrders(parseQuery(req, orderQuerySchema));
  return okPage(items, meta);
});
