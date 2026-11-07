import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { getAccount } from "@/lib/services/bank";

export const GET = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await getAccount(user, params.id));
});
