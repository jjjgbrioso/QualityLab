import { pageMeta, pageSkip } from "@/lib/api/pagination";
import { prisma } from "@/lib/prisma";
import { toUserDto } from "@/lib/services/auth";
import { toOrderDto } from "@/lib/services/orders";
import { toProductDto } from "@/lib/services/products";

export const LOW_STOCK_THRESHOLD = 5;

export async function adminStats() {
  const [users, products, orders, bookings, cruiseBookings, bankAccounts, revenue, lowStock, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.cruiseBooking.count({ where: { status: "CONFIRMED" } }),
    prisma.bankAccount.count(),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { totalCents: true } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: [{ stock: "asc" }, { name: "asc" }],
    }),
    prisma.order.findMany({
      include: { items: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 5,
    }),
  ]);

  return {
    counts: { users, products, orders, confirmedBookings: bookings, confirmedCruiseBookings: cruiseBookings, bankAccounts },
    revenueCents: revenue._sum.totalCents ?? 0,
    lowStockProducts: lowStock.map(toProductDto),
    recentOrders: recentOrders.map(toOrderDto),
  };
}

export async function listUsers(query: { page: number; pageSize: number }) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ email: "asc" }],
      skip: pageSkip(query.page, query.pageSize),
      take: query.pageSize,
    }),
    prisma.user.count(),
  ]);
  return { items: users.map(toUserDto), meta: pageMeta(query.page, query.pageSize, total) };
}
