import type { Metadata } from "next";
import Link from "next/link";
import { CancelAction } from "@/components/forms/CancelAction";
import { Alert, Card, linkStyles, PageHeader, StatusBadge, SummaryRow } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { loadForPage, type SearchParams } from "@/lib/page-helpers";
import { getOrder } from "@/lib/services/orders";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await requirePageUser(`/orders/${id}`);
  const order = await loadForPage(() => getOrder(user, id));

  return (
    <>
      <Link href="/orders" className={linkStyles} data-testid="order-back-link">
        Back to orders
      </Link>
      <div className="mt-4">
        <PageHeader
          title={order.orderNumber}
          description={`Placed ${formatDisplayDateTime(order.createdAt)}`}
          actions={<StatusBadge status={order.status} testId="order-detail-status" />}
          testId="order-detail"
        />
      </div>

      {placed === "1" && order.status === "PAID" ? (
        <div className="mb-4">
          <Alert tone="success" testId="order-placed-confirmation">
            Your order has been placed. This was a simulated payment.
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <table className="w-full text-left text-sm" data-testid="order-items-table">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Item</th>
                <th scope="col" className="p-3 font-medium">Quantity</th>
                <th scope="col" className="p-3 text-right font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId} className="border-b border-line last:border-0" data-testid={`order-item-${item.productId}`}>
                  <td className="p-3">
                    {item.name}
                    <span className="block text-xs text-muted">{item.sku}</span>
                  </td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3 text-right">{formatCents(item.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-4">
          <Card className="p-5" testId="order-totals">
            <SummaryRow label="Subtotal" value={formatCents(order.subtotalCents)} testId="order-subtotal" />
            <SummaryRow label="Tax" value={formatCents(order.taxCents)} testId="order-tax" />
            <SummaryRow label="Shipping" value={formatCents(order.shippingCents)} testId="order-shipping" />
            <div className="mt-2 border-t border-line pt-2">
              <SummaryRow label="Total" value={formatCents(order.totalCents)} testId="order-total" strong />
            </div>
          </Card>
          <Card className="space-y-1 p-5 text-sm" testId="order-shipping-address">
            <h2 className="font-semibold">Ship to</h2>
            <p>{order.shipping.fullName}</p>
            <p className="text-muted">{order.shipping.address}</p>
            <p className="text-muted">
              {order.shipping.city}, {order.shipping.postcode}, {order.shipping.country}
            </p>
            <p className="pt-2 text-xs text-muted" data-testid="order-payment-summary">
              {order.payment.cardBrand} ending {order.payment.cardLast4} ({order.paymentStatus})
            </p>
          </Card>
          {order.canCancel ? (
            <CancelAction endpoint={`/orders/${order.id}/cancel`} label="Cancel order" testId="order-cancel" />
          ) : null}
        </div>
      </div>
    </>
  );
}
