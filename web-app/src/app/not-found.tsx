import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-16 text-center" data-testid="not-found-page">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">This page does not exist, or the item has been removed.</p>
      <Link href="/" className={`${buttonStyles.primary} mt-5`} data-testid="not-found-home-link">
        Back to home
      </Link>
    </div>
  );
}
