import type { Metadata } from "next";
import Link from "next/link";
import { CartLines } from "@/components/forms/CartLines";
import { buttonStyles, Card, EmptyState, PageHeader, SummaryRow } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { getCart } from "@/lib/services/cart";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await requirePageUser("/cart");
  const cart = await getCart(user.id);

  return (
    <>
      <PageHeader title="Your cart" testId="cart" />
      {cart.items.length === 0 ? (
        <EmptyState title="Your cart is empty" testId="cart-empty-state">
          <Link href="/shop" className={buttonStyles.primary} data-testid="cart-browse-link">
            Browse products
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CartLines items={cart.items} />
          </div>
          <Card className="h-fit p-5" testId="cart-summary">
            <h2 className="mb-2 font-semibold">Summary</h2>
            <SummaryRow label="Subtotal" value={formatCents(cart.subtotalCents)} testId="cart-subtotal" />
            <SummaryRow label="Tax (8%)" value={formatCents(cart.taxCents)} testId="cart-tax" />
            <SummaryRow label="Shipping" value={formatCents(cart.shippingCents)} testId="cart-shipping" />
            <div className="mt-2 border-t border-line pt-2">
              <SummaryRow label="Total" value={formatCents(cart.totalCents)} testId="cart-total" strong />
            </div>
            <Link href="/checkout" className={`${buttonStyles.primary} mt-4 w-full`} data-testid="cart-checkout-link">
              Go to checkout
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}
