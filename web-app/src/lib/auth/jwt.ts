import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { jwtExpiresInSeconds, jwtSecret } from "@/lib/env";

const ISSUER = "qualitylab";
const AUDIENCE = "qualitylab-api";

export type TokenClaims = { userId: string; jti: string; expiresAt: Date };

export async function signToken(userId: string, role: string) {
  const expiresIn = jwtExpiresInSeconds();
  const token = await new SignJWT({ role })
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

/** Returns null for any token that is malformed, expired, or wrongly signed. */
export async function verifyToken(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub || !payload.jti || !payload.exp) return null;
    return { userId: payload.sub, jti: payload.jti, expiresAt: new Date(payload.exp * 1000) };
  } catch {
    return null;
  }
}
