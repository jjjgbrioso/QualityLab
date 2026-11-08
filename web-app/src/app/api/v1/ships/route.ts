import { ok, route } from "@/lib/api/handler";
import { listShips } from "@/lib/services/cruises";

export const GET = route(async () => ok(await listShips()));
