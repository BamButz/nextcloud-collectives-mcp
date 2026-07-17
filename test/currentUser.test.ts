import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { fetchCurrentUserId } from "../src/nextcloud/currentUser.js";

const BASE_URL = "https://cloud.example.com";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchCurrentUserId", () => {
  test("returns the internal user id from the provisioning API", async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get(`${BASE_URL}/ocs/v1.php/cloud/user`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json({
          ocs: {
            meta: { status: "ok", statuscode: 100, message: "OK" },
            data: { id: "11111111-2222-3333-4444-555555555555", backend: "LDAP" },
          },
        });
      }),
    );

    const userId = await fetchCurrentUserId({
      baseUrl: BASE_URL,
      username: "alice",
      appPassword: "secret-app-password",
    });

    expect(userId).toBe("11111111-2222-3333-4444-555555555555");
    expect(capturedAuth).toBe(
      `Basic ${Buffer.from("alice:secret-app-password").toString("base64")}`,
    );
  });
});
