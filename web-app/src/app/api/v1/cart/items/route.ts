import { ok, parseBody, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { addCartItem } from "@/lib/services/cart";
import { addCartItemSchema } from "@/lib/validation/commerce";

export const POST = route(async ({ req }) => {
  const user = await requireAuth(req);
  const input = await parseBody(req, addCartItemSchema);
  return ok(await addCartItem(user.id, input), 201);
});
