import { z } from "zod";
import { isExpired, passesLuhn } from "@/lib/payment";
import { pageFields, requiredId, requiredText } from "@/lib/validation/common";

export const MAX_LINE_QUANTITY = 99;

const quantity = z
  .number({ error: "Quantity is required." })
  .int("Quantity must be a whole number.")
  .min(1, "Quantity must be at least 1.")
  .max(MAX_LINE_QUANTITY, `Quantity must be at most ${MAX_LINE_QUANTITY}.`);

export const addCartItemSchema = z.object({
  productId: requiredId("Product"),
  quantity: quantity.default(1),
});

export const updateCartItemSchema = z.object({ quantity });

export const checkoutSchema = z.object({
  shipping: z.object({
    fullName: requiredText("Full name", 100),
    address: requiredText("Address", 200),
    city: requiredText("City", 100),
    postcode: requiredText("Postcode", 20),
    country: requiredText("Country", 100),
  }),
  payment: z.object({
    cardholderName: requiredText("Cardholder name", 100),
    cardNumber: z
      .string({ error: "Card number is required." })
      .transform((value) => value.replace(/[\s-]/g, ""))
      .pipe(
        z
          .string()
          .regex(/^\d{13,19}$/, "Card number must be 13 to 19 digits.")
          .refine(passesLuhn, "Card number is not valid."),
      ),
    expiry: z
      .string({ error: "Expiry date is required." })
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must use MM/YY.")
      .refine((value) => !isExpired(value), "This card has expired."),
    cvv: z.string({ error: "CVV is required." }).regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits."),
  }),
});

export const ORDER_STATUSES = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: "Choose a supported order status." }).optional(),
  ...pageFields,
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["SHIPPED", "DELIVERED"], { error: "Status must be SHIPPED or DELIVERED." }),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
