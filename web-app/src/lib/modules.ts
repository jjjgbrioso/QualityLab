/**
 * A sign-in unlocks one module. Its pages and API endpoints are listed here by path, so the
 * session check can tell which module a request belongs to. Paths not listed, such as /account,
 * the API docs, and the public catalogue endpoints, work in any module or without signing in.
 */
export const APP_MODULES = ["ecommerce", "banking", "travel", "admin"] as const;
export type AppModule = (typeof APP_MODULES)[number];

export const MODULE_LABELS: Record<AppModule, string> = {
  ecommerce: "E-commerce",
  banking: "Banking",
  travel: "Travel & Cruise",
  admin: "Admin",
};

/** Where each module starts after signing in. */
export const MODULE_HOME: Record<AppModule, string> = {
  ecommerce: "/shop",
  banking: "/banking",
  travel: "/travel",
  admin: "/admin",
};

const PAGE_PATHS: [string, AppModule][] = [
  ["/shop", "ecommerce"],
  ["/cart", "ecommerce"],
  ["/checkout", "ecommerce"],
  ["/orders", "ecommerce"],
  ["/banking", "banking"],
  ["/travel", "travel"],
  ["/bookings", "travel"],
  ["/admin", "admin"],
];

const API_PATHS: [string, AppModule][] = [
  ["/api/v1/cart", "ecommerce"],
  ["/api/v1/orders", "ecommerce"],
  ["/api/v1/bank", "banking"],
  ["/api/v1/bookings", "travel"],
  ["/api/v1/cruise-bookings", "travel"],
  ["/api/v1/admin", "admin"],
];

function moduleFor(path: string, table: [string, AppModule][]): AppModule | null {
  const pathname = path.split(/[?#]/)[0];
  const match = table.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : null;
}

/** The module a page belongs to, or null for pages any signed-in module can open. */
export const moduleForPage = (path: string) => moduleFor(path, PAGE_PATHS);

/** The module an API endpoint belongs to, or null for endpoints any token can call. */
export const moduleForApi = (path: string) => moduleFor(path, API_PATHS);

export function isAppModule(value: unknown): value is AppModule {
  return typeof value === "string" && (APP_MODULES as readonly string[]).includes(value);
}
