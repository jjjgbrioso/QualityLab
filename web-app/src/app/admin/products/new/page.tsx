import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { ProductForm } from "@/components/forms/ProductForm";
import { PageHeader } from "@/components/ui";
import { requirePageAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requirePageAdmin("/admin/products/new");

  return (
    <>
      <PageHeader title="New product" testId="admin-product-new" />
      <AdminNav />
      <div className="max-w-2xl">
        <ProductForm />
      </div>
    </>
  );
}
