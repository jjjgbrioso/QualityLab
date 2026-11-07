import type { Metadata } from "next";
import { SwaggerClient } from "@/components/SwaggerClient";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "API Docs" };

export default function ApiDocsPage() {
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
