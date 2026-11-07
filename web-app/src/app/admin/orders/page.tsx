import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { OrderStatusButton } from "@/components/forms/OrderStatusButton";
import { Card, EmptyState, linkStyles, PageHeader, Pagination, StatusBadge } from "@/components/ui";
import { requirePageAdmin } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { parsePageQuery, type SearchParams } from "@/lib/page-helpers";
import { listOrders } from "@/lib/services/orders";
import { orderQuerySchema } from "@/lib/validation/commerce";

export const metadata: Metadata = { title: "Manage orders" };

const NEXT_STATUS = { PAID: "SHIPPED", SHIPPED: "DELIVERED" } as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePageAdmin("/admin/orders");
  const { query } = parsePageQuery(await searchParams, orderQuerySchema);
  const { items, meta } = await listOrders(query);

  return (
    <>
      <PageHeader title="Manage orders" testId="admin-orders" />
      <AdminNav />
      {items.length === 0 ? (
        <EmptyState title="No orders found" testId="admin-orders-empty-state" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="admin-orders-table">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Order</th>
                <th scope="col" className="p-3 font-medium">Customer</th>
                <th scope="col" className="p-3 font-medium">Status</th>
                <th scope="col" className="p-3 text-right font-medium">Total</th>
                <th scope="col" className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => {
                const next = NEXT_STATUS[order.status as keyof typeof NEXT_STATUS];
                return (
                  <tr key={order.id} className="border-b border-line last:border-0" data-testid={`admin-order-row-${order.id}`}>
                    <td className="p-3">
                      <Link href={`/orders/${order.id}`} className={linkStyles}>{order.orderNumber}</Link>
                    </td>
                    <td className="p-3 text-muted">{order.shipping.fullName}</td>
                    <td className="p-3"><StatusBadge status={order.status} testId={`admin-order-status-${order.id}`} /></td>
                    <td className="p-3 text-right font-medium">{formatCents(order.totalCents)}</td>
                    <td className="p-3">{next ? <OrderStatusButton orderId={order.id} status={next} /> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination meta={meta} basePath="/admin/orders" query={{ status: query.status }} testId="admin-order-pagination" />
    </>
  );
}
