import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { Alert, Card, linkStyles } from "@/components/ui";
import { getSessionUser, safeNextPath } from "@/lib/auth/session";
import { MODULE_LABELS, moduleForPage } from "@/lib/modules";
import type { SearchParams } from "@/lib/page-helpers";

export const metadata: Metadata = { title: "Login" };

const TEST_ACCOUNTS = [
  { email: "admin@qualitylab.test", password: "Admin@12345", note: "ADMIN" },
  { email: "alice@qualitylab.test", password: "Customer@123", note: "Customer with data" },
  { email: "bob@qualitylab.test", password: "Customer@123", note: "Has a frozen account" },
  { email: "empty@qualitylab.test", password: "Customer@123", note: "Empty states" },
  { email: "disabled@qualitylab.test", password: "Customer@123", note: "Login is refused" },
];

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, registered } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : undefined);
  const pageModule = moduleForPage(nextPath);
  const session = await getSessionUser();
  // Already signed in to the module this page needs, or to any module for a page that needs none.
  if (session && (pageModule === null ? nextPath !== "/" : session.module === pageModule)) redirect(nextPath);
  const switching = session && pageModule && session.module !== pageModule ? session.module : null;
  const redirectedHere = nextPath !== "/";

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <Card className="p-6">
        <h1 className="text-xl font-semibold" data-testid="login-title">
          {pageModule ? `Sign in to ${MODULE_LABELS[pageModule]}` : "Sign in"}
        </h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          New here?{" "}
          <Link href={redirectedHere ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"} className={linkStyles} data-testid="login-register-link">
            Create an account
          </Link>
        </p>
        {switching && pageModule ? (
          <div className="mb-4">
            <Alert tone="warning" testId="login-switch-notice">
              You are signed in to {MODULE_LABELS[switching]}. Each sign-in opens one module, so signing in to {MODULE_LABELS[pageModule]} ends
              your {MODULE_LABELS[switching]} session.
            </Alert>
          </div>
        ) : registered === "1" ? (
          <div className="mb-4">
            <Alert tone="success" testId="login-registered-notice">
              Your account is ready. Choose a module and sign in.
            </Alert>
          </div>
        ) : redirectedHere ? (
          <div className="mb-4">
            <Alert tone="info" testId="login-required-notice">
              Please sign in to continue.
            </Alert>
          </div>
        ) : null}
        <LoginForm next={nextPath} module={pageModule} />
        {pageModule === "banking" ? (
          <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm" data-testid="login-open-account-prompt">
            New to QualityLab Bank?{" "}
            <Link href="/banking/open" className="font-semibold text-emerald-800 hover:underline" data-testid="login-open-account-link">
              Open an account online
            </Link>
          </p>
        ) : null}
      </Card>

      <Card className="p-6" testId="test-accounts-panel">
        <h2 className="font-semibold">Test accounts</h2>
        <p className="mb-3 mt-1 text-sm text-muted">Fictional accounts for automation. They reset with the seed data.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="py-1 pr-3 font-medium">Email</th>
                <th scope="col" className="py-1 pr-3 font-medium">Password</th>
                <th scope="col" className="py-1 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {TEST_ACCOUNTS.map((account) => (
                <tr key={account.email} className="border-t border-line" data-testid={`test-account-${account.email.split("@")[0]}`}>
                  <td className="py-1.5 pr-3">{account.email}</td>
                  <td className="py-1.5 pr-3 font-mono text-xs">{account.password}</td>
                  <td className="py-1.5 text-xs text-muted">{account.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
