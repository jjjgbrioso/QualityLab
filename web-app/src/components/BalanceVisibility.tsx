"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Hide or show balances, as banking apps do for privacy. Balances show by default, so tests can
 * read them without a click. The choice lasts for the page only.
 */
const Visible = createContext<{ visible: boolean; toggle: () => void }>({ visible: true, toggle: () => {} });

export function BalanceVisibility({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  return <Visible.Provider value={{ visible, toggle: () => setVisible((value) => !value) }}>{children}</Visible.Provider>;
}

export function BalanceToggle() {
  const { visible, toggle } = useContext(Visible);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!visible}
      className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-yellow-300"
      data-testid="balance-toggle"
    >
      {visible ? "Hide balances" : "Show balances"}
    </button>
  );
}

export function Amount({ value }: { value: string }) {
  const { visible } = useContext(Visible);
  return visible ? <>{value}</> : <span aria-label="Balance hidden">₱ ••••••</span>;
}
