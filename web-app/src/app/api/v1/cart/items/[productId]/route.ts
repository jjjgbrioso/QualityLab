import { ok, parseBody, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { removeCartItem, updateCartItem } from "@/lib/services/cart";
import { updateCartItemSchema } from "@/lib/validation/commerce";

type Params = { productId: string };

export const PATCH = route<Params>(async ({ req, params }) => {
  const user = await requireAuth(req);
  const { quantity } = await parseBody(req, updateCartItemSchema);
  return ok(await updateCartItem(user.id, params.productId, quantity));
});

export const DELETE = route<Params>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await removeCartItem(user.id, params.productId));
});
