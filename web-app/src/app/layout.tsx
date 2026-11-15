import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { getSessionUser } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "QualityLab", template: "%s | QualityLab" },
  description: "A QA demonstration application with simulated e-commerce, banking, and travel modules.",
  robots: { index: false, follow: false },
};

// next/font downloads these at build time and serves them from this app, so visitors make no Google request.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The API docs and health links are for signed-in testers, so visitors start from the modules.
  const signedIn = Boolean(await getSessionUser());
  return (
    <html lang="en" className={`${plexSans.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <div role="note" className="border-b border-amber-200 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900" data-testid="demo-banner">
          Demo only. Payments and banking are simulated. Do not enter real personal or financial details.
        </div>
        <Navbar />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="max-w-3xl space-y-1">
              <p data-testid="footer-note">QualityLab is a QA demonstration project. All data is fictional.</p>
              <p data-testid="footer-disclaimer">
                QualityLab is an independent educational and QA automation demonstration project. It is not affiliated
                with, endorsed by, or associated with any company or brand.
              </p>
            </div>
            {signedIn ? (
              <span className="flex shrink-0 gap-4">
                <Link href="/api-docs" className="hover:underline" data-testid="footer-link-api-docs">
                  API Docs
                </Link>
                <Link href="/api/v1/health" prefetch={false} className="hover:underline" data-testid="footer-link-health">
                  Health
                </Link>
              </span>
            ) : null}
          </div>
        </footer>
      </body>
    </html>
  );
}
