import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { MODULE_LABELS } from "@/lib/modules";
import { formatDisplayDateTime } from "@/lib/dates";
import { accountSummary } from "@/lib/services/account";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await requirePageUser("/account");
  const { user, counts } = await accountSummary(session.id);

  // Only the signed-in module's activity is shown, because the other modules are locked.
  const tiles = [
    { module: "ecommerce", label: "Orders", value: counts.orders, href: "/orders", testId: "account-orders" },
    { module: "ecommerce", label: "Items in cart", value: counts.cartItems, href: "/cart", testId: "account-cart" },
    { module: "travel", label: "Upcoming hotel stays", value: counts.hotelBookings, href: "/bookings", testId: "account-hotel-bookings" },
    { module: "travel", label: "Upcoming cruises", value: counts.cruiseBookings, href: "/bookings?type=cruises", testId: "account-cruise-bookings" },
    { module: "banking", label: "Bank accounts", value: counts.bankAccounts, href: "/banking", testId: "account-bank-accounts" },
  ].filter((tile) => tile.module === session.module);

  return (
    <>
      <PageHeader title="My account" description="Your profile and activity in QualityLab." testId="account" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit p-5" testId="account-profile">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-xl font-semibold text-white" aria-hidden="true">
            {user.firstName.slice(0, 1)}
            {user.lastName.slice(0, 1)}
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="font-medium" data-testid="account-name">{user.firstName} {user.lastName}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd data-testid="account-email">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Role</dt>
              <dd><StatusBadge status={user.role} testId="account-role" /></dd>
            </div>
            <div>
              <dt className="text-muted">Signed in to</dt>
              <dd data-testid="account-module">{MODULE_LABELS[session.module]}</dd>
            </div>
            <div>
              <dt className="text-muted">Member since</dt>
              <dd>{formatDisplayDateTime(user.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        <section aria-labelledby="activity-heading" className="lg:col-span-2">
          <h2 id="activity-heading" className="mb-3 font-semibold">Activity</h2>
          {tiles.length === 0 ? (
            <p className="text-sm text-muted" data-testid="account-admin-note">
              Admin activity is on the <Link href="/admin" className="text-brand-700 hover:underline">admin dashboard</Link>.
            </p>
          ) : null}
          <ul className="grid gap-3 sm:grid-cols-2">
            {tiles.map((tile) => (
              <li key={tile.testId}>
                <Link href={tile.href} className="block rounded-lg border border-line bg-surface p-4 hover:border-brand-700" data-testid={tile.testId}>
                  <p className="text-sm text-muted">{tile.label}</p>
                  <p className="text-2xl font-semibold">{tile.value}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
