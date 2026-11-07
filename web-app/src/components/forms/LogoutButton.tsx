"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/client/api";

export function LogoutButton({ testId }: { testId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await apiRequest("/auth/logout", { method: "POST" });
    setPending(false);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink disabled:opacity-50"
      data-testid={testId}
    >
      Logout
    </button>
  );
}
