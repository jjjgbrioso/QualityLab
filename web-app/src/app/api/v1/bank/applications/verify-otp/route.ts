import { ok, parseBody, route } from "@/lib/api/handler";
import { verifyOtp } from "@/lib/services/bank-onboarding";
import { otpVerifySchema } from "@/lib/validation/bank-onboarding";

/** Simulated: no message is sent, and the PIN is always 123456. */
export const POST = route(async ({ req }) => {
  const input = await parseBody(req, otpVerifySchema);
  return ok(verifyOtp(input.otp));
});
