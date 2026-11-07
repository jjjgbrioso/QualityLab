import type { Order, OrderItem, Prisma } from "@/generated/prisma/client";
import { ApiError, forbidden, notFound } from "@/lib/api/errors";
import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { reference } from "@/lib/ids";
import { simulatePayment } from "@/lib/payment";
import { calculateTotals } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import type { CheckoutInput, OrderQuery } from "@/lib/validation/commerce";

type Actor = { id: string; role: string };
type OrderWithItems = Order & { items: OrderItem[] };

export function toOrderDto(order: OrderWithItems) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotalCents: order.subtotalCents,
    taxCents: order.taxCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    shipping: {
      fullName: order.shipFullName,
      address: order.shipAddress,
      city: order.shipCity,
      postcode: order.shipPostcode,
      country: order.shipCountry,
    },
    payment: { cardBrand: order.cardBrand, cardLast4: order.cardLast4 },
    items: order.items.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      name: item.productName,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    canCancel: order.status === "PAID",
    createdAt: order.createdAt.toISOString(),
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
  };
}

export type OrderDto = ReturnType<typeof toOrderDto>;

export async function checkout(userId: string, input: CheckoutInput) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { productId: "asc" },
  });
  if (cartItems.length === 0) throw new ApiError(409, "CART_EMPTY", "Your cart is empty.");

  // A declined card stops here, leaving the cart and stock untouched.
  const card = simulatePayment(input.payment.cardNumber);

  const subtotalCents = cartItems.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  const totals = calculateTotals(subtotalCents);

  const order = await prisma.$transaction(async (tx) => {
    // Emptying the cart first means a double submit finds nothing left to buy.
    const { count } = await tx.cartItem.deleteMany({ where: { userId } });
    if (count !== cartItems.length) throw new ApiError(409, "CART_EMPTY", "Your cart is empty.");

    for (const item of cartItems) {
      const [product] = await tx.product.updateManyAndReturn({
        where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (!product) {
        throw new ApiError(409, "INSUFFICIENT_STOCK", `${item.product.name} no longer has enough stock.`, [
          { field: item.productId, message: "Not enough stock." },
        ]);
      }
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          delta: -item.quantity,
          stockAfter: product.stock,
          reason: "CHECKOUT",
          actorId: userId,
        },
      });
    }

    return tx.order.create({
      data: {
        orderNumber: reference("ORD"),
        userId,
        ...totals,
        shipFullName: input.shipping.fullName,
        shipAddress: input.shipping.address,
        shipCity: input.shipping.city,
        shipPostcode: input.shipping.postcode,
        shipCountry: input.shipping.country,
        cardBrand: card.brand,
        cardLast4: card.last4,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            unitPriceCents: item.product.priceCents,
            quantity: item.quantity,
            lineTotalCents: item.product.priceCents * item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  });

  return toOrderDto(order);
}

export async function listOrders(query: OrderQuery, userId?: string) {
  const where: Prisma.OrderWhereInput = {
    ...(userId ? { userId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: pageSkip(query.page, query.pageSize),
      take: query.pageSize,
    }),
    prisma.order.count({ where }),
  ]);
  return { items: orders.map(toOrderDto), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function getOrder(actor: Actor, id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw notFound("Order", "ORDER_NOT_FOUND");
  if (order.userId !== actor.id && actor.role !== "ADMIN") throw forbidden("This order belongs to another user.");
  return toOrderDto(order);
}

export async function cancelOrder(actor: Actor, id: string) {
  const order = await getOrder(actor, id);

  const updated = await prisma.$transaction(async (tx) => {
    // The status check is part of the update, so two cancels cannot both restock.
    const { count } = await tx.order.updateMany({
      where: { id, status: "PAID" },
      data: { status: "CANCELLED", paymentStatus: "REFUNDED", cancelledAt: new Date() },
    });
    if (count === 0) {
      throw new ApiError(409, "ORDER_NOT_CANCELLABLE", "Only orders that have not shipped can be cancelled.");
    }

    const items = [...order.items].sort((a, b) => a.productId.localeCompare(b.productId));
    for (const item of items) {
      const product = await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          delta: item.quantity,
          stockAfter: product.stock,
          reason: "CANCELLATION",
          actorId: actor.id,
        },
      });
    }

    return tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
  });

  return toOrderDto(updated);
}

const NEXT_STATUS: Record<string, string | undefined> = { PAID: "SHIPPED", SHIPPED: "DELIVERED" };

export async function updateOrderStatus(id: string, status: "SHIPPED" | "DELIVERED") {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound("Order", "ORDER_NOT_FOUND");
  if (NEXT_STATUS[order.status] !== status) {
    throw new ApiError(409, "INVALID_STATUS_TRANSITION", `An order cannot move from ${order.status} to ${status}.`);
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true },
  });
  return toOrderDto(updated);
}
