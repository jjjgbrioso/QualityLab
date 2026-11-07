import { z } from "zod";
import { okPage, parseQuery, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/services/admin";
import { pageFields } from "@/lib/validation/common";

const querySchema = z.object(pageFields);

export const GET = route(async ({ req }) => {
  await requireAdmin(req);
  const { items, meta } = await listUsers(parseQuery(req, querySchema));
  return okPage(items, meta);
});
