import { okPage, parseQuery, route } from "@/lib/api/handler";
import { listHotels } from "@/lib/services/hotels";
import { hotelQuerySchema } from "@/lib/validation/travel";

export const GET = route(async ({ req }) => {
  const { items, meta } = await listHotels(parseQuery(req, hotelQuerySchema));
  return okPage(items, meta);
});
