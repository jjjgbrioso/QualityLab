"use client";

import { useRouter } from "next/navigation";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

export function DeactivateProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const { ready, pending, error, submit } = useSubmit();

  const deactivate = () =>
    submit(
      () => apiRequest(`/admin/products/${productId}`, { method: "DELETE" }),
      () => {
        router.push("/admin/products");
        router.refresh();
      },
    );

  return (
    <div className="space-y-2">
      {error ? <Alert tone="error" testId="product-deactivate-error">{error}</Alert> : null}
      <button type="button" disabled={!ready || pending} onClick={deactivate} className={buttonStyles.danger} data-testid="product-deactivate-button">
        {pending ? "Deactivating..." : "Deactivate product"}
      </button>
    </div>
  );
}
