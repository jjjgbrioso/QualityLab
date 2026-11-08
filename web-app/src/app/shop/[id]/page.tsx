import type { Metadata } from "next";
import Link from "next/link";
import { Photo, ProductArt } from "@/components/art";
import { AddToCartForm } from "@/components/forms/AddToCartForm";
import { PriceTag, ProductCard, Rating } from "@/components/shop";
import { Alert, Badge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { loadForPage } from "@/lib/page-helpers";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { getProduct, listProducts } from "@/lib/services/products";
import { productQuerySchema } from "@/lib/validation/products";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageUser(`/shop/${id}`);
  const product = await loadForPage(() => getProduct(id));
  const related = (await listProducts(productQuerySchema.parse({ category: product.category, pageSize: "5", sort: "rating_desc" }))).items
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted" data-testid="product-breadcrumb">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/shop" className="hover:underline" data-testid="product-back-link">E-commerce</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:underline" data-testid="product-breadcrumb-category">
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <article className="grid gap-6 rounded-xl border border-line bg-surface p-4 md:grid-cols-2 md:p-6" data-testid="product-detail">
        <div className="relative overflow-hidden rounded-lg">
          {product.imageUrl ? (
            <Photo src={product.imageUrl} alt={product.name} className="h-64 md:h-96" sizes="(min-width: 768px) 50vw, 100vw" priority testId="product-detail-image" />
          ) : (
            <ProductArt category={product.category} className="h-64 md:h-96" testId="product-detail-image-placeholder" />
          )}
          {product.onSale ? (
            <span className="absolute left-3 top-3 rounded bg-rose-600 px-2 py-1 text-sm font-bold text-white">-{product.discountPercent}%</span>
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold leading-snug" data-testid="product-detail-name">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <Rating value={product.rating} size="md" testId="product-detail-rating" />
              <span className="text-muted">
                Sold by <span className="font-medium text-ink" data-testid="product-detail-seller">{product.brand} Store</span>
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-orange-50 p-4">
            <PriceTag product={product} size="lg" testIdPrefix="product-detail" />
            {product.onSale && product.listPriceCents !== null ? (
              <p className="mt-1 text-sm text-rose-700" data-testid="product-detail-saving">
                You save {formatCents(product.listPriceCents - product.priceCents)}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Delivery</dt>
            <dd>Free shipping on orders of {formatCents(FREE_SHIPPING_THRESHOLD_CENTS)} or more</dd>
            <dt className="text-muted">SKU</dt>
            <dd data-testid="product-detail-sku">{product.sku}</dd>
            <dt className="text-muted">Stock</dt>
            <dd data-testid="product-detail-stock">{product.stock}</dd>
          </dl>

          {!product.inStock ? (
            <Alert tone="warning" testId="product-detail-out-of-stock">
              <Badge tone="danger">Out of stock</Badge> This product cannot be ordered right now.
            </Alert>
          ) : (
            <AddToCartForm productId={product.id} stock={product.stock} />
          )}
        </div>
      </article>

      <section aria-labelledby="description-heading" className="rounded-xl border border-line bg-surface p-4 md:p-6">
        <h2 id="description-heading" className="mb-2 font-semibold">Product details</h2>
        <p className="text-sm text-muted" data-testid="product-detail-description">{product.description}</p>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" data-testid="related-products">
          <h2 id="related-heading" className="mb-3 text-lg font-bold">More in {product.category}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
