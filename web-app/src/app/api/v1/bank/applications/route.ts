import { ok, parseBody, route } from "@/lib/api/handler";
import { submitApplication } from "@/lib/services/bank-onboarding";
import { bankApplicationSchema } from "@/lib/validation/bank-onboarding";

/** Public: a new customer applies before they have a login. */
export const POST = route(async ({ req }) => {
  const input = await parseBody(req, bankApplicationSchema);
  return ok(await submitApplication(input), 201);
});
