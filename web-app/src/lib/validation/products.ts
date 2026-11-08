import { z } from "zod";
import { pageFields, requiredText } from "@/lib/validation/common";

export const PRODUCT_SORTS = ["name_asc", "name_desc", "price_asc", "price_desc", "rating_desc", "newest"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const price = (label: string) =>
  z.coerce.number({ error: `${label} must be a number.` }).min(0, `${label} cannot be negative.`).optional();

export const productQuerySchema = z
  .object({
    q: z.string().trim().max(100, "Search text must be at most 100 characters.").optional(),
    category: z.string().trim().max(50).optional(),
    minPrice: price("Minimum price"),
    maxPrice: price("Maximum price"),
    inStock: z
      .enum(["true", "false"], { error: "In stock must be true or false." })
      .transform((value) => value === "true")
      .optional(),
    onSale: z
      .enum(["true", "false"], { error: "On sale must be true or false." })
      .transform((value) => value === "true")
      .optional(),
    sort: z.enum(PRODUCT_SORTS, { error: "Choose a supported sort order." }).default("name_asc"),
    ...pageFields,
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    path: ["maxPrice"],
    message: "Maximum price must not be below the minimum price.",
  });

const productFields = {
  sku: z
    .string({ error: "SKU is required." })
    .trim()
    .regex(/^[A-Z0-9-]{3,32}$/, "SKU must be 3 to 32 capital letters, digits, or hyphens."),
  name: requiredText("Name", 120),
  description: requiredText("Description", 2000),
  category: requiredText("Category", 50),
  brand: requiredText("Brand", 50),
  priceCents: z
    .number({ error: "Price is required." })
    .int("Price must be a whole number of cents.")
    .positive("Price must be greater than zero.")
    .max(10_000_000, "Price must be at most $100,000.00."),
  // Null removes a sale. It must be higher than the price, which the service checks.
  listPriceCents: z
    .number({ error: "Original price must be a number of cents." })
    .int("Original price must be a whole number of cents.")
    .positive("Original price must be greater than zero.")
    .max(10_000_000, "Original price must be at most $100,000.00.")
    .nullable(),
  stock: z
    .number({ error: "Stock is required." })
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(100_000, "Stock must be at most 100,000."),
  // A path under public/, such as /images/products/prod_0001.jpg, or an https address.
  // Null removes the photo, and the store shows its illustrated placeholder instead.
  imageUrl: z
    .string({ error: "Image URL must be text." })
    .trim()
    .max(500, "Image URL must be at most 500 characters.")
    .regex(/^(\/(?!\/)\S*|https:\/\/\S+)$/, "Image URL must be a path starting with / or an https:// address.")
    .nullable(),
};

export const productCreateSchema = z.object({
  ...productFields,
  listPriceCents: productFields.listPriceCents.optional(),
  imageUrl: productFields.imageUrl.optional(),
  isActive: z.boolean().default(true),
});

// Built without defaults so a partial update cannot reset a field the caller left out.
export const productUpdateSchema = z
  .object({ ...productFields, isActive: z.boolean() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update." });

export const inventoryAdjustSchema = z.object({
  delta: z
    .number({ error: "Quantity change is required." })
    .int("Quantity change must be a whole number.")
    .refine((value) => value !== 0, "Quantity change cannot be zero."),
  note: z.string().trim().max(200, "Note must be at most 200 characters.").optional(),
});

export const adminProductQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  ...pageFields,
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
