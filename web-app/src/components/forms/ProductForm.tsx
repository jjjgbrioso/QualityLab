"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { Alert, buttonStyles, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";
import { dollarsToCents } from "@/lib/money";
import type { ProductDto } from "@/lib/services/products";

export function ProductForm({ product }: { product?: ProductDto }) {
  const router = useRouter();
  const { pending, error, fieldErrors, submit, setFieldErrors, reset } = useSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    reset();

    const priceCents = dollarsToCents(String(form.get("price") ?? ""));
    if (priceCents === null) {
      setFieldErrors({ priceCents: "Enter a price such as 19.99." });
      return;
    }

    const shared = {
      sku: form.get("sku"),
      name: form.get("name"),
      description: form.get("description"),
      category: form.get("category"),
      brand: form.get("brand"),
      priceCents,
      isActive: form.get("isActive") === "on",
    };

    await submit(
      () =>
        product
          ? apiRequest(`/admin/products/${product.id}`, { method: "PATCH", body: shared })
          : apiRequest("/admin/products", {
              method: "POST",
              body: { ...shared, stock: Number(form.get("stock")) },
            }),
      () => {
        router.push("/admin/products");
        router.refresh();
      },
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="product-form">
        {error ? <Alert tone="error" testId="product-form-error">{error}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" name="sku" defaultValue={product?.sku} autoComplete="off" testId="product-form-sku" error={fieldErrors.sku} />
          <Field label="Name" name="name" defaultValue={product?.name} autoComplete="off" testId="product-form-name" error={fieldErrors.name} />
          <Field label="Category" name="category" defaultValue={product?.category} autoComplete="off" testId="product-form-category" error={fieldErrors.category} />
          <Field label="Brand" name="brand" defaultValue={product?.brand} autoComplete="off" testId="product-form-brand" error={fieldErrors.brand} />
          <Field
            label="Price (USD)"
            name="price"
            inputMode="decimal"
            defaultValue={product ? (product.priceCents / 100).toFixed(2) : undefined}
            autoComplete="off"
            testId="product-form-price"
            error={fieldErrors.priceCents}
          />
          {product ? null : (
            <Field label="Opening stock" name="stock" type="number" min={0} defaultValue={0} testId="product-form-stock" error={fieldErrors.stock} />
          )}
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description}
            aria-invalid={fieldErrors.description ? true : undefined}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            data-testid="product-form-description-input"
          />
          {fieldErrors.description ? (
            <p className="mt-1 text-xs text-red-700" data-testid="product-form-description-error">{fieldErrors.description}</p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} data-testid="product-form-active-checkbox" />
          Active (visible in the shop)
        </label>
        <button type="submit" disabled={pending} className={buttonStyles.primary} data-testid="product-form-submit-button">
          {pending ? "Saving..." : product ? "Save changes" : "Create product"}
        </button>
      </form>
    </Card>
  );
}
