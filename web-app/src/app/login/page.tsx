import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { Alert, Card, linkStyles } from "@/components/ui";
import { getSessionUser, safeNextPath } from "@/lib/auth/session";
import { MODULE_LABELS, moduleForPage } from "@/lib/modules";
import type { SearchParams } from "@/lib/page-helpers";

export const metadata: Metadata = { title: "Login" };

// Test account details live in documentation/test-data.md, not on the page.
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
    <div className="mx-auto max-w-md">
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
    </div>
  );
}
