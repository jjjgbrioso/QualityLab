import { okPage, parseQuery, route } from "@/lib/api/handler";
import { listProducts } from "@/lib/services/products";
import { productQuerySchema } from "@/lib/validation/products";

export const GET = route(async ({ req }) => {
  const { items, meta } = await listProducts(parseQuery(req, productQuerySchema));
  return okPage(items, meta);
});
