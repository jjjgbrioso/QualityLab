import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/errors";
import { zodDetails } from "@/lib/api/handler";
import { idempotencyKeySchema } from "@/lib/validation/bank";

export function requireIdempotencyKey(req: NextRequest): string {
  try {
    return idempotencyKeySchema.parse(req.headers.get("idempotency-key") ?? undefined);
  } catch (error) {
    if (error instanceof ZodError) {
      const [detail] = zodDetails(error);
      throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", detail.message, [
        { field: "Idempotency-Key", message: detail.message },
      ]);
    }
    throw error;
  }
}

/** A repeat returns the original 201 and marks itself, so a client can tell nothing ran twice. */
export function idempotentResponse<T>({ data, replayed }: { data: T; replayed: boolean }) {
  return NextResponse.json({ data }, { status: 201, headers: { "Idempotent-Replayed": String(replayed) } });
}
