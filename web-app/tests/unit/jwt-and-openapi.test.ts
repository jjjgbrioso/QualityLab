import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "@/lib/auth/jwt";
import { openApiDocument } from "@/lib/openapi";

describe("JWT", () => {
  it("accepts a token it issued", async () => {
    const { token } = await signToken("user_1", "CUSTOMER");
    await expect(verifyToken(token)).resolves.toMatchObject({ userId: "user_1" });
  });

  it("rejects a tampered token", async () => {
    const { token } = await signToken("user_1", "CUSTOMER");
    const [header, payload, signature] = token.split(".");
    await expect(verifyToken(`${header}.${payload}x.${signature}`)).resolves.toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const forged = await new SignJWT({ role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_admin")
      .setJti("forged")
      .setIssuer("qualitylab")
      .setAudience("qualitylab-api")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-different-secret-of-at-least-32-characters"));
    await expect(verifyToken(forged)).resolves.toBeNull();
  });

  it("rejects garbage", async () => {
    await expect(verifyToken("not-a-token")).resolves.toBeNull();
  });
});

describe("OpenAPI document", () => {
  const document = openApiDocument();

  it("is version 3.1 and describes the core endpoints", () => {
    expect(document.openapi).toBe("3.1.0");
    for (const path of ["/api/v1/health", "/api/v1/auth/login", "/api/v1/products", "/api/v1/bank/transfers", "/api/v1/bookings"]) {
      expect(document.paths).toHaveProperty([path]);
    }
  });

  it("builds request bodies from the validation schemas", () => {
    const transfer = document.paths["/api/v1/bank/transfers"].post as {
      requestBody: { content: { "application/json": { schema: { properties: Record<string, unknown> } } } };
    };
    const properties = transfer.requestBody.content["application/json"].schema.properties;
    expect(Object.keys(properties)).toEqual(expect.arrayContaining(["fromAccountId", "toAccountNumber", "amountCents"]));
  });
});
