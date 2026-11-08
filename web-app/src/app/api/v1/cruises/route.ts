import { okPage, parseQuery, route } from "@/lib/api/handler";
import { listSailings } from "@/lib/services/cruises";
import { cruiseQuerySchema } from "@/lib/validation/cruises";

export const GET = route(async ({ req }) => {
  const { items, meta } = await listSailings(parseQuery(req, cruiseQuerySchema));
  return okPage(items, meta);
});
