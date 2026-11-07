import { z } from "zod";

export const MAX_PAGE_SIZE = 100;

export const pageFields = {
  page: z.coerce
    .number({ error: "Page must be a number." })
    .int("Page must be a whole number.")
    .min(1, "Page must be at least 1.")
    .default(1),
  pageSize: z.coerce
    .number({ error: "Page size must be a number." })
    .int("Page size must be a whole number.")
    .min(1, "Page size must be at least 1.")
    .max(MAX_PAGE_SIZE, `Page size must be at most ${MAX_PAGE_SIZE}.`)
    .default(12),
};

export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

export const requiredId = (label: string) =>
  z.string({ error: `${label} is required.` }).trim().min(1, `${label} is required.`);
