import { parseBody, route } from "@/lib/api/handler";
import { idempotentResponse, requireIdempotencyKey } from "@/lib/api/idempotency";
import { requireAuth } from "@/lib/auth/session";
import { withdraw } from "@/lib/services/bank";
import { cashTransactionSchema } from "@/lib/validation/bank";

export const POST = route(async ({ req }) => {
  const actor = await requireAuth(req);
  const idempotencyKey = requireIdempotencyKey(req);
  const input = await parseBody(req, cashTransactionSchema);
  return idempotentResponse(await withdraw({ actor, idempotencyKey }, input));
});
