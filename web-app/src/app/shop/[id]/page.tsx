import type { Metadata } from "next";
import Link from "next/link";
import { AddToCartForm } from "@/components/forms/AddToCartForm";
import { Alert, Badge, buttonStyles, Card, linkStyles, Thumb } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { loadForPage } from "@/lib/page-helpers";
import { getProduct } from "@/lib/services/products";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, user] = await Promise.all([loadForPage(() => getProduct(id)), getSessionUser()]);

  return (
    <>
      <Link href="/shop" className={linkStyles} data-testid="product-back-link">
        Back to products
      </Link>
      <Card className="mt-4 grid overflow-hidden md:grid-cols-2" testId="product-detail">
        <Thumb seed={product.category} label={product.name.slice(0, 1)} className="h-56 md:h-full" />
        <div className="space-y-3 p-6">
          <p className="text-sm text-muted">
            {product.category} · {product.brand}
          </p>
          <h1 className="text-2xl font-semibold" data-testid="product-detail-name">
            {product.name}
          </h1>
          <p className="text-sm text-muted" data-testid="product-detail-description">
            {product.description}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">SKU</dt>
            <dd data-testid="product-detail-sku">{product.sku}</dd>
            <dt className="text-muted">Rating</dt>
            <dd data-testid="product-detail-rating">{product.rating.toFixed(1)} of 5</dd>
            <dt className="text-muted">Stock</dt>
            <dd data-testid="product-detail-stock">{product.stock}</dd>
          </dl>
          <p className="text-2xl font-semibold" data-testid="product-detail-price">
            {formatCents(product.priceCents)}
          </p>

          {!product.inStock ? (
            <Alert tone="warning" testId="product-detail-out-of-stock">
              <Badge tone="danger">Out of stock</Badge> This product cannot be ordered right now.
            </Alert>
          ) : user ? (
            <AddToCartForm productId={product.id} stock={product.stock} />
          ) : (
            <Link href={`/login?next=${encodeURIComponent(`/shop/${product.id}`)}`} className={buttonStyles.primary} data-testid="product-login-to-buy">
              Sign in to buy
            </Link>
          )}
        </div>
      </Card>
    </>
  );
}
