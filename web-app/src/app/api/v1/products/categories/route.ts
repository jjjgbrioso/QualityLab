import { ok, route } from "@/lib/api/handler";
import { listCategories } from "@/lib/services/products";

export const GET = route(async () => ok(await listCategories()));
