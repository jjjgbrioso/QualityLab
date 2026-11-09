import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { forbidden, moduleNotAllowed, unauthorized } from "@/lib/api/errors";
import { verifyToken } from "@/lib/auth/jwt";
import { type AppModule, MODULE_LABELS, moduleForApi, moduleForPage } from "@/lib/modules";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "ql_session";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "ADMIN";
  /** The one module this session can use. */
  module: AppModule;
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
    module: claims.module,
    jti: claims.jti,
    tokenExpiresAt: claims.expiresAt,
  };
}

function tokenFromRequest(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return req.cookies.get(SESSION_COOKIE)?.value;
}

/** Also checks that the endpoint belongs to the module the token was issued for. */
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await userFromToken(tokenFromRequest(req));
  if (!user) throw unauthorized();
  const needed = moduleForApi(req.nextUrl.pathname);
  if (needed && user.module !== needed) throw moduleNotAllowed(MODULE_LABELS[user.module], MODULE_LABELS[needed]);
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

/**
 * Sends a visitor to the login page unless they are signed in to the module that owns `nextPath`.
 * Signing in there replaces the current session, so the previous module locks.
 */
export async function requirePageUser(nextPath: string): Promise<AuthUser> {
  const user = await getSessionUser();
  const needed = moduleForPage(nextPath);
  if (!user || (needed && user.module !== needed)) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
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
