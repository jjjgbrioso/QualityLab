import Link from "next/link";
import { buttonStyles, Card } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";

const MODULES = [
  {
    href: "/shop",
    id: "ecommerce",
    title: "E-commerce",
    text: "Product search, filters, cart, inventory, simulated checkout, and order cancellation.",
  },
  {
    href: "/banking",
    id: "banking",
    title: "Banking",
    text: "Online account opening, peso accounts, time deposits, deposits, withdrawals, transfers, and duplicate transaction prevention.",
  },
  {
    href: "/travel",
    id: "travel",
    title: "Travel & Cruise",
    text: "Cruise and hotel search, cabin and room availability, bookings, cancellation, and guest validation.",
  },
  {
    href: "/admin",
    id: "admin",
    title: "Admin",
    text: "Products, inventory, orders, and users. Admin accounts only.",
  },
];

const FEATURES = [
  "Stable data-testid attributes and accessible labels",
  "Predictable test accounts and deterministic seed data",
  "Seed and reset scripts for a known starting state",
  "Versioned REST API with Swagger documentation",
  "Positive and negative scenarios in every module",
  "Health-check endpoint for pipelines and monitors",
];

export default async function HomePage() {
  const signedIn = Boolean(await getSessionUser());
  return (
    <div className="space-y-10">
      <section className="py-6" data-testid="home-hero">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl" data-testid="home-title">
          A realistic target system for QA automation
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          QualityLab combines three simulated business domains behind one API, so UI, API, and performance tests
          can all run against the same application. Choose a module to sign in. Each sign-in opens one module.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/shop" className={buttonStyles.primary} data-testid="home-cta-explore">
            Explore the shop
          </Link>
          {signedIn ? (
            <Link href="/api-docs" className={buttonStyles.secondary} data-testid="home-cta-api-docs">
              View API docs
            </Link>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="mb-3 text-lg font-semibold">
          Modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => (
            <Link key={module.id} href={module.href} className="group" data-testid={`home-module-${module.id}`}>
              <Card className="h-full p-5 transition-colors group-hover:border-brand-700">
                <h3 className="font-semibold">{module.title}</h3>
                <p className="mt-1 text-sm text-muted">{module.text}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="automation-heading">
        <h2 id="automation-heading" className="mb-3 text-lg font-semibold">
          Built for automation
        </h2>
        <Card className="p-5">
          <ul className="grid gap-2 text-sm text-muted sm:grid-cols-2" data-testid="home-feature-list">
            {FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
