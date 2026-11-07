import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Badge, buttonStyles, Card, EmptyState, inputStyles, PageHeader, Pagination, Thumb } from "@/components/ui";
import { formatCents } from "@/lib/money";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { listCategories, listProducts, type ProductDto } from "@/lib/services/products";
import { productQuerySchema } from "@/lib/validation/products";

export const metadata: Metadata = { title: "E-commerce" };

const SORT_LABELS: Record<string, string> = {
  name_asc: "Name: A to Z",
  name_desc: "Name: Z to A",
  price_asc: "Lowest price",
  price_desc: "Highest price",
  rating_desc: "Highest rated",
  newest: "Newest",
};

function ProductCard({ product }: { product: ProductDto }) {
  return (
    <Link href={`/shop/${product.id}`} className="group" data-testid={`product-card-${product.id}`}>
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-brand-700">
        <Thumb seed={product.category} label={product.name.slice(0, 1)} className="h-32" />
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="text-xs text-muted">{product.category}</p>
          <h2 className="text-sm font-medium" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h2>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-semibold" data-testid={`product-price-${product.id}`}>
              {formatCents(product.priceCents)}
            </span>
            {product.inStock ? (
              <Badge tone="success">In stock</Badge>
            ) : (
              <Badge tone="danger" testId={`product-out-of-stock-${product.id}`}>Out of stock</Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const { query, errors } = parsePageQuery(raw, productQuerySchema);
  const [{ items, meta }, categories] = await Promise.all([listProducts(query), listCategories()]);

  return (
    <>
      <PageHeader title="E-commerce" description="Browse the demo catalog. All products are fictional." testId="shop" />

      <form method="get" action="/shop" className="mb-6" data-testid="product-filter-form">
        <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label htmlFor="q" className="mb-1 block text-xs font-medium">Search</label>
            <input id="q" name="q" type="search" defaultValue={query.q ?? ""} placeholder="Name, description, or SKU" className={inputStyles} data-testid="product-search-input" />
          </div>
          <div>
            <label htmlFor="category" className="mb-1 block text-xs font-medium">Category</label>
            <select id="category" name="category" defaultValue={query.category ?? ""} className={inputStyles} data-testid="product-category-select">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="minPrice" className="mb-1 block text-xs font-medium">Min price ($)</label>
            <input id="minPrice" name="minPrice" type="number" min={0} step="0.01" defaultValue={query.minPrice ?? ""} className={inputStyles} data-testid="product-min-price-input" />
          </div>
          <div>
            <label htmlFor="maxPrice" className="mb-1 block text-xs font-medium">Max price ($)</label>
            <input id="maxPrice" name="maxPrice" type="number" min={0} step="0.01" defaultValue={query.maxPrice ?? ""} className={inputStyles} data-testid="product-max-price-input" />
          </div>
          <div>
            <label htmlFor="sort" className="mb-1 block text-xs font-medium">Sort by</label>
            <select id="sort" name="sort" defaultValue={query.sort} className={inputStyles} data-testid="product-sort-select">
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="inStock" value="true" defaultChecked={query.inStock === true} data-testid="product-in-stock-checkbox" />
              In stock only
            </label>
            <button type="submit" className={buttonStyles.primary} data-testid="product-filter-submit">Apply</button>
            <Link href="/shop" className={buttonStyles.secondary} data-testid="product-filter-clear">Clear</Link>
          </div>
        </Card>
      </form>

      {errors.length > 0 ? (
        <div className="mb-4">
          <Alert tone="error" testId="product-filter-error">{errors[0].message}</Alert>
        </div>
      ) : null}

      <p className="mb-3 text-sm text-muted" data-testid="product-result-count">
        {meta.totalItems} {meta.totalItems === 1 ? "product" : "products"}
      </p>

      {items.length === 0 ? (
        <EmptyState title="No products match these filters" testId="product-empty-state">
          Try a wider search or clear the filters.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="product-grid">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination meta={meta} basePath="/shop" query={{ ...raw, page: undefined } as Record<string, string | undefined>} testId="product-pagination" />
    </>
  );
}
