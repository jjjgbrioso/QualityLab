import Link from "next/link";
import { LogoutButton } from "@/components/forms/LogoutButton";
import { MobileNav } from "@/components/MobileNav";
import { buttonStyles } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { type AppModule, MODULE_LABELS } from "@/lib/modules";
import { cartItemCount } from "@/lib/services/cart";

const LINK_STYLE = "rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink";

type NavLink = { href: string; label: string; testId: string };

/** Shown signed out. It opens registration, not login: the navigation has no Login link by design. */
const REGISTER_LINK: NavLink = { href: "/register", label: "Create a test account", testId: "nav-link-register" };

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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:justify-start">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 text-lg font-bold tracking-tight" data-testid="nav-logo">
          <span className="flex size-8 items-center justify-center rounded-lg bg-ink" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-run-bright">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span>
            Quality<span className="font-mono text-brand-700">Lab</span>
          </span>
        </Link>

        {/* Links sit beside the logo and the session controls (or the sign-up button) sit on the right,
            so the bar has no empty stretch in the middle. */}
        <nav aria-label="Main" className="ml-6 hidden flex-1 items-center justify-between gap-4 lg:flex" data-testid="nav-main">
          <div className="flex items-center gap-1">
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
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted" data-testid="nav-user-name">
                {user.firstName}
              </span>
              <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-ink ring-1 ring-line" data-testid="nav-current-module">
                {MODULE_LABELS[user.module]}
              </span>
              <LogoutButton testId="nav-logout" />
            </div>
          ) : (
            <Link href={REGISTER_LINK.href} className={`${buttonStyles.primary} min-h-11 px-5`} data-testid={REGISTER_LINK.testId}>
              {REGISTER_LINK.label}
            </Link>
          )}
        </nav>

        <MobileNav links={user ? [...primary, ...account] : [...primary, REGISTER_LINK]} signedIn={Boolean(user)} />
      </div>
    </header>
  );
}
