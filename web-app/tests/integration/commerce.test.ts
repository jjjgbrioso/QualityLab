import { expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { addCartItem, getCart, removeCartItem, updateCartItem } from "@/lib/services/cart";
import { cancelOrder, checkout, getOrder, updateOrderStatus } from "@/lib/services/orders";
import {
  adjustInventory,
  createProduct,
  deactivateProduct,
  getProduct,
  listProducts,
} from "@/lib/services/products";
import { productQuerySchema } from "@/lib/validation/products";
import { admin, alice, bob, describeWithDatabase, failure, stock } from "../helpers";

const HEADPHONES = "prod_0001"; // $129.99, stock 25
const LAST_ONE = "prod_0010"; // stock 1
const SOLD_OUT = "prod_0006"; // stock 0
const HIDDEN = "prod_0030"; // inactive

const order = (cardNumber = "4242424242424242") => ({
  shipping: { fullName: "Alice", address: "1 Test St", city: "Sampletown", postcode: "00000", country: "US" },
  payment: { cardholderName: "Alice", cardNumber, expiry: "12/30", cvv: "123" },
});

const query = (input: Record<string, string> = {}) => productQuerySchema.parse(input);

describeWithDatabase("products", () => {
  it("returns a stable, paginated baseline", async () => {
    const { items, meta } = await listProducts(query({ pageSize: "5" }));
    expect(items).toHaveLength(5);
    expect(meta).toMatchObject({ totalItems: 29, totalPages: 6, hasNext: true, hasPrevious: false });
    expect(items[0].name).toBe("Aurora Wireless Headphones");
  });

  it("searches, filters, and sorts", async () => {
    expect((await listProducts(query({ q: "keyboard" }))).items.map((item) => item.id)).toEqual(["prod_0003"]);

    const books = await listProducts(query({ category: "Books", sort: "price_asc" }));
    expect(books.meta.totalItems).toBe(5);
    expect(books.items[0].priceCents).toBe(1999);

    const priced = await listProducts(query({ minPrice: "20", maxPrice: "25" }));
    expect(priced.items.every((item) => item.priceCents >= 2000 && item.priceCents <= 2500)).toBe(true);

    const outOfStock = await listProducts(query({ inStock: "false" }));
    expect(outOfStock.items.map((item) => item.id).sort()).toEqual(["prod_0006", "prod_0021"]);
  });

  it("hides inactive products from customers", async () => {
    expect(await failure(getProduct(HIDDEN))).toMatchObject({ status: 404, code: "PRODUCT_NOT_FOUND" });
  });
});

describeWithDatabase("cart", () => {
  it("adds, merges, updates, and removes lines", async () => {
    await addCartItem(alice.id, { productId: HEADPHONES, quantity: 1 });
    const merged = await addCartItem(alice.id, { productId: HEADPHONES, quantity: 2 });
    expect(merged.items[0].quantity).toBe(3);
    expect(merged.subtotalCents).toBe(38_997);

    expect((await updateCartItem(alice.id, HEADPHONES, 1)).itemCount).toBe(1);
    expect((await removeCartItem(alice.id, HEADPHONES)).items).toHaveLength(0);
  });

  it("will not hold more than the available stock", async () => {
    const error = await failure(addCartItem(alice.id, { productId: LAST_ONE, quantity: 2 }));
    expect(error).toMatchObject({ status: 409, code: "INSUFFICIENT_STOCK" });
    expect(await failure(addCartItem(alice.id, { productId: SOLD_OUT, quantity: 1 }))).toMatchObject({ status: 409 });
  });

  it("rejects an unknown or inactive product", async () => {
    expect(await failure(addCartItem(alice.id, { productId: "nope", quantity: 1 }))).toMatchObject({ status: 404 });
    expect(await failure(addCartItem(alice.id, { productId: HIDDEN, quantity: 1 }))).toMatchObject({ status: 404 });
  });
});

describeWithDatabase("checkout and orders", () => {
  it("places an order, reduces stock, empties the cart, and hides the card number", async () => {
    await addCartItem(alice.id, { productId: HEADPHONES, quantity: 2 });
    const placed = await checkout(alice.id, order());

    expect(placed).toMatchObject({ status: "PAID", subtotalCents: 25_998, taxCents: 2_080, shippingCents: 0, totalCents: 28_078 });
    expect(placed.payment).toEqual({ cardBrand: "Visa", cardLast4: "4242" });
    expect(await stock(HEADPHONES)).toBe(23);
    expect((await getCart(alice.id)).items).toHaveLength(0);
    expect(JSON.stringify(placed)).not.toContain("4242424242424242");

    const movement = await prisma.inventoryMovement.findFirstOrThrow({ where: { productId: HEADPHONES } });
    expect(movement).toMatchObject({ delta: -2, stockAfter: 23, reason: "CHECKOUT" });
  });

  it("keeps the cart and stock when the card is declined", async () => {
    await addCartItem(alice.id, { productId: HEADPHONES, quantity: 1 });
    const error = await failure(checkout(alice.id, order("4000000000000002")));

    expect(error).toMatchObject({ status: 402, code: "PAYMENT_DECLINED" });
    expect(await stock(HEADPHONES)).toBe(25);
    expect((await getCart(alice.id)).items).toHaveLength(1);
  });

  it("rejects checkout with an empty cart", async () => {
    expect(await failure(checkout(alice.id, order()))).toMatchObject({ status: 409, code: "CART_EMPTY" });
  });

  it("creates one order when checkout is double-submitted", async () => {
    await addCartItem(alice.id, { productId: HEADPHONES, quantity: 1 });
    const results = await Promise.allSettled([checkout(alice.id, order()), checkout(alice.id, order())]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await stock(HEADPHONES)).toBe(24);
  });

  it("sells the last unit to only one of two buyers", async () => {
    await addCartItem(alice.id, { productId: LAST_ONE, quantity: 1 });
    await addCartItem(bob.id, { productId: LAST_ONE, quantity: 1 });

    const results = await Promise.allSettled([checkout(alice.id, order()), checkout(bob.id, order())]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await stock(LAST_ONE)).toBe(0);
  });

  it("cancels an unshipped order, refunds it, and restocks once", async () => {
    await cancelOrder(alice, "order_0001");
    const cancelled = await getOrder(alice, "order_0001");

    expect(cancelled).toMatchObject({ status: "CANCELLED", paymentStatus: "REFUNDED", canCancel: false });
    expect(await stock(HEADPHONES)).toBe(26);
    expect(await failure(cancelOrder(alice, "order_0001"))).toMatchObject({ status: 409, code: "ORDER_NOT_CANCELLABLE" });
    expect(await stock(HEADPHONES)).toBe(26);
  });

  it("does not cancel a shipped order", async () => {
    expect(await failure(cancelOrder(alice, "order_0002"))).toMatchObject({ status: 409, code: "ORDER_NOT_CANCELLABLE" });
  });

  it("keeps orders private to their owner, except for admins", async () => {
    expect(await failure(getOrder(bob, "order_0001"))).toMatchObject({ status: 403 });
    expect(await failure(cancelOrder(bob, "order_0001"))).toMatchObject({ status: 403 });
    await expect(getOrder(admin, "order_0001")).resolves.toMatchObject({ id: "order_0001" });
  });

  it("moves an order forward only", async () => {
    await expect(updateOrderStatus("order_0001", "SHIPPED")).resolves.toMatchObject({ status: "SHIPPED" });
    expect(await failure(updateOrderStatus("order_0001", "SHIPPED"))).toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
    expect(await failure(updateOrderStatus("order_0005", "DELIVERED"))).toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });
});

describeWithDatabase("admin product management", () => {
  const input = {
    sku: "TEST-0001",
    name: "New Product",
    description: "Created by a test",
    category: "Office",
    brand: "Marginal",
    priceCents: 1000,
    stock: 5,
    isActive: true,
  };

  it("creates a product and rejects a duplicate SKU", async () => {
    await expect(createProduct(input)).resolves.toMatchObject({ sku: "TEST-0001" });
    expect(await failure(createProduct(input))).toMatchObject({ status: 409, code: "SKU_ALREADY_EXISTS" });
  });

  it("adjusts stock, records it, and refuses negative stock", async () => {
    await expect(adjustInventory(admin.id, HEADPHONES, -5, "Damaged")).resolves.toMatchObject({ stock: 20 });
    const movement = await prisma.inventoryMovement.findFirstOrThrow({ where: { reason: "ADMIN_ADJUSTMENT" } });
    expect(movement).toMatchObject({ delta: -5, stockAfter: 20, note: "Damaged", actorId: admin.id });

    expect(await failure(adjustInventory(admin.id, HEADPHONES, -21))).toMatchObject({ status: 422, code: "INVALID_STOCK_ADJUSTMENT" });
    expect(await failure(adjustInventory(admin.id, "nope", 1))).toMatchObject({ status: 404 });
  });

  it("deactivates a product but keeps it for order history", async () => {
    await deactivateProduct(HEADPHONES);
    expect(await failure(getProduct(HEADPHONES))).toMatchObject({ status: 404 });
    await expect(getOrder(alice, "order_0001")).resolves.toMatchObject({ items: [{ name: "Aurora Wireless Headphones" }] });
  });
});
