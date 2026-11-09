import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { listLoanActivity } from "@/lib/services/loans";

/** The borrower's loan applications and loans. */
export const GET = route(async ({ req }) => {
  const user = await requireAuth(req);
  return ok(await listLoanActivity(user.id));
});
