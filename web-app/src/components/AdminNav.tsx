import Link from "next/link";
import { buttonStyles } from "@/components/ui";

const LINKS = [
  { href: "/admin", label: "Dashboard", testId: "admin-nav-dashboard" },
  { href: "/admin/products", label: "Products", testId: "admin-nav-products" },
  { href: "/admin/orders", label: "Orders", testId: "admin-nav-orders" },
  { href: "/admin/users", label: "Users", testId: "admin-nav-users" },
];

export function AdminNav() {
  return (
    <nav aria-label="Admin" className="mb-6 flex flex-wrap gap-2" data-testid="admin-nav">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={buttonStyles.secondary} data-testid={link.testId}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
