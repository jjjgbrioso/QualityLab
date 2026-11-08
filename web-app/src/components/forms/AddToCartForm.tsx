"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { shopButton, shopButtonOutline } from "@/components/shop";
import { Alert } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

/** Add to cart stays on the page. Buy now adds the item, then opens checkout. */
export function AddToCartForm({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit } = useSubmit();
  const [added, setAdded] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdded(false);
    const buyNow = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "buy";
    const quantity = Number(new FormData(event.currentTarget).get("quantity"));
    await submit(
      () => apiRequest("/cart/items", { method: "POST", body: { productId, quantity } }),
      () => {
        if (buyNow) {
          router.push("/checkout");
        } else {
          setAdded(true);
        }
        router.refresh();
      },
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-3" data-testid="add-to-cart-form">
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
      <div className="flex flex-wrap gap-2">
        <button type="submit" name="intent" value="buy" disabled={!ready || pending} className={`${shopButton} min-w-36`} data-testid="buy-now-button">
          Buy now
        </button>
        <button type="submit" name="intent" value="add" disabled={!ready || pending} className={`${shopButtonOutline} min-w-36`} data-testid="add-to-cart-button">
          {pending ? "Adding..." : "Add to cart"}
        </button>
      </div>
    </form>
  );
}
