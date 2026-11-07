import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "QualityLab", template: "%s | QualityLab" },
  description: "A QA demonstration application with simulated e-commerce, banking, and travel modules.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-white" data-testid="demo-banner">
          Demo only. Payments and banking are simulated. Do not enter real personal or financial details.
        </div>
        <Navbar />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
            <span data-testid="footer-note">QualityLab is a QA demonstration project. All data is fictional.</span>
            <span className="flex gap-4">
              <Link href="/api-docs" className="hover:underline" data-testid="footer-link-api-docs">
                API Docs
              </Link>
              <Link href="/api/v1/health" prefetch={false} className="hover:underline" data-testid="footer-link-health">
                Health
              </Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
