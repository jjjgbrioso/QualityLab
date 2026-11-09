import type { Metadata } from "next";
import Link from "next/link";
import { BankWordmark } from "@/components/bank";
import { AccountApplication } from "@/components/forms/AccountApplication";

export const metadata: Metadata = { title: "Open an account" };

const YOU_NEED = [
  "To be 18 or older and living in the Philippines",
  "A Philippine mobile number and an email address",
  "A valid government ID (use made-up details in this demo)",
  "A few minutes to complete 9 short steps",
];

/** Public: new customers apply before they have a login. */
export default function OpenAccountPage() {
  return (
    <div className="space-y-8">
      <section
        className="relative -mx-4 -mt-8 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 px-4 py-10 text-white sm:-mx-6 sm:px-6"
        data-testid="application-hero"
      >
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-yellow-300/10" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <BankWordmark className="text-yellow-300" />
          <h1 className="mt-3 text-3xl font-extrabold" data-testid="application-title">
            Open an account online
          </h1>
          <p className="mt-2 max-w-xl text-sm text-emerald-100">
            No branch visit. Apply in minutes and start banking right away. Everything here is simulated: no real money, ID check, or message is involved.
          </p>
          <ul className="mt-4 grid gap-1 text-sm text-emerald-50 sm:grid-cols-2" data-testid="application-requirements">
            {YOU_NEED.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-yellow-300" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-emerald-100">
            Already have an account?{" "}
            <Link href="/login?next=%2Fbanking" className="font-semibold text-yellow-300 hover:underline" data-testid="application-signin-link">
              Sign in to Banking
            </Link>
          </p>
        </div>
      </section>
      <AccountApplication />
    </div>
  );
}
