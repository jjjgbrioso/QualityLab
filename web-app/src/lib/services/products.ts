import type { Prisma, Product } from "@/generated/prisma/client";
import { ApiError, notFound } from "@/lib/api/errors";
import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { prisma } from "@/lib/prisma";
import type {
  ProductCreateInput,
  ProductQuery,
  ProductSort,
  ProductUpdateInput,
} from "@/lib/validation/products";

export function toProductDto(product: Product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    brand: product.brand,
    priceCents: product.priceCents,
    stock: product.stock,
    inStock: product.stock > 0,
    rating: product.rating,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type ProductDto = ReturnType<typeof toProductDto>;

// `id` breaks ties, so a product never appears on two pages or goes missing between them.
const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  name_asc: [{ name: "asc" }, { id: "asc" }],
  name_desc: [{ name: "desc" }, { id: "asc" }],
  price_asc: [{ priceCents: "asc" }, { id: "asc" }],
  price_desc: [{ priceCents: "desc" }, { id: "asc" }],
  rating_desc: [{ rating: "desc" }, { id: "asc" }],
  newest: [{ createdAt: "desc" }, { id: "asc" }],
};

export async function listProducts(query: ProductQuery) {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.category) where.category = query.category;
  if (query.inStock === true) where.stock = { gt: 0 };
  if (query.inStock === false) where.stock = 0;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.priceCents = {
      ...(query.minPrice !== undefined ? { gte: Math.round(query.minPrice * 100) } : {}),
      ...(query.maxPrice !== undefined ? { lte: Math.round(query.maxPrice * 100) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: ORDER_BY[query.sort],
      skip: pageSkip(query.page, query.pageSize),
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items: items.map(toProductDto), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function listCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

export async function getProduct(id: string) {
  const product = await prisma.product.findFirst({ where: { id, isActive: true } });
  if (!product) throw notFound("Product", "PRODUCT_NOT_FOUND");
  return toProductDto(product);
}

// --- Admin ---

export async function adminListProducts(query: { q?: string; page: number; pageSize: number }) {
  const where: Prisma.ProductWhereInput = query.q
    ? {
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { sku: { contains: query.q, mode: "insensitive" } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: pageSkip(query.page, query.pageSize),
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return { items: items.map(toProductDto), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function adminGetProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw notFound("Product", "PRODUCT_NOT_FOUND");
  return toProductDto(product);
}

function skuConflict(error: unknown): never {
  const code = (error as { code?: string }).code;
  if (code === "P2002") {
    throw new ApiError(409, "SKU_ALREADY_EXISTS", "A product with this SKU already exists.", [
      { field: "sku", message: "A product with this SKU already exists." },
    ]);
  }
  if (code === "P2025") throw notFound("Product", "PRODUCT_NOT_FOUND");
  throw error;
}

export async function createProduct(input: ProductCreateInput) {
  try {
    return toProductDto(await prisma.product.create({ data: input }));
  } catch (error) {
    skuConflict(error);
  }
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  try {
    return toProductDto(await prisma.product.update({ where: { id }, data: input }));
  } catch (error) {
    skuConflict(error);
  }
}

/** Products are deactivated rather than removed, so past orders keep their item history. */
export async function deactivateProduct(id: string) {
  await updateProduct(id, { isActive: false });
}

export async function adjustInventory(actorId: string, id: string, delta: number, note?: string) {
  return prisma.$transaction(async (tx) => {
    const [product] = await tx.product.updateManyAndReturn({
      where: { id, stock: { gte: Math.max(0, -delta) } },
      data: { stock: { increment: delta } },
    });
    if (!product) {
      const exists = await tx.product.findUnique({ where: { id }, select: { id: true } });
      if (!exists) throw notFound("Product", "PRODUCT_NOT_FOUND");
      throw new ApiError(422, "INVALID_STOCK_ADJUSTMENT", "This change would make stock negative.");
    }
    await tx.inventoryMovement.create({
      data: {
        productId: id,
        delta,
        stockAfter: product.stock,
        reason: "ADMIN_ADJUSTMENT",
        note,
        actorId,
      },
    });
    return toProductDto(product);
  });
}
