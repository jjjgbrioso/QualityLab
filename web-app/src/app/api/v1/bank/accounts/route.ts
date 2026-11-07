import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { listAccounts } from "@/lib/services/bank";

export const GET = route(async ({ req }) => {
  const user = await requireAuth(req);
  return ok(await listAccounts(user.id));
});
