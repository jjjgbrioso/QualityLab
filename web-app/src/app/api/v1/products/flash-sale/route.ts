import { ok, route } from "@/lib/api/handler";
import { listFlashSale } from "@/lib/services/products";

export const GET = route(async () => ok(await listFlashSale()));
