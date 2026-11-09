import { describe, expect, it } from "vitest";
import { isAppModule, moduleForApi, moduleForPage } from "@/lib/modules";
import { loginSchema } from "@/lib/validation/auth";

describe("module paths", () => {
  it("maps each page to the module that owns it", () => {
    expect(moduleForPage("/shop?q=lamp")).toBe("ecommerce");
    expect(moduleForPage("/cart")).toBe("ecommerce");
    expect(moduleForPage("/checkout")).toBe("ecommerce");
    expect(moduleForPage("/orders/order_0001")).toBe("ecommerce");
    expect(moduleForPage("/banking/transfer")).toBe("banking");
    expect(moduleForPage("/travel/cruises/sailing_0001")).toBe("travel");
    expect(moduleForPage("/bookings?type=cruises")).toBe("travel");
    expect(moduleForPage("/admin/products")).toBe("admin");
  });

  it("leaves shared and public pages open to any module", () => {
    for (const path of ["/", "/account", "/api-docs", "/login", "/register", "/shopping", "/travelling"]) {
      expect(moduleForPage(path), path).toBeNull();
    }
  });

  it("maps signed-in API endpoints to their module", () => {
    expect(moduleForApi("/api/v1/cart/items")).toBe("ecommerce");
    expect(moduleForApi("/api/v1/orders/order_0001/cancel")).toBe("ecommerce");
    expect(moduleForApi("/api/v1/bank/transfers")).toBe("banking");
    expect(moduleForApi("/api/v1/bookings")).toBe("travel");
    expect(moduleForApi("/api/v1/cruise-bookings/cruise_booking_0001")).toBe("travel");
    expect(moduleForApi("/api/v1/admin/stats")).toBe("admin");
    expect(moduleForApi("/api/v1/auth/me")).toBeNull();
    expect(moduleForApi("/api/v1/products")).toBeNull();
  });

  it("knows the four modules", () => {
    expect(["ecommerce", "banking", "travel", "admin"].every(isAppModule)).toBe(true);
    expect(isAppModule("shop")).toBe(false);
  });
});

describe("login validation", () => {
  const credentials = { email: "alice@qualitylab.test", password: "Customer@123" };

  it("requires a known module", () => {
    expect(loginSchema.parse({ ...credentials, module: "travel" }).module).toBe("travel");
    expect(loginSchema.safeParse(credentials).success).toBe(false);
    expect(loginSchema.safeParse({ ...credentials, module: "shop" }).success).toBe(false);
  });
});
