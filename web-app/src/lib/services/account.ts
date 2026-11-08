import { notFound } from "@/lib/api/errors";
import { todayUtc } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { toUserDto } from "@/lib/services/auth";

/** Profile plus activity counts for the account page. */
export async function accountSummary(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User", "USER_NOT_FOUND");

  // "Upcoming" means confirmed and not yet started, the same rule that allows cancelling.
  const today = new Date(`${todayUtc()}T00:00:00.000Z`);
  const [orders, hotelBookings, cruiseBookings, bankAccounts, cartItems] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.booking.count({ where: { userId, status: "CONFIRMED", checkIn: { gt: today } } }),
    prisma.cruiseBooking.count({ where: { userId, status: "CONFIRMED", cabin: { sailing: { departureDate: { gt: today } } } } }),
    prisma.bankAccount.count({ where: { userId } }),
    prisma.cartItem.aggregate({ where: { userId }, _sum: { quantity: true } }),
  ]);

  return {
    user: toUserDto(user),
    counts: { orders, hotelBookings, cruiseBookings, bankAccounts, cartItems: cartItems._sum.quantity ?? 0 },
  };
}
