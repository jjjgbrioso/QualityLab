import { ok, parseQuery, route } from "@/lib/api/handler";
import { getRoom } from "@/lib/services/hotels";
import { stayQuerySchema } from "@/lib/validation/travel";

export const GET = route<{ id: string }>(async ({ req, params }) =>
  ok(await getRoom(params.id, parseQuery(req, stayQuerySchema))),
);
