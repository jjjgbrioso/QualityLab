import type { Metadata } from "next";
import Link from "next/link";
import { CategoryIcon, categoryColors, Photo, ProductArt } from "@/components/art";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { PriceTag, ProductCard, shopButton } from "@/components/shop";
import { Alert, buttonStyles, EmptyState, inputStyles, Pagination } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { formatCents } from "@/lib/money";
import { parsePageQuery, pathWithQuery, type SearchParams } from "@/lib/page-helpers";
import { listCategories, listFlashSale, listProducts } from "@/lib/services/products";
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

const FORM_ID = "product-filter-form";
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  await requirePageUser(pathWithQuery("/shop", raw));
  const { query, errors } = parsePageQuery(raw, productQuerySchema);

  const browsing =
    !query.q && !query.category && query.minPrice === undefined && query.maxPrice === undefined &&
    query.inStock === undefined && query.onSale === undefined && query.page === 1;

  const [{ items, meta }, categories, flashSale] = await Promise.all([
    listProducts(query),
    listCategories(),
    browsing ? listFlashSale() : Promise.resolve([]),
  ]);
  const biggestDiscount = Math.max(0, ...flashSale.map((product) => product.discountPercent ?? 0));

  const heading = query.q
    ? `Results for "${query.q}"`
    : query.category
      ? query.category
      : query.onSale
        ? "Deals"
        : "Just for you";

  return (
    <div className="space-y-6">
      <section className="-mx-4 -mt-8 bg-gradient-to-r from-orange-700 via-orange-600 to-rose-600 px-4 py-5 sm:-mx-6 sm:px-6" data-testid="shop-header">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-100">QualityLab</p>
            <h1 className="text-2xl font-bold" data-testid="shop-title">E-commerce</h1>
          </div>
          <form id={FORM_ID} method="get" action="/shop" role="search" className="flex flex-1 gap-2 md:ml-6" data-testid="product-filter-form">
            <label htmlFor="q" className="sr-only">Search products</label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query.q ?? ""}
              placeholder="Search products, brands, or SKUs"
              className="min-w-0 flex-1 rounded-md border-0 bg-white px-4 py-2.5 text-sm text-ink shadow-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-white"
              data-testid="product-search-input"
            />
            <button type="submit" className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white" data-testid="product-search-button">
              Search
            </button>
          </form>
        </div>
      </section>

      {browsing ? (
        <>
          <section aria-label="Promotions" className="grid gap-3 md:grid-cols-3" data-testid="promo-banners">
            <Link
              href="/shop?onSale=true"
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-700 to-orange-600 p-6 text-white md:col-span-2"
              data-testid="promo-banner-sale"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-100">Payday Deals</p>
              <p className="mt-1 text-3xl font-extrabold leading-tight">Up to {biggestDiscount}% off selected items</p>
              <p className="mt-2 text-sm text-orange-50">Discounts on headphones, rain jackets, knit throws, and more.</p>
              <span className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-sm font-semibold text-rose-700">Shop the sale</span>
              <div className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />
              <div className="absolute -right-2 top-4 h-20 w-20 rounded-full bg-white/10" aria-hidden="true" />
            </Link>
            <div className="grid gap-3">
              <div className="rounded-xl bg-slate-900 p-5 text-white" data-testid="promo-banner-shipping">
                <p className="text-lg font-bold">Free shipping</p>
                <p className="text-sm text-slate-300">On orders of {formatCents(FREE_SHIPPING_THRESHOLD_CENTS)} or more.</p>
              </div>
              <Link href="/shop?category=Books" className="rounded-xl bg-violet-700 p-5 text-white hover:bg-violet-800" data-testid="promo-banner-books">
                <p className="text-lg font-bold">Books for testers</p>
                <p className="text-sm text-violet-100">Test design, automation, and SQL guides.</p>
              </Link>
            </div>
          </section>

          {flashSale.length > 0 ? (
            <section aria-labelledby="flash-sale-heading" className="rounded-xl border border-line bg-surface p-4" data-testid="flash-sale-strip">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="flash-sale-heading" className="text-lg font-bold text-orange-800">Flash Sale</h2>
                <Link href="/shop?onSale=true" className="text-sm font-semibold text-orange-800 hover:underline" data-testid="flash-sale-view-all">
                  Shop all deals
                </Link>
              </div>
              <ul className="flex gap-3 overflow-x-auto pb-1">
                {flashSale.map((product) => (
                  <li key={product.id} className="relative w-40 shrink-0">
                    <Link href={`/shop/${product.id}`} className="block rounded-lg border border-line hover:shadow-md" data-testid={`flash-sale-item-${product.id}`}>
                      <div className="relative">
                        {product.imageUrl ? (
                          <Photo src={product.imageUrl} alt="" className="h-28 rounded-t-lg" sizes="160px" testId={`flash-sale-image-${product.id}`} />
                        ) : (
                          <ProductArt category={product.category} className="h-28 rounded-t-lg" />
                        )}
                        <span className="absolute left-2 top-2 rounded bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white">-{product.discountPercent}%</span>
                      </div>
                      <div className="space-y-1 p-2">
                        <p className="line-clamp-1 text-xs">{product.name}</p>
                        <PriceTag product={product} testIdPrefix="flash-sale" />
                        <p className="text-xs text-muted">{product.stock} left</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="categories-heading" data-testid="category-tiles">
            <h2 id="categories-heading" className="mb-3 text-lg font-bold">Categories</h2>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {categories.map((category) => {
                const [from] = categoryColors(category);
                return (
                  <li key={category}>
                    <Link
                      href={`/shop?category=${encodeURIComponent(category)}`}
                      className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface p-3 text-center text-sm hover:border-orange-700"
                      data-testid={`category-tile-${slug(category)}`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: from }}>
                        <CategoryIcon category={category} />
                      </span>
                      {category}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filters" className="h-fit rounded-xl border border-line bg-surface p-4" data-testid="product-filters">
          <h2 className="mb-3 font-semibold">Filters</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="mb-1 block text-xs font-medium">Category</label>
              <select id="category" name="category" form={FORM_ID} defaultValue={query.category ?? ""} className={inputStyles} data-testid="product-category-select">
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="mb-1 text-xs font-medium">Price ($)</legend>
              <div className="flex items-center gap-2">
                <label htmlFor="minPrice" className="sr-only">Minimum price</label>
                <input id="minPrice" name="minPrice" form={FORM_ID} type="number" min={0} step="0.01" placeholder="Min" defaultValue={query.minPrice ?? ""} className={inputStyles} data-testid="product-min-price-input" />
                <span aria-hidden="true" className="text-muted">to</span>
                <label htmlFor="maxPrice" className="sr-only">Maximum price</label>
                <input id="maxPrice" name="maxPrice" form={FORM_ID} type="number" min={0} step="0.01" placeholder="Max" defaultValue={query.maxPrice ?? ""} className={inputStyles} data-testid="product-max-price-input" />
              </div>
            </fieldset>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="inStock" value="true" form={FORM_ID} defaultChecked={query.inStock === true} data-testid="product-in-stock-checkbox" />
                In stock only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="onSale" value="true" form={FORM_ID} defaultChecked={query.onSale === true} data-testid="product-on-sale-checkbox" />
                On sale only
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" form={FORM_ID} className={`${shopButton} flex-1`} data-testid="product-filter-submit">Apply</button>
              <Link href="/shop" className={buttonStyles.secondary} data-testid="product-filter-clear">Clear</Link>
            </div>
          </div>
        </aside>

        <section aria-labelledby="results-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="results-heading" className="text-lg font-bold" data-testid="product-results-heading">{heading}</h2>
              <p className="text-sm text-muted" data-testid="product-result-count">
                {meta.totalItems} {meta.totalItems === 1 ? "product" : "products"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="whitespace-nowrap text-sm text-muted">Sort by</label>
              <AutoSubmitSelect id="sort" name="sort" form={FORM_ID} defaultValue={query.sort} className={`${inputStyles} w-auto`} data-testid="product-sort-select">
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </AutoSubmitSelect>
            </div>
          </div>

          {errors.length > 0 ? (
            <div className="mb-4">
              <Alert tone="error" testId="product-filter-error">{errors[0].message}</Alert>
            </div>
          ) : null}

          {items.length === 0 ? (
            <EmptyState title="No products match these filters" testId="product-empty-state">
              Try a wider search or clear the filters.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" data-testid="product-grid">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination meta={meta} basePath="/shop" query={{ ...raw, page: undefined } as Record<string, string | undefined>} testId="product-pagination" />
        </section>
      </div>
    </div>
  );
}
