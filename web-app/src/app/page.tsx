import Link from "next/link";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/session";

/** Lucide-style stroke icons. Decorative, so hidden from assistive technology. */
function Icon({ children, className = "size-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
);

const MODULES = [
  {
    href: "/shop",
    id: "ecommerce",
    title: "E-commerce",
    text: "Product search, filters, cart, inventory, simulated checkout, and order cancellation.",
    tags: ["search", "cart", "checkout"],
    icon: (
      <>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </>
    ),
  },
  {
    href: "/banking",
    id: "banking",
    title: "Banking",
    text: "Online account opening, peso accounts, time deposits, deposits, withdrawals, transfers, and duplicate transaction prevention.",
    tags: ["transfers", "deposits", "loans"],
    icon: (
      <>
        <line x1="3" x2="21" y1="22" y2="22" />
        <line x1="6" x2="6" y1="18" y2="11" />
        <line x1="10" x2="10" y1="18" y2="11" />
        <line x1="14" x2="14" y1="18" y2="11" />
        <line x1="18" x2="18" y1="18" y2="11" />
        <polygon points="12 2 20 7 4 7" />
      </>
    ),
  },
  {
    href: "/travel",
    id: "travel",
    title: "Travel & Cruise",
    text: "Cruise and hotel search, cabin and room availability, bookings, cancellation, and guest validation.",
    tags: ["availability", "booking", "guests"],
    icon: (
      <>
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
        <path d="M12 10v4" />
        <path d="M12 2v3" />
      </>
    ),
  },
  {
    href: "/admin",
    id: "admin",
    title: "Admin",
    text: "Products, inventory, orders, and users. Admin accounts only.",
    tags: ["inventory", "users", "403 paths"],
    icon: (
      <>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-.94c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
];

const FEATURES = [
  {
    title: "Stable data-testid attributes and accessible labels",
    example: 'data-testid="login-title"',
    icon: (
      <>
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
      </>
    ),
  },
  {
    title: "Predictable test accounts and deterministic seed data",
    example: "npm run db:seed",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: "Seed and reset scripts for a known starting state",
    example: "npm run db:reset",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
  },
  {
    title: "Versioned REST API with Swagger documentation",
    example: "/api/v1 · /api-docs",
    icon: (
      <>
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
      </>
    ),
  },
  {
    title: "Positive and negative scenarios in every module",
    example: "400 · 403 · 409",
    icon: (
      <>
        <path d="m3 17 2 2 4-4" />
        <path d="m3 7 2 2 4-4" />
        <path d="M13 6h8" />
        <path d="M13 12h8" />
        <path d="M13 18h8" />
      </>
    ),
  },
  {
    title: "Health-check endpoint for pipelines and monitors",
    example: "GET /api/v1/health",
    icon: (
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    ),
  },
];

const SUITES = [
  { folder: "selenium-java/", title: "Selenium", text: "Java 21 with Cucumber and TestNG, using BDD feature files for the UI flows." },
  { folder: "playwright-typescript/", title: "Playwright", text: "TypeScript end-to-end tests on Chromium, Firefox, and WebKit." },
  { folder: "api-testing/", title: "Postman + Newman", text: "REST API collections with data-driven runs from the command line." },
  { folder: "jmeter/", title: "Apache JMeter", text: "Baseline, load, stress, spike, and endurance runs against the REST API." },
];

const FACTS = [
  { value: "4", label: "Business modules" },
  { value: "179", label: "Documented manual test cases" },
  { value: "4", label: "Automation suites" },
  { value: "v1", label: "Versioned REST API" },
];

const EYEBROW = "font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-brand-700";
const SECTION_TITLE = "text-3xl font-bold tracking-tight sm:text-4xl";
const FOCUS_DARK = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const PRIMARY_DARK = `inline-flex min-h-12 items-center gap-2 rounded-lg bg-run px-5 font-semibold text-ink transition-colors hover:bg-run-bright ${FOCUS_DARK}`;
const OUTLINE_DARK = `inline-flex min-h-12 items-center rounded-lg border border-slate-600 px-5 font-semibold text-white transition-colors hover:bg-slate-800 ${FOCUS_DARK}`;

export default async function HomePage() {
  const user = await getSessionUser();
  const signedIn = Boolean(user);

  return (
    <div className="-mt-8">
      {/* Hero */}
      <section className="full-bleed bg-ink text-slate-50 [--bleed:var(--color-ink)]" data-testid="home-hero">
        <div className="flex flex-wrap items-center gap-12 py-16 lg:py-24">
          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-6">
            <p className="inline-flex items-center gap-2 self-start rounded-full border border-slate-700 px-3 py-1.5 font-mono text-[13px] text-slate-300">
              <span aria-hidden="true" className="size-2 rounded-full bg-run-bright" />
              Health check · GET /api/v1/health
            </p>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]" data-testid="home-title">
              A realistic target system for QA automation
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-300">
              QualityLab combines three simulated business domains behind one API, so UI, API, and performance tests can all run
              against the same application. Choose a module to sign in. Each sign-in opens one module.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="#modules" className={PRIMARY_DARK} data-testid="home-cta-explore">
                Explore the modules
                <ArrowRight className="size-[18px]" />
              </Link>
              {signedIn ? (
                <Link href="/api-docs" className={OUTLINE_DARK} data-testid="home-cta-api-docs">
                  View API docs
                </Link>
              ) : (
                <Link href="/register" className={OUTLINE_DARK} data-testid="home-cta-register">
                  Create a test account
                </Link>
              )}
            </div>
          </div>

          <figure className="m-0 min-w-0 flex-[1_1_480px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-slate-700" />
                <span className="size-2.5 rounded-full bg-slate-700" />
                <span className="size-2.5 rounded-full bg-slate-700" />
              </span>
              <figcaption className="font-mono text-[13px] text-slate-400">example: cart.spec.ts</figcaption>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-slate-200 [font-variant-ligatures:none]">
              <code>
                <span className="text-blue-300">test</span>(<span className="text-green-300">&apos;adds a product to the cart&apos;</span>,{" "}
                <span className="text-blue-300">async</span> ({"{"} page {"}"}) =&gt; {"{"}
                {"\n  "}
                <span className="text-blue-300">await</span> page.goto(<span className="text-green-300">&apos;/shop&apos;</span>);
                {"\n  "}
                <span className="text-blue-300">await</span> page.getByTestId(<span className="text-green-300">/^product-card-/</span>).first().click();
                {"\n  "}
                <span className="text-blue-300">await</span> page.getByTestId(<span className="text-green-300">&apos;add-to-cart-button&apos;</span>).click();
                {"\n  "}
                <span className="text-blue-300">await</span> expect(page.getByTestId(<span className="text-green-300">&apos;nav-link-cart&apos;</span>))
                {"\n    "}.toContainText(<span className="text-green-300">&apos;Cart (1)&apos;</span>);
                {"\n"}
                {"});"}
              </code>
            </pre>
          </figure>
        </div>
      </section>

      {/* Facts */}
      <section aria-label="At a glance" className="full-bleed bg-surface [--bleed:var(--color-surface)]">
        <dl className="grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-muted">{fact.label}</dt>
              <dd className="font-mono text-3xl font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Modules */}
      <section id="modules" aria-labelledby="modules-heading" className="scroll-mt-4 pb-12 pt-16 sm:pt-24">
        <div className="mb-10 flex max-w-2xl flex-col gap-3">
          <p className={EYEBROW}>Modules</p>
          <h2 id="modules-heading" className={SECTION_TITLE}>
            Pick a domain to test
          </h2>
          <p className="text-lg text-muted">Each module has its own sign-in and its own positive, negative, and edge-case scenarios.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => {
            const admin = module.id === "admin";
            const action = user?.module === module.id ? `Open ${module.title}` : `Sign in to ${module.title}`;
            return (
              <Link
                key={module.id}
                href={module.href}
                className="group flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-200 hover:border-slate-400 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
                data-testid={`home-module-${module.id}`}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-lg ${admin ? "bg-slate-100 text-slate-700" : "bg-brand-50 text-brand-700"}`}
                >
                  <Icon className="size-[22px]">{module.icon}</Icon>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold">{module.title}</h3>
                  {admin ? (
                    <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] font-semibold text-white">ROLE: ADMIN</span>
                  ) : null}
                </div>
                <p className="text-[15px] text-muted">{module.text}</p>
                <ul aria-label="Test areas" className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {module.tags.map((tag) => (
                    <li key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                      {tag}
                    </li>
                  ))}
                </ul>
                <span className={`mt-auto inline-flex min-h-11 items-center gap-1.5 font-semibold ${admin ? "text-ink" : "text-brand-700"}`}>
                  {action}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Built for automation */}
      <section aria-labelledby="automation-heading" className="pb-16 pt-12 sm:pb-24">
        <div className="mb-10 flex max-w-2xl flex-col gap-3">
          <p className={EYEBROW}>Built for automation</p>
          <h2 id="automation-heading" className={SECTION_TITLE}>
            Stable, predictable, resettable
          </h2>
        </div>
        <ul
          className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3"
          data-testid="home-feature-list"
        >
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex flex-col gap-3 bg-surface p-7">
              <Icon className="size-[22px] text-ink">{feature.icon}</Icon>
              <p className="font-semibold">{feature.title}</p>
              <code className="self-start rounded-md bg-slate-100 px-2 py-1 font-mono text-[13px] text-ink">{feature.example}</code>
            </li>
          ))}
        </ul>
      </section>

      {/* Test suites */}
      <section aria-labelledby="suites-heading" className="full-bleed bg-surface [--bleed:var(--color-surface)]">
        <div className="py-16 sm:py-24">
          <div className="mb-10 flex max-w-2xl flex-col gap-3">
            <p className={EYEBROW}>Test suites</p>
            <h2 id="suites-heading" className={SECTION_TITLE}>
              Four suites, one system under test
            </h2>
            <p className="text-lg text-muted">The suites share the same seeded customer and balances, so run one suite at a time.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SUITES.map((suite) => (
              <article key={suite.title} className="flex flex-col gap-3 rounded-xl border border-line p-6">
                <p className="font-mono text-[13px] text-muted">{suite.folder}</p>
                <h3 className="text-xl font-semibold">{suite.title}</h3>
                <p className="text-[15px] text-muted">{suite.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="cta-heading" className="py-16 sm:py-24">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-ink p-8 text-slate-50 sm:p-12">
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-2">
            <h2 id="cta-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Point your tests at QualityLab
            </h2>
            <p className="text-lg text-slate-300">Create a test account, or use a seeded one from the documentation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className={PRIMARY_DARK}>
              Create a test account
            </Link>
            {signedIn ? (
              <Link href="/api-docs" className={OUTLINE_DARK}>
                API docs
              </Link>
            ) : (
              <Link href="#modules" className={OUTLINE_DARK}>
                Choose a module
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
