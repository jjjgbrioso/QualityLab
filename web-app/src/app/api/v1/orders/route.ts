import { ok, okPage, parseBody, parseQuery, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { checkout, listOrders } from "@/lib/services/orders";
import { checkoutSchema, orderQuerySchema } from "@/lib/validation/commerce";

export const GET = route(async ({ req }) => {
  const user = await requireAuth(req);
  const { items, meta } = await listOrders(parseQuery(req, orderQuerySchema), user.id);
  return okPage(items, meta);
});

export const POST = route(async ({ req }) => {
  const user = await requireAuth(req);
  const input = await parseBody(req, checkoutSchema);
  return ok(await checkout(user.id, input), 201);
});
