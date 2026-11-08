"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, buttonStyles, Card, inputStyles, linkStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";
import { formatCents } from "@/lib/money";
import type { CartDto } from "@/lib/services/cart";

export function CartLines({ items }: { items: CartDto["items"] }) {
  const router = useRouter();
  const { ready, pending, error, submit } = useSubmit();

  const changeQuantity = (productId: string, quantity: number) =>
    submit(
      () => apiRequest(`/cart/items/${productId}`, { method: "PATCH", body: { quantity } }),
      () => router.refresh(),
    );

  const remove = (productId: string) =>
    submit(
      () => apiRequest(`/cart/items/${productId}`, { method: "DELETE" }),
      () => router.refresh(),
    );

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error" testId="cart-error">{error}</Alert> : null}
      {items.map((item) => (
        <Card key={item.productId} className="flex flex-wrap items-center gap-4 p-4" testId={`cart-item-${item.productId}`}>
          <div className="min-w-48 flex-1">
            <Link href={`/shop/${item.productId}`} className={linkStyles} data-testid={`cart-item-name-${item.productId}`}>
              {item.name}
            </Link>
            <p className="text-xs text-muted">{formatCents(item.unitPriceCents)} each</p>
          </div>
          <div className="w-20">
            <label htmlFor={`quantity-${item.productId}`} className="sr-only">
              Quantity of {item.name}
            </label>
            <input
              key={item.quantity}
              id={`quantity-${item.productId}`}
              type="number"
              min={1}
              max={item.availableStock}
              defaultValue={item.quantity}
              disabled={!ready || pending}
              className={inputStyles}
              data-testid={`cart-item-quantity-${item.productId}`}
              onBlur={(event) => {
                const quantity = Number(event.currentTarget.value);
                if (quantity !== item.quantity) changeQuantity(item.productId, quantity);
              }}
            />
          </div>
          <p className="w-24 text-right text-sm font-medium" data-testid={`cart-item-total-${item.productId}`}>
            {formatCents(item.lineTotalCents)}
          </p>
          <button
            type="button"
            disabled={!ready || pending}
            onClick={() => remove(item.productId)}
            className={buttonStyles.secondary}
            aria-label={`Remove ${item.name}`}
            data-testid={`cart-item-remove-${item.productId}`}
          >
            Remove
          </button>
        </Card>
      ))}
    </div>
  );
}
