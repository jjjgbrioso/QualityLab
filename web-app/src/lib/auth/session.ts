import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { forbidden, unauthorized } from "@/lib/api/errors";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "ql_session";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "ADMIN";
  jti: string;
  tokenExpiresAt: Date;
};

// The database is checked on every request, so logout, disabling a user, and role changes apply at once.
async function userFromToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  const claims = await verifyToken(token);
  if (!claims) return null;

  const [user, revoked] = await Promise.all([
    prisma.user.findUnique({ where: { id: claims.userId } }),
    prisma.revokedToken.findUnique({ where: { jti: claims.jti } }),
  ]);
  if (!user || user.status !== "ACTIVE" || revoked) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    jti: claims.jti,
    tokenExpiresAt: claims.expiresAt,
  };
}

function tokenFromRequest(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return req.cookies.get(SESSION_COOKIE)?.value;
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await userFromToken(tokenFromRequest(req));
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.role !== "ADMIN") throw forbidden("This action requires the ADMIN role.");
  return user;
}

export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  return userFromToken(store.get(SESSION_COOKIE)?.value);
});

export async function requirePageUser(nextPath: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requirePageAdmin(nextPath: string): Promise<AuthUser> {
  const user = await requirePageUser(nextPath);
  if (user.role !== "ADMIN") redirect("/forbidden");
  return user;
}

/** Only same-site paths are allowed, so a crafted link cannot redirect a user off the site after login. */
export function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}

export function sessionCookie(token: string, maxAge: number, secure: boolean) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}
