import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError, type ErrorDetail } from "@/lib/api/errors";
import type { PageMeta } from "@/lib/api/pagination";

type RouteArgs<P> = { req: NextRequest; params: P; requestId: string };

/** Drops blank values so an empty filter box behaves the same as an absent filter. */
export function cleanQuery(input: Record<string, string | string[] | undefined>) {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single !== undefined && single.trim() !== "") output[key] = single;
  }
  return output;
}

export function parseQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  return schema.parse(cleanQuery(Object.fromEntries(req.nextUrl.searchParams)));
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }
  return schema.parse(body);
}

export const ok = <T>(data: T, status = 200) => NextResponse.json({ data }, { status });
export const okPage = <T>(data: T[], meta: PageMeta) => NextResponse.json({ data, meta });

export function zodDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({ field: issue.path.join(".") || undefined, message: issue.message }));
}

function errorResponse(error: unknown, requestId: string): Response {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong on the server.";
  let details: ErrorDetail[] | undefined;

  if (error instanceof ApiError) {
    ({ status, code, message, details } = error);
  } else if (error instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "The request failed validation.";
    details = zodDetails(error);
  } else {
    console.error(`[${requestId}]`, error);
  }

  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}), requestId } },
    { status, headers: { "x-request-id": requestId } },
  );
}

/** Wraps a route handler so every response has a request id and the standard error shape. */
export function route<P = Record<string, never>>(handler: (args: RouteArgs<P>) => Promise<Response>) {
  return async (req: NextRequest, context: { params: Promise<P> }): Promise<Response> => {
    const requestId = randomUUID();
    try {
      const response = await handler({ req, params: await context.params, requestId });
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      return errorResponse(error, requestId);
    }
  };
}
