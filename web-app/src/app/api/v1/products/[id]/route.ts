import { ok, route } from "@/lib/api/handler";
import { getProduct } from "@/lib/services/products";

export const GET = route<{ id: string }>(async ({ params }) => ok(await getProduct(params.id)));
