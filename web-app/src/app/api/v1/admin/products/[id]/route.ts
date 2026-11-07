import { NextResponse } from "next/server";
import { ok, parseBody, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/auth/session";
import { adminGetProduct, deactivateProduct, updateProduct } from "@/lib/services/products";
import { productUpdateSchema } from "@/lib/validation/products";

type Params = { id: string };

export const GET = route<Params>(async ({ req, params }) => {
  await requireAdmin(req);
  return ok(await adminGetProduct(params.id));
});

export const PATCH = route<Params>(async ({ req, params }) => {
  await requireAdmin(req);
  const input = await parseBody(req, productUpdateSchema);
  return ok(await updateProduct(params.id, input));
});

export const DELETE = route<Params>(async ({ req, params }) => {
  await requireAdmin(req);
  await deactivateProduct(params.id);
  return new NextResponse(null, { status: 204 });
});
