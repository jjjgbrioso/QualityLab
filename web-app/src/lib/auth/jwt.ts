import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { jwtExpiresInSeconds, jwtSecret } from "@/lib/env";
import { type AppModule, isAppModule } from "@/lib/modules";

const ISSUER = "qualitylab";
const AUDIENCE = "qualitylab-api";

/** `module` is the one module this token unlocks. */
export type TokenClaims = { userId: string; jti: string; expiresAt: Date; module: AppModule };

export async function signToken(userId: string, role: string, module: AppModule) {
  const expiresIn = jwtExpiresInSeconds();
  const token = await new SignJWT({ role, module })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(jwtSecret());
  return { token, expiresIn };
}

/** Returns null for any token that is malformed, expired, wrongly signed, or has no valid module. */
export async function verifyToken(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub || !payload.jti || !payload.exp || !isAppModule(payload.module)) return null;
    return { userId: payload.sub, jti: payload.jti, expiresAt: new Date(payload.exp * 1000), module: payload.module };
  } catch {
    return null;
  }
}
