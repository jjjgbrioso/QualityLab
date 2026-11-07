function nonNegativeInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value !== undefined && Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export const jwtExpiresInSeconds = () => nonNegativeInt(process.env.JWT_EXPIRES_IN_SECONDS, 7200);
export const duplicateWindowSeconds = () => nonNegativeInt(process.env.DUPLICATE_WINDOW_SECONDS, 30);
export const appEnv = () => process.env.APP_ENV ?? "local";
