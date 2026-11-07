import type { Metadata } from "next";
import Link from "next/link";
import { Alert, buttonStyles, Card, EmptyState, inputStyles, linkStyles, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { formatDisplayDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { listOrders } from "@/lib/services/orders";
import { ORDER_STATUSES, orderQuerySchema } from "@/lib/validation/commerce";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageUser("/orders");
  const { query, errors } = parsePageQuery(await searchParams, orderQuerySchema);
  const { items, meta } = await listOrders(query, user.id);

  return (
    <>
      <PageHeader title="Order history" testId="orders" />
      <form method="get" action="/orders" className="mb-4 flex flex-wrap items-end gap-3" data-testid="order-filter-form">
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium">Status</label>
          <select id="status" name="status" defaultValue={query.status ?? ""} className={inputStyles} data-testid="order-status-select">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonStyles.secondary} data-testid="order-filter-submit">Apply</button>
      </form>

      {errors.length > 0 ? <Alert tone="error" testId="order-filter-error">{errors[0].message}</Alert> : null}

      {items.length === 0 ? (
        <EmptyState title="No orders yet" testId="orders-empty-state">
          <Link href="/shop" className={linkStyles}>Start shopping</Link>
        </EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="orders-table">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Order</th>
                <th scope="col" className="p-3 font-medium">Date</th>
                <th scope="col" className="p-3 font-medium">Status</th>
                <th scope="col" className="p-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0" data-testid={`order-row-${order.id}`}>
                  <td className="p-3">
                    <Link href={`/orders/${order.id}`} className={linkStyles} data-testid={`order-link-${order.id}`}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{formatDisplayDateTime(order.createdAt)}</td>
                  <td className="p-3"><StatusBadge status={order.status} testId={`order-status-${order.id}`} /></td>
                  <td className="p-3 text-right font-medium">{formatCents(order.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination meta={meta} basePath="/orders" query={{ status: query.status }} testId="order-pagination" />
    </>
  );
}
