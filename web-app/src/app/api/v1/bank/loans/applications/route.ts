import { ok, parseBody, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { submitLoanApplication } from "@/lib/services/loans";
import { loanApplicationSchema } from "@/lib/validation/loans";

/** Applies for a personal loan. The credit check runs straight away and the decision is returned. */
export const POST = route(async ({ req }) => {
  const user = await requireAuth(req);
  const input = await parseBody(req, loanApplicationSchema);
  return ok(await submitLoanApplication(user, input), 201);
});
