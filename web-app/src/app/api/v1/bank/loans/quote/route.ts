import { z } from "zod";
import { ok, route } from "@/lib/api/handler";
import { quoteLoan } from "@/lib/loans";
import { loanDetailsSchema } from "@/lib/validation/loans";

const quoteQuery = z.object({
  amountCents: z.coerce.number({ error: "Loan amount is required." }),
  termMonths: z.coerce.number({ error: "Choose a term." }),
});

/** Public loan calculator: the instalment, interest, fee, and amount released for an amount and term. */
export const GET = route(async ({ req }) => {
  const raw = quoteQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { amountCents, termMonths } = loanDetailsSchema.pick({ amountCents: true, termMonths: true }).parse(raw);
  return ok(quoteLoan(amountCents, termMonths));
});
