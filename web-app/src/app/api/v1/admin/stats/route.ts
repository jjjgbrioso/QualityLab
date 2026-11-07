import { ok, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/auth/session";
import { adminStats } from "@/lib/services/admin";

export const GET = route(async ({ req }) => {
  await requireAdmin(req);
  return ok(await adminStats());
});
