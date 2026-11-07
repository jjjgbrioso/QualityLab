import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { Card, EmptyState, linkStyles, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageAdmin } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { adminStats, LOW_STOCK_THRESHOLD } from "@/lib/services/admin";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  await requirePageAdmin("/admin");
  const stats = await adminStats();

  const tiles = [
    { label: "Users", value: String(stats.counts.users), testId: "admin-stat-users" },
    { label: "Active products", value: String(stats.counts.products), testId: "admin-stat-products" },
    { label: "Orders", value: String(stats.counts.orders), testId: "admin-stat-orders" },
    { label: "Confirmed bookings", value: String(stats.counts.confirmedBookings), testId: "admin-stat-bookings" },
    { label: "Bank accounts", value: String(stats.counts.bankAccounts), testId: "admin-stat-accounts" },
    { label: "Simulated revenue", value: formatCents(stats.revenueCents), testId: "admin-stat-revenue" },
  ];

  return (
    <>
      <PageHeader title="Admin dashboard" description="Live figures from the demo data." testId="admin" />
      <AdminNav />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.testId} className="p-5">
            <p className="text-sm text-muted">{tile.label}</p>
            <p className="text-2xl font-semibold" data-testid={tile.testId}>{tile.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="low-stock-heading">
          <h2 id="low-stock-heading" className="mb-3 font-semibold">
            Low stock ({LOW_STOCK_THRESHOLD} or fewer)
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <EmptyState title="Nothing is low on stock" testId="admin-low-stock-empty" />
          ) : (
            <Card testId="admin-low-stock-list">
              <ul>
                {stats.lowStockProducts.map((product) => (
                  <li key={product.id} className="flex justify-between gap-3 border-b border-line p-3 text-sm last:border-0" data-testid={`admin-low-stock-${product.id}`}>
                    <Link href={`/admin/products/${product.id}`} className={linkStyles}>{product.name}</Link>
                    <span className="text-muted">{product.stock} left</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <section aria-labelledby="recent-orders-heading">
          <h2 id="recent-orders-heading" className="mb-3 font-semibold">Recent orders</h2>
          <Card testId="admin-recent-orders">
            <ul>
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 border-b border-line p-3 text-sm last:border-0" data-testid={`admin-recent-order-${order.id}`}>
                  <Link href={`/orders/${order.id}`} className={linkStyles}>{order.orderNumber}</Link>
                  <StatusBadge status={order.status} />
                  <span className="font-medium">{formatCents(order.totalCents)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </>
  );
}
