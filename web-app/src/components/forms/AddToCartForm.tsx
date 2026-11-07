"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

export function AddToCartForm({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const { pending, error, fieldErrors, submit } = useSubmit();
  const [added, setAdded] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdded(false);
    const quantity = Number(new FormData(event.currentTarget).get("quantity"));
    await submit(
      () => apiRequest("/cart/items", { method: "POST", body: { productId, quantity } }),
      () => {
        setAdded(true);
        router.refresh();
      },
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3" data-testid="add-to-cart-form">
      {error ? <Alert tone="error" testId="add-to-cart-error">{error}</Alert> : null}
      {added ? <Alert tone="success" testId="add-to-cart-success">Added to your cart.</Alert> : null}
      <div className="max-w-32">
        <Field
          label="Quantity"
          name="quantity"
          type="number"
          min={1}
          max={stock}
          defaultValue={1}
          testId="product-quantity"
          error={fieldErrors.quantity}
        />
      </div>
      <button type="submit" disabled={pending} className={buttonStyles.primary} data-testid="add-to-cart-button">
        {pending ? "Adding..." : "Add to cart"}
      </button>
    </form>
  );
}
