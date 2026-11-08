import Link from "next/link";
import { Photo, ProductArt } from "@/components/art";
import { formatCents } from "@/lib/money";
import type { ProductDto } from "@/lib/services/products";

/** Shop accent, shared so every marketplace screen uses the same colours. */
export const shopButton =
  "inline-flex items-center justify-center gap-2 rounded-md bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700";
export const shopButtonOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-orange-700 bg-white px-4 py-2 text-sm font-semibold text-orange-800 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700";

export function Rating({ value, testId, size = "sm" }: { value: number; testId?: string; size?: "sm" | "md" }) {
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1 ${size === "md" ? "text-sm" : "text-xs"}`} data-testid={testId}>
      <span className="text-amber-500" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        {"★".repeat(full)}
        <span className="text-slate-300">{"★".repeat(5 - full)}</span>
      </span>
      <span className="text-muted">{value.toFixed(1)}</span>
    </span>
  );
}

export function PriceTag({ product, size = "sm", testIdPrefix }: { product: ProductDto; size?: "sm" | "lg"; testIdPrefix: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-bold text-orange-800 ${size === "lg" ? "text-3xl" : "text-base"}`} data-testid={`${testIdPrefix}-price${size === "lg" ? "" : `-${product.id}`}`}>
        {formatCents(product.priceCents)}
      </span>
      {product.onSale && product.listPriceCents !== null ? (
        <>
          <span className={`text-muted line-through ${size === "lg" ? "text-base" : "text-xs"}`} data-testid={`${testIdPrefix}-list-price${size === "lg" ? "" : `-${product.id}`}`}>
            <span className="sr-only">Was </span>
            {formatCents(product.listPriceCents)}
          </span>
          <span className={`font-semibold text-rose-700 ${size === "lg" ? "text-base" : "text-xs"}`} data-testid={`${testIdPrefix}-discount${size === "lg" ? "" : `-${product.id}`}`}>
            -{product.discountPercent}%
          </span>
        </>
      ) : null}
    </div>
  );
}

export function ProductCard({ product }: { product: ProductDto }) {
  return (
    <Link
      href={`/shop/${product.id}`}
      className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
      data-testid={`product-card-${product.id}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm transition-shadow group-hover:shadow-md">
        <div className="relative">
          {product.imageUrl ? (
            <Photo src={product.imageUrl} alt="" className="h-36" sizes="(min-width: 1024px) 220px, 50vw" testId={`product-image-${product.id}`} />
          ) : (
            <ProductArt category={product.category} className="h-36" testId={`product-image-placeholder-${product.id}`} />
          )}
          {product.onSale ? (
            <span className="absolute left-2 top-2 rounded bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white" data-testid={`product-sale-badge-${product.id}`}>
              -{product.discountPercent}%
            </span>
          ) : null}
          {!product.inStock ? (
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 py-1 text-center text-xs font-semibold text-white" data-testid={`product-out-of-stock-${product.id}`}>
              Out of stock
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h2 className="line-clamp-2 text-sm leading-snug" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h2>
          <PriceTag product={product} testIdPrefix="product" />
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <Rating value={product.rating} />
            <span className="truncate text-xs text-muted">{product.brand}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
