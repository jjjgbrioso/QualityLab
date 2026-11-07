import { ok, okPage, parseBody, parseQuery, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/auth/session";
import { adminListProducts, createProduct } from "@/lib/services/products";
import { adminProductQuerySchema, productCreateSchema } from "@/lib/validation/products";

export const GET = route(async ({ req }) => {
  await requireAdmin(req);
  const { items, meta } = await adminListProducts(parseQuery(req, adminProductQuerySchema));
  return okPage(items, meta);
});

export const POST = route(async ({ req }) => {
  await requireAdmin(req);
  const input = await parseBody(req, productCreateSchema);
  return ok(await createProduct(input), 201);
});
