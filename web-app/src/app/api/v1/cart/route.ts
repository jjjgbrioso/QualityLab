import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { clearCart, getCart } from "@/lib/services/cart";

export const GET = route(async ({ req }) => {
  const user = await requireAuth(req);
  return ok(await getCart(user.id));
});

export const DELETE = route(async ({ req }) => {
  const user = await requireAuth(req);
  return ok(await clearCart(user.id));
});
