import { parseBody, route } from "@/lib/api/handler";
import { idempotentResponse, requireIdempotencyKey } from "@/lib/api/idempotency";
import { requireAuth } from "@/lib/auth/session";
import { payLoanInstalment } from "@/lib/services/loans";
import { loanPaymentSchema } from "@/lib/validation/loans";

/** Settlement: pays the next unpaid instalment. */
export const POST = route<{ id: string }>(async ({ req, params }) => {
  const actor = await requireAuth(req);
  const idempotencyKey = requireIdempotencyKey(req);
  const input = await parseBody(req, loanPaymentSchema);
  return idempotentResponse(await payLoanInstalment({ actor, idempotencyKey }, params.id, input));
});
