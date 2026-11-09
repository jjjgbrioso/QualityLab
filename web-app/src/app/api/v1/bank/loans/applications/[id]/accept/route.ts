import { parseBody, route } from "@/lib/api/handler";
import { idempotentResponse, requireIdempotencyKey } from "@/lib/api/idempotency";
import { requireAuth } from "@/lib/auth/session";
import { acceptLoanOffer } from "@/lib/services/loans";
import { acceptOfferSchema } from "@/lib/validation/loans";

/** Availment: accepts the offer and releases the loan into one of the borrower's accounts. */
export const POST = route<{ id: string }>(async ({ req, params }) => {
  const actor = await requireAuth(req);
  const idempotencyKey = requireIdempotencyKey(req);
  const input = await parseBody(req, acceptOfferSchema);
  return idempotentResponse(await acceptLoanOffer({ actor, idempotencyKey }, params.id, input));
});
