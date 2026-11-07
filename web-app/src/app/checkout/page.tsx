import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { Card, PageHeader, SummaryRow } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { getCart } from "@/lib/services/cart";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requirePageUser("/checkout");
  const cart = await getCart(user.id);
  if (cart.items.length === 0) redirect("/cart");

  return (
    <>
      <PageHeader title="Checkout" description="Shipping details and simulated payment." testId="checkout" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm />
        </div>
        <Card className="h-fit p-5" testId="checkout-summary">
          <h2 className="mb-2 font-semibold">Order summary</h2>
          <ul className="mb-2 space-y-1 text-sm">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3" data-testid={`checkout-item-${item.productId}`}>
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatCents(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-2">
            <SummaryRow label="Subtotal" value={formatCents(cart.subtotalCents)} testId="checkout-subtotal" />
            <SummaryRow label="Tax (8%)" value={formatCents(cart.taxCents)} testId="checkout-tax" />
            <SummaryRow label="Shipping" value={formatCents(cart.shippingCents)} testId="checkout-shipping" />
            <SummaryRow label="Total" value={formatCents(cart.totalCents)} testId="checkout-total" strong />
          </div>
        </Card>
      </div>
    </>
  );
}
