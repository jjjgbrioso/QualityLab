import { ok, parseBody, route } from "@/lib/api/handler";
import { verifyToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE, sessionCookie } from "@/lib/auth/session";
import { loginUser, revokeToken } from "@/lib/services/auth";
import { loginSchema } from "@/lib/validation/auth";

export const POST = route(async ({ req }) => {
  const input = await parseBody(req, loginSchema);
  const { token, expiresIn, module, user } = await loginUser(input);

  // A browser holds one session. Signing in again ends the previous one, so the module
  // it was signed in to locks even if its cookie was copied elsewhere.
  const previous = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (previous) await revokeToken(previous.jti, previous.expiresAt);

  const response = ok({ token, tokenType: "Bearer", expiresIn, module, user });
  const secure = req.nextUrl.protocol === "https:";
  response.cookies.set(sessionCookie(token, expiresIn, secure));
  return response;
});
