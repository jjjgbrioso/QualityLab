import { ApiError } from "@/lib/api/errors";
import { ok, route } from "@/lib/api/handler";
import { appEnv, jwtSecret } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const GET = route(async () => {
  try {
    jwtSecret();
  } catch {
    // A missing secret breaks every login, so it must fail the health check rather than hide.
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "JWT_SECRET is missing or too short.");
  }

  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health check could not reach the database:", error);
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "The database is not reachable.");
  }

  return ok({
    status: "ok",
    service: "qualitylab-web-app",
    version: "v1",
    environment: appEnv(),
    database: { status: "up", latencyMs: Date.now() - started },
    timestamp: new Date().toISOString(),
  });
});
