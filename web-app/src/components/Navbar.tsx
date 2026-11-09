import Link from "next/link";
import { LogoutButton } from "@/components/forms/LogoutButton";
import { MobileNav } from "@/components/MobileNav";
import { getSessionUser } from "@/lib/auth/session";
import { type AppModule, MODULE_LABELS } from "@/lib/modules";
import { cartItemCount } from "@/lib/services/cart";

const LINK_STYLE = "rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink";

type NavLink = { href: string; label: string; testId: string };

/** Links for the one module a session can use. Other modules are reached from the home page. */
function moduleLinks(module: AppModule, cartCount: number): NavLink[] {
  switch (module) {
    case "ecommerce":
      return [
        { href: "/shop", label: "E-commerce", testId: "nav-link-ecommerce" },
        { href: "/orders", label: "Orders", testId: "nav-link-orders" },
        { href: "/cart", label: `Cart (${cartCount})`, testId: "nav-link-cart" },
      ];
    case "banking":
      return [{ href: "/banking", label: "Banking", testId: "nav-link-banking" }];
    case "travel":
      return [
        { href: "/travel", label: "Travel & Cruise", testId: "nav-link-travel" },
        { href: "/bookings", label: "Bookings", testId: "nav-link-bookings" },
      ];
    case "admin":
      return [{ href: "/admin", label: "Admin", testId: "nav-link-admin" }];
  }
}

export async function Navbar() {
  const user = await getSessionUser();
  const cartCount = user?.module === "ecommerce" ? await cartItemCount(user.id) : 0;

  // Signed out, every module is offered and each one leads to its login page. There is no Login link,
  // and the API docs link appears only after signing in.
  const primary: NavLink[] = user
    ? [{ href: "/", label: "All modules", testId: "nav-link-modules" }, { href: "/api-docs", label: "API Docs", testId: "nav-link-api-docs" }]
    : [
        { href: "/shop", label: "E-commerce", testId: "nav-link-ecommerce" },
        { href: "/banking", label: "Banking", testId: "nav-link-banking" },
        { href: "/travel", label: "Travel & Cruise", testId: "nav-link-travel" },
      ];
  const account = user ? [...moduleLinks(user.module, cartCount), { href: "/account", label: "Account", testId: "nav-link-account" }] : [];

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
          {user ? <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" /> : null}
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
              <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-ink ring-1 ring-line" data-testid="nav-current-module">
                {MODULE_LABELS[user.module]}
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
