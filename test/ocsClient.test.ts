import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { OcsClient, OcsError } from "../src/nextcloud/ocsClient.js";

const BASE_URL = "https://cloud.example.com";
const API_PREFIX = "/ocs/v2.php/apps/collectives/api/v1.0";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new OcsClient({
    baseUrl: BASE_URL,
    username: "alice",
    appPassword: "secret-app-password",
  });
}

describe("OcsClient", () => {
  test("sends Basic Auth and OCS headers, returns unwrapped data on success", async () => {
    let capturedAuth: string | null = null;
    let capturedOcsHeader: string | null = null;

    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        capturedOcsHeader = request.headers.get("ocs-apirequest");
        return HttpResponse.json({
          ocs: {
            meta: { status: "ok", statuscode: 200, message: "OK" },
            data: [{ id: 1, name: "Engineering" }],
          },
        });
      }),
    );

    const client = makeClient();
    const data = await client.get("/collectives");

    expect(data).toEqual([{ id: 1, name: "Engineering" }]);
    expect(capturedAuth).toBe(
      `Basic ${Buffer.from("alice:secret-app-password").toString("base64")}`,
    );
    expect(capturedOcsHeader).toBe("true");
  });

  test("throws OcsError with the envelope message on a non-2xx response", async () => {
    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives/999`, () => {
        return HttpResponse.json(
          {
            ocs: {
              meta: { status: "failure", statuscode: 404, message: "Collective not found" },
              data: [],
            },
          },
          { status: 404 },
        );
      }),
    );

    const client = makeClient();

    await expect(client.get("/collectives/999")).rejects.toThrow(OcsError);
    await expect(client.get("/collectives/999")).rejects.toThrow(/Collective not found/);
  });

  test("sends a JSON body on POST requests", async () => {
    let capturedBody: { name: string } | null = null;

    server.use(
      http.post(`${BASE_URL}${API_PREFIX}/collectives`, async ({ request }) => {
        capturedBody = (await request.json()) as { name: string };
        return HttpResponse.json({
          ocs: {
            meta: { status: "ok", statuscode: 200, message: "OK" },
            data: { id: 2, name: "Marketing" },
          },
        });
      }),
    );

    const client = makeClient();
    const data = await client.post("/collectives", { name: "Marketing" });

    expect(capturedBody).toEqual({ name: "Marketing" });
    expect(data).toEqual({ id: 2, name: "Marketing" });
  });
});
