import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createTagsTools } from "../../src/tools/tags.js";
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
  return createTagsTools(ocs);
}

describe("createTagsTools", () => {
  test("listTags fetches tags for a collective", async () => {
    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives/7/tags`, () =>
        ocsResponse({ tags: [{ id: 1, name: "urgent" }] }),
      ),
    );

    const result = await makeTools().listTags({ collectiveId: 7 });

    expect(result).toEqual([{ id: 1, name: "urgent" }]);
  });

  test("createTag posts name and optional color", async () => {
    let capturedBody: { name: string; color?: string } | null = null;

    server.use(
      http.post(`${BASE_URL}${API_PREFIX}/collectives/7/tags`, async ({ request }) => {
        capturedBody = (await request.json()) as { name: string; color?: string };
        return ocsResponse({ tag: { id: 2, name: "urgent", color: "ff0000" }, info: "" });
      }),
    );

    const result = await makeTools().createTag({ collectiveId: 7, name: "urgent", color: "ff0000" });

    expect(capturedBody).toEqual({ name: "urgent", color: "ff0000" });
    expect(result).toEqual({ id: 2, name: "urgent", color: "ff0000" });
  });

  test("createTag omits color when not given", async () => {
    let capturedBody: { name: string; color?: string } | null = null;

    server.use(
      http.post(`${BASE_URL}${API_PREFIX}/collectives/7/tags`, async ({ request }) => {
        capturedBody = (await request.json()) as { name: string; color?: string };
        return ocsResponse({ tag: { id: 2, name: "urgent" }, info: "" });
      }),
    );

    await makeTools().createTag({ collectiveId: 7, name: "urgent" });

    expect(capturedBody).toEqual({ name: "urgent" });
  });

  test("addTagToPage attaches a tag to a page", async () => {
    server.use(
      http.put(`${BASE_URL}${API_PREFIX}/collectives/7/pages/42/tags/2`, () =>
        ocsResponse({ page: { id: 42, title: "Onboarding", tags: [2] } }),
      ),
    );

    const result = await makeTools().addTagToPage({ collectiveId: 7, pageId: 42, tagId: 2 });

    expect(result).toEqual({ id: 42, title: "Onboarding", tags: [2] });
  });

  test("removeTagFromPage detaches a tag from a page", async () => {
    server.use(
      http.delete(`${BASE_URL}${API_PREFIX}/collectives/7/pages/42/tags/2`, () =>
        ocsResponse({ page: { id: 42, title: "Onboarding", tags: [] } }),
      ),
    );

    const result = await makeTools().removeTagFromPage({ collectiveId: 7, pageId: 42, tagId: 2 });

    expect(result).toEqual({ id: 42, title: "Onboarding", tags: [] });
  });
});
