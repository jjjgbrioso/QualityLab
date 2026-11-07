"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/forms/LogoutButton";
import { buttonStyles } from "@/components/ui";

type NavLink = { href: string; label: string; testId: string };

export function MobileNav({ links, signedIn }: { links: NavLink[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className={buttonStyles.secondary}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
        data-testid="mobile-menu-toggle"
      >
        Menu
      </button>
      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full z-20 border-b border-line bg-surface px-4 py-3 shadow-sm"
          data-testid="mobile-menu"
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-canvas"
                  data-testid={`mobile-${link.testId}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {signedIn ? (
              <li className="px-3 py-2">
                <LogoutButton testId="mobile-nav-logout" />
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
