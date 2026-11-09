import { ok, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";

export const GET = route(async ({ req }) => {
  const { id, email, firstName, lastName, role, module } = await requireAuth(req);
  return ok({ id, email, firstName, lastName, role, module });
});
