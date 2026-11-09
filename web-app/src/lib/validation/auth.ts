import { z } from "zod";
import { APP_MODULES } from "@/lib/modules";
import { requiredText } from "@/lib/validation/common";

const emailField = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254, "Email must be at most 254 characters."));

export const passwordField = z
  .string({ error: "Password is required." })
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

// Unknown fields are dropped, so a request that sends role=ADMIN still creates a CUSTOMER.
export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: requiredText("First name", 50),
  lastName: requiredText("Last name", 50),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: "Password is required." }).min(1, "Password is required."),
  // A session unlocks one module. Signing in to another one needs a new login.
  module: z.enum(APP_MODULES, { error: "Choose a module: ecommerce, banking, travel, or admin." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
