import { ok, route } from "@/lib/api/handler";
import { BANK_PRODUCTS } from "@/lib/bank-products";

/** Public, so the account application can show the products before the applicant has a login. */
export const GET = route(async () => ok(Object.values(BANK_PRODUCTS)));
