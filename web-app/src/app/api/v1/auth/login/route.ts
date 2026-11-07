import { ok, parseBody, route } from "@/lib/api/handler";
import { sessionCookie } from "@/lib/auth/session";
import { loginUser } from "@/lib/services/auth";
import { loginSchema } from "@/lib/validation/auth";

export const POST = route(async ({ req }) => {
  const input = await parseBody(req, loginSchema);
  const { token, expiresIn, user } = await loginUser(input);

  const response = ok({ token, tokenType: "Bearer", expiresIn, user });
  const secure = req.nextUrl.protocol === "https:";
  response.cookies.set(sessionCookie(token, expiresIn, secure));
  return response;
});
