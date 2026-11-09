import { ok, parseBody, route } from "@/lib/api/handler";
import { idempotentResponse, requireIdempotencyKey } from "@/lib/api/idempotency";
import { requireAuth } from "@/lib/auth/session";
import { listAccounts, openAccount } from "@/lib/services/bank";
import { openAccountSchema } from "@/lib/validation/bank-onboarding";

export const GET = route(async ({ req }) => {
  const user = await requireAuth(req);
  return ok(await listAccounts(user.id));
});

/** Opens another account, funded by a transfer from one of the customer's accounts. */
export const POST = route(async ({ req }) => {
  const actor = await requireAuth(req);
  const idempotencyKey = requireIdempotencyKey(req);
  const input = await parseBody(req, openAccountSchema);
  return idempotentResponse(await openAccount({ actor, idempotencyKey }, input));
});
