import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createCollectivesTools } from "../../src/tools/collectives.js";
import { OcsClient } from "../../src/nextcloud/ocsClient.js";

const BASE_URL = "https://cloud.example.com";
const API_PREFIX = "/ocs/v2.php/apps/collectives/api/v1.0";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function ocsResponse<T>(data: T) {
  return HttpResponse.json({
    ocs: { meta: { status: "ok", statuscode: 200, message: "OK" }, data },
  });
}

function makeTools() {
  const ocs = new OcsClient({
    baseUrl: BASE_URL,
    username: "alice",
    appPassword: "secret-app-password",
  });
  return createCollectivesTools(ocs);
}

describe("createCollectivesTools", () => {
  test("listCollectives fetches the collectives list", async () => {
    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives`, () =>
        ocsResponse({ collectives: [{ id: 1, name: "Engineering" }] }),
      ),
    );

    const result = await makeTools().listCollectives();

    expect(result).toEqual([{ id: 1, name: "Engineering" }]);
  });

  test("createCollective posts the given name", async () => {
    let capturedBody: { name: string } | null = null;

    server.use(
      http.post(`${BASE_URL}${API_PREFIX}/collectives`, async ({ request }) => {
        capturedBody = (await request.json()) as { name: string };
        return ocsResponse({ collective: { id: 2, name: "Marketing" }, info: "" });
      }),
    );

    const result = await makeTools().createCollective({ name: "Marketing" });

    expect(capturedBody).toEqual({ name: "Marketing" });
    expect(result).toEqual({ id: 2, name: "Marketing" });
  });

  test("deleteCollective sends the collective id to the trash endpoint", async () => {
    server.use(
      http.delete(`${BASE_URL}${API_PREFIX}/collectives/2`, () =>
        ocsResponse({ collective: { id: 2, name: "Marketing", trashTimestamp: 123 } }),
      ),
    );

    const result = await makeTools().deleteCollective({ collectiveId: 2 });

    expect(result).toEqual({ id: 2, name: "Marketing", trashTimestamp: 123 });
  });
});
