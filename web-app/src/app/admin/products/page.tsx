import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { Badge, buttonStyles, Card, EmptyState, inputStyles, linkStyles, PageHeader, Pagination } from "@/components/ui";
import { requirePageAdmin } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { adminListProducts } from "@/lib/services/products";
import { adminProductQuerySchema } from "@/lib/validation/products";

export const metadata: Metadata = { title: "Manage products" };

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePageAdmin("/admin/products");
  const { query } = parsePageQuery(await searchParams, adminProductQuerySchema);
  const { items, meta } = await adminListProducts(query);

  return (
    <>
      <PageHeader
        title="Manage products"
        actions={
          <Link href="/admin/products/new" className={buttonStyles.primary} data-testid="admin-product-new-link">
            New product
          </Link>
        }
        testId="admin-products"
      />
      <AdminNav />

      <form method="get" action="/admin/products" className="mb-4 flex flex-wrap items-end gap-3" data-testid="admin-product-search-form">
        <div className="w-64 max-w-full">
          <label htmlFor="q" className="mb-1 block text-xs font-medium">Search</label>
          <input id="q" name="q" type="search" defaultValue={query.q ?? ""} placeholder="Name or SKU" className={inputStyles} data-testid="admin-product-search-input" />
        </div>
        <button type="submit" className={buttonStyles.secondary} data-testid="admin-product-search-submit">Search</button>
      </form>

      {items.length === 0 ? (
        <EmptyState title="No products found" testId="admin-products-empty-state" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="admin-products-table">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Name</th>
                <th scope="col" className="p-3 font-medium">SKU</th>
                <th scope="col" className="p-3 text-right font-medium">Price</th>
                <th scope="col" className="p-3 text-right font-medium">Stock</th>
                <th scope="col" className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0" data-testid={`admin-product-row-${product.id}`}>
                  <td className="p-3">
                    <Link href={`/admin/products/${product.id}`} className={linkStyles} data-testid={`admin-product-link-${product.id}`}>
                      {product.name}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs">{product.sku}</td>
                  <td className="p-3 text-right">{formatCents(product.priceCents)}</td>
                  <td className="p-3 text-right" data-testid={`admin-product-stock-${product.id}`}>{product.stock}</td>
                  <td className="p-3">
                    {product.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination meta={meta} basePath="/admin/products" query={{ q: query.q }} testId="admin-product-pagination" />
    </>
  );
}
