"use client";

import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

export function OrderStatusButton({ orderId, status }: { orderId: string; status: "SHIPPED" | "DELIVERED" }) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();

  const advance = () =>
    submit(
      () => apiRequest(`/admin/orders/${orderId}`, { method: "PATCH", body: { status } }),
      () => router.refresh(),
    );

  return (
    <div>
      <button type="button" disabled={pending} onClick={advance} className={buttonStyles.secondary} data-testid={`admin-order-advance-${orderId}`}>
        {pending ? "Saving..." : `Mark ${status.toLowerCase()}`}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-700" data-testid={`admin-order-error-${orderId}`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
