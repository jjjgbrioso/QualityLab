import { ok, parseQuery, route } from "@/lib/api/handler";
import { getHotel } from "@/lib/services/hotels";
import { stayQuerySchema } from "@/lib/validation/travel";

export const GET = route<{ id: string }>(async ({ req, params }) =>
  ok(await getHotel(params.id, parseQuery(req, stayQuerySchema))),
);
