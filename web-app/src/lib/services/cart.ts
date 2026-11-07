import { ApiError, notFound } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { calculateTotals } from "@/lib/pricing";
import { MAX_LINE_QUANTITY, type AddCartItemInput } from "@/lib/validation/commerce";

function insufficientStock(name: string, available: number) {
  return new ApiError(409, "INSUFFICIENT_STOCK", `Only ${available} of ${name} available.`, [
    { field: "quantity", message: `Only ${available} available.` },
  ]);
}

export async function getCart(userId: string) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  const items = rows.map((row) => ({
    productId: row.productId,
    sku: row.product.sku,
    name: row.product.name,
    unitPriceCents: row.product.priceCents,
    quantity: row.quantity,
    lineTotalCents: row.product.priceCents * row.quantity,
    availableStock: row.product.stock,
  }));

  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    ...calculateTotals(subtotalCents),
  };
}

export type CartDto = Awaited<ReturnType<typeof getCart>>;

export async function cartItemCount(userId: string): Promise<number> {
  const result = await prisma.cartItem.aggregate({ where: { userId }, _sum: { quantity: true } });
  return result._sum.quantity ?? 0;
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  const product = await prisma.product.findFirst({ where: { id: input.productId, isActive: true } });
  if (!product) throw notFound("Product", "PRODUCT_NOT_FOUND");

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId: product.id } },
  });
  const quantity = (existing?.quantity ?? 0) + input.quantity;

  if (quantity > product.stock) throw insufficientStock(product.name, product.stock);
  if (quantity > MAX_LINE_QUANTITY) {
    throw new ApiError(422, "CART_LIMIT_EXCEEDED", `A cart line can hold at most ${MAX_LINE_QUANTITY} units.`);
  }

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId: product.id } },
    create: { userId, productId: product.id, quantity },
    update: { quantity },
  });
  return getCart(userId);
}

export async function updateCartItem(userId: string, productId: string, quantity: number) {
  const item = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
    include: { product: true },
  });
  if (!item) throw notFound("Cart item", "CART_ITEM_NOT_FOUND");
  if (quantity > item.product.stock) throw insufficientStock(item.product.name, item.product.stock);

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart(userId);
}

export async function removeCartItem(userId: string, productId: string) {
  const { count } = await prisma.cartItem.deleteMany({ where: { userId, productId } });
  if (count === 0) throw notFound("Cart item", "CART_ITEM_NOT_FOUND");
  return getCart(userId);
}

export async function clearCart(userId: string) {
  await prisma.cartItem.deleteMany({ where: { userId } });
  return getCart(userId);
}
