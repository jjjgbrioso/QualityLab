import Link from "next/link";
import { LogoutButton } from "@/components/forms/LogoutButton";
import { MobileNav } from "@/components/MobileNav";
import { getSessionUser } from "@/lib/auth/session";
import { cartItemCount } from "@/lib/services/cart";

const LINK_STYLE = "rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink";

export async function Navbar() {
  const user = await getSessionUser();
  const cartCount = user ? await cartItemCount(user.id) : 0;

  const primary = [
    { href: "/shop", label: "E-commerce", testId: "nav-link-ecommerce" },
    { href: "/banking", label: "Banking", testId: "nav-link-banking" },
    { href: "/travel", label: "Travel", testId: "nav-link-travel" },
    { href: "/api-docs", label: "API Docs", testId: "nav-link-api-docs" },
  ];
  const account = user
    ? [
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", testId: "nav-link-admin" }] : []),
        { href: "/orders", label: "Orders", testId: "nav-link-orders" },
        { href: "/bookings", label: "Bookings", testId: "nav-link-bookings" },
        { href: "/cart", label: `Cart (${cartCount})`, testId: "nav-link-cart" },
      ]
    : [{ href: "/login", label: "Login", testId: "nav-link-login" }];

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight" data-testid="nav-logo">
          Quality<span className="text-brand-700">Lab</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex" data-testid="nav-main">
          {primary.map((link) => (
            <Link key={link.href} href={link.href} className={LINK_STYLE} data-testid={link.testId}>
              {link.label}
            </Link>
          ))}
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          {account.map((link) => (
            <Link key={link.href} href={link.href} className={LINK_STYLE} data-testid={link.testId}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <span className="ml-1 text-sm text-muted" data-testid="nav-user-name">
                {user.firstName}
              </span>
              <LogoutButton testId="nav-logout" />
            </>
          ) : null}
        </nav>

        <MobileNav links={[...primary, ...account]} signedIn={Boolean(user)} />
      </div>
    </header>
  );
}
