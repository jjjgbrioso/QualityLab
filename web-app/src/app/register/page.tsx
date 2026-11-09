import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { Card, linkStyles } from "@/components/ui";
import { getSessionUser, safeNextPath } from "@/lib/auth/session";
import type { SearchParams } from "@/lib/page-helpers";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : undefined);
  if (await getSessionUser()) redirect("/");

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-xl font-semibold" data-testid="register-title">
          Create an account
        </h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Already registered?{" "}
          <Link href={nextPath === "/" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`} className={linkStyles} data-testid="register-login-link">
            Sign in
          </Link>
        </p>
        <RegisterForm next={nextPath} />
      </Card>
    </div>
  );
}
