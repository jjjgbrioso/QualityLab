import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { DeactivateProductButton } from "@/components/forms/DeactivateProductButton";
import { InventoryForm } from "@/components/forms/InventoryForm";
import { ProductForm } from "@/components/forms/ProductForm";
import { PageHeader } from "@/components/ui";
import { requirePageAdmin } from "@/lib/auth/session";
import { loadForPage } from "@/lib/page-helpers";
import { adminGetProduct } from "@/lib/services/products";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageAdmin(`/admin/products/${id}`);
  const product = await loadForPage(() => adminGetProduct(id));

  return (
    <>
      <PageHeader title={product.name} description={product.sku} testId="admin-product-edit" />
      <AdminNav />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductForm key={product.updatedAt} product={product} />
        </div>
        <div className="space-y-4">
          <InventoryForm productId={product.id} stock={product.stock} />
          {product.isActive ? <DeactivateProductButton productId={product.id} /> : null}
        </div>
      </div>
    </>
  );
}
