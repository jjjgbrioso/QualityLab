import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { declineLoanOffer } from "@/lib/services/loans";

export const POST = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  return ok(await declineLoanOffer(user, params.id));
});
