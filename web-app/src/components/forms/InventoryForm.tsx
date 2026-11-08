"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { Alert, buttonStyles, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

export function InventoryForm({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit } = useSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const note = String(form.get("note") ?? "").trim();
    await submit(
      () =>
        apiRequest(`/admin/products/${productId}/inventory`, {
          method: "POST",
          body: { delta: Number(form.get("delta")), ...(note ? { note } : {}) },
        }),
      () => {
        formElement.reset();
        router.refresh();
      },
    );
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold">Inventory</h2>
      <p className="mb-3 mt-1 text-sm text-muted">
        Current stock: <span data-testid="inventory-current-stock">{stock}</span>
      </p>
      <form method="post" onSubmit={onSubmit} noValidate className="space-y-4" data-testid="inventory-form">
        {error ? <Alert tone="error" testId="inventory-error">{error}</Alert> : null}
        <Field
          label="Quantity change"
          name="delta"
          type="number"
          hint="Use a negative number to remove stock."
          testId="inventory-delta"
          error={fieldErrors.delta}
        />
        <Field label="Note (optional)" name="note" autoComplete="off" testId="inventory-note" error={fieldErrors.note} />
        <button type="submit" disabled={!ready || pending} className={buttonStyles.secondary} data-testid="inventory-submit-button">
          {pending ? "Saving..." : "Adjust stock"}
        </button>
      </form>
    </Card>
  );
}
