import type { Metadata } from "next";
import { SwaggerClient } from "@/components/SwaggerClient";
import { Card, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "API Docs" };

/** Any module's session can open the docs. The raw document stays public for API tools. */
export default async function ApiDocsPage() {
  await requirePageUser("/api-docs");
  return (
    <>
      <PageHeader
        title="API documentation"
        description="Interactive OpenAPI reference for /api/v1. The raw document is at /api/v1/openapi.json."
        testId="api-docs"
      />
      <Card className="p-2 sm:p-4">
        <SwaggerClient />
      </Card>
    </>
  );
}
