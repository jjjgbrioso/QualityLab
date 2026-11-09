import { NextRequest } from "next/server";
import { expect, it } from "vitest";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { verifyToken } from "@/lib/auth/jwt";
import { requireAuth, SESSION_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { loginUser } from "@/lib/services/auth";
import { describeWithDatabase, failure } from "../helpers";

const alice = { email: "alice@qualitylab.test", password: "Customer@123" };
const admin = { email: "admin@qualitylab.test", password: "Admin@12345" };

const request = (path: string, token: string) =>
  new NextRequest(`http://localhost${path}`, { headers: { authorization: `Bearer ${token}` } });

const browserLogin = (body: Record<string, string>, cookie?: string) =>
  login(
    new NextRequest("http://localhost/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {}) },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({}) },
  );

describeWithDatabase("one module per sign-in", () => {
  it("issues a token for the chosen module", async () => {
    const { token, module } = await loginUser({ ...alice, module: "banking" });
    expect(module).toBe("banking");
    await expect(verifyToken(token)).resolves.toMatchObject({ module: "banking" });
  });

  it("lets only admins sign in to the Admin module", async () => {
    expect(await failure(loginUser({ ...alice, module: "admin" }))).toMatchObject({ status: 403, code: "MODULE_NOT_ALLOWED" });
    await expect(loginUser({ ...admin, module: "admin" })).resolves.toMatchObject({ module: "admin" });
    await expect(loginUser({ ...admin, module: "ecommerce" })).resolves.toMatchObject({ module: "ecommerce" });
  });

  it("accepts a token only on its own module's endpoints", async () => {
    const { token } = await loginUser({ ...alice, module: "banking" });
    await expect(requireAuth(request("/api/v1/bank/accounts", token))).resolves.toMatchObject({ module: "banking" });
    await expect(requireAuth(request("/api/v1/auth/me", token))).resolves.toMatchObject({ id: "user_alice" });
    for (const path of ["/api/v1/cart", "/api/v1/orders", "/api/v1/bookings", "/api/v1/cruise-bookings", "/api/v1/admin/stats"]) {
      expect(await failure(requireAuth(request(path, token))), path).toMatchObject({ status: 403, code: "MODULE_NOT_ALLOWED" });
    }
  });

  it("keeps an admin's customer session out of the admin endpoints", async () => {
    const { token } = await loginUser({ ...admin, module: "ecommerce" });
    expect(await failure(requireAuth(request("/api/v1/admin/stats", token)))).toMatchObject({ code: "MODULE_NOT_ALLOWED" });
  });

  it("ends the browser's previous session when it signs in to another module", async () => {
    const first = await browserLogin({ ...alice, module: "ecommerce" });
    const firstToken = (await first.json()).data.token as string;
    const second = await browserLogin({ ...alice, module: "travel" }, firstToken);
    expect(second.status).toBe(200);
    expect((await second.json()).data.module).toBe("travel");

    const firstJti = (await verifyToken(firstToken))!.jti;
    await expect(prisma.revokedToken.count({ where: { jti: firstJti } })).resolves.toBe(1);
    expect(await failure(requireAuth(request("/api/v1/cart", firstToken)))).toMatchObject({ status: 401 });
  });

  it("rejects a login without a module", async () => {
    const response = await browserLogin(alice);
    expect(response.status).toBe(400);
    expect((await response.json()).error.details[0].field).toBe("module");
  });
});
