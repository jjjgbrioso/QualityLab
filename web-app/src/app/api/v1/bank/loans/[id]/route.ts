import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { getLoan } from "@/lib/services/loans";

/** A loan with its repayment schedule. */
export const GET = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await getLoan(user, params.id));
});
