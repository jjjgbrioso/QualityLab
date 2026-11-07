import { ok, parseBody, route } from "@/lib/api/handler";
import { registerUser } from "@/lib/services/auth";
import { registerSchema } from "@/lib/validation/auth";

export const POST = route(async ({ req }) => {
  const input = await parseBody(req, registerSchema);
  return ok(await registerUser(input), 201);
});
