import { ok, route } from "@/lib/api/handler";
import { getSailing } from "@/lib/services/cruises";

export const GET = route<{ id: string }>(async ({ params }) => ok(await getSailing(params.id)));
