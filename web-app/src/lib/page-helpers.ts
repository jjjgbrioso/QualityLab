import { notFound, redirect } from "next/navigation";
import { ZodError, type ZodType } from "zod";
import { ApiError, type ErrorDetail } from "@/lib/api/errors";
import { cleanQuery, zodDetails } from "@/lib/api/handler";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Maps service errors to the page that should show them. */
export async function loadForPage<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError && error.status === 403) redirect("/forbidden");
    throw error;
  }
}

/** Invalid URL filters show a message and fall back to the defaults, rather than crash the page. */
export function parsePageQuery<T>(
  raw: Record<string, string | string[] | undefined>,
  schema: ZodType<T>,
): { query: T; errors: ErrorDetail[] } {
  try {
    return { query: schema.parse(cleanQuery(raw)), errors: [] };
  } catch (error) {
    if (error instanceof ZodError) return { query: schema.parse({}), errors: zodDetails(error) };
    throw error;
  }
}
