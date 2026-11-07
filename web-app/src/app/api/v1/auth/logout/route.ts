import { ok, route } from "@/lib/api/handler";
import { requireAuth, SESSION_COOKIE } from "@/lib/auth/session";
import { revokeToken } from "@/lib/services/auth";

export const POST = route(async ({ req }) => {
  const user = await requireAuth(req);
  await revokeToken(user.jti, user.tokenExpiresAt);

  const response = ok({ loggedOut: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
});
