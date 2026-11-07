import { okPage, parseQuery, route } from "@/lib/api/handler";
import { requireAuth } from "@/lib/auth/session";
import { listTransactions } from "@/lib/services/bank";
import { transactionQuerySchema } from "@/lib/validation/bank";

export const GET = route<{ id: string }>(async ({ req, params }) => {
  const user = await requireAuth(req);
  const { items, meta } = await listTransactions(user, params.id, parseQuery(req, transactionQuerySchema));
  return okPage(items, meta);
});
