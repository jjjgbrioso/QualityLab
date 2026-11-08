import { notFound, redirect } from "next/navigation";
import { ZodError, type ZodType } from "zod";
import { ApiError, type ErrorDetail } from "@/lib/api/errors";
import { cleanQuery, zodDetails } from "@/lib/api/handler";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Rebuilds the current URL, so a login redirect returns to the same filtered view. */
export function pathWithQuery(path: string, raw: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

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
