import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export const metadata: Metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <div className="py-16 text-center" data-testid="forbidden-page">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 text-sm text-muted">Your account does not have permission to view this page.</p>
      <Link href="/" className={`${buttonStyles.primary} mt-5`} data-testid="forbidden-home-link">
        Back to home
      </Link>
    </div>
  );
}
