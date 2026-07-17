import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createPagesTools } from "../../src/tools/pages.js";
import { OcsClient } from "../../src/nextcloud/ocsClient.js";
import { WebdavClient } from "../../src/nextcloud/webdavClient.js";
import { resolvePageFilePath } from "../../src/nextcloud/pagePath.js";
import type { PageInfo } from "../../src/nextcloud/types.js";

const BASE_URL = "https://cloud.example.com";
const API_PREFIX = "/ocs/v2.php/apps/collectives/api/v1.0";
const DAV_PREFIX = "/remote.php/dav/files/alice";

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
  const config = {
    baseUrl: BASE_URL,
    username: "alice",
    appPassword: "secret-app-password",
  };
  return createPagesTools(new OcsClient(config), new WebdavClient(config));
}

// filePath is the parent-folder path *within* the collective (empty for top-level
// pages), never the full file path — collectivePath and fileName must be combined
// with it to get the real WebDAV location. Every endpoint also wraps its payload
// under a named key ('pages'/'page'), never returning it bare.
const samplePage: PageInfo = {
  id: 42,
  parentId: 0,
  title: "Onboarding",
  fileName: "Onboarding.md",
  filePath: "",
  collectivePath: ".Kollektive/Engineering",
};

const nestedPage: PageInfo = {
  id: 43,
  parentId: 42,
  title: "Deployment",
  fileName: "Readme.md",
  filePath: "Onboarding",
  collectivePath: ".Kollektive/Engineering",
};

describe("createPagesTools", () => {
  test("listPages fetches the page tree for a collective", async () => {
    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives/7/pages`, () =>
        ocsResponse({ pages: [samplePage] }),
      ),
    );

    const result = await makeTools().listPages({ collectiveId: 7 });

    expect(result).toEqual([samplePage]);
  });

  test("getPage resolves the WebDAV path from collectivePath + filePath + fileName", async () => {
    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives/7/pages/42`, () =>
        ocsResponse({ page: samplePage }),
      ),
      http.get(`${BASE_URL}${DAV_PREFIX}/${resolvePageFilePath(samplePage)}`, () =>
        HttpResponse.text("# Onboarding\n\nWelcome!"),
      ),
    );

    const result = await makeTools().getPage({ collectiveId: 7, pageId: 42 });

    expect(result).toEqual({ ...samplePage, content: "# Onboarding\n\nWelcome!" });
  });

  test("getPage resolves nested pages under their parent's subfolder", async () => {
    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives/7/pages/43`, () =>
        ocsResponse({ page: nestedPage }),
      ),
      http.get(`${BASE_URL}${DAV_PREFIX}/${resolvePageFilePath(nestedPage)}`, () =>
        HttpResponse.text("# Deployment"),
      ),
    );

    const result = await makeTools().getPage({ collectiveId: 7, pageId: 43 });

    expect(result).toEqual({ ...nestedPage, content: "# Deployment" });
  });

  test("createPage creates the page and writes content when provided", async () => {
    let putContent: string | null = null;

    server.use(
      http.post(`${BASE_URL}${API_PREFIX}/collectives/7/pages/0`, () =>
        ocsResponse({ page: samplePage }),
      ),
      http.put(`${BASE_URL}${DAV_PREFIX}/${resolvePageFilePath(samplePage)}`, async ({ request }) => {
        putContent = await request.text();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const result = await makeTools().createPage({
      collectiveId: 7,
      parentId: 0,
      title: "Onboarding",
      content: "# Onboarding",
    });

    expect(putContent).toBe("# Onboarding");
    expect(result).toEqual(samplePage);
  });

  test("createPage skips writing content when none is provided", async () => {
    let webdavCalled = false;

    server.use(
      http.post(`${BASE_URL}${API_PREFIX}/collectives/7/pages/0`, () =>
        ocsResponse({ page: samplePage }),
      ),
      http.put(`${BASE_URL}${DAV_PREFIX}/${resolvePageFilePath(samplePage)}`, () => {
        webdavCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await makeTools().createPage({ collectiveId: 7, parentId: 0, title: "Onboarding" });

    expect(webdavCalled).toBe(false);
  });

  test("updatePageContent resolves the file path via metadata then writes via WebDAV", async () => {
    let putContent: string | null = null;

    server.use(
      http.get(`${BASE_URL}${API_PREFIX}/collectives/7/pages/42`, () =>
        ocsResponse({ page: samplePage }),
      ),
      http.put(`${BASE_URL}${DAV_PREFIX}/${resolvePageFilePath(samplePage)}`, async ({ request }) => {
        putContent = await request.text();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await makeTools().updatePageContent({ collectiveId: 7, pageId: 42, content: "# Updated" });

    expect(putContent).toBe("# Updated");
  });

  test("renamePage sends the new title", async () => {
    let capturedBody: { title: string } | null = null;

    server.use(
      http.put(`${BASE_URL}${API_PREFIX}/collectives/7/pages/42`, async ({ request }) => {
        capturedBody = (await request.json()) as { title: string };
        return ocsResponse({ page: { ...samplePage, title: "Getting Started" } });
      }),
    );

    const result = await makeTools().renamePage({
      collectiveId: 7,
      pageId: 42,
      title: "Getting Started",
    });

    expect(capturedBody).toEqual({ title: "Getting Started" });
    expect(result.title).toBe("Getting Started");
  });

  test("movePage sends the new parent id and optional index", async () => {
    let capturedBody: { parentId: number; index?: number } | null = null;

    server.use(
      http.put(`${BASE_URL}${API_PREFIX}/collectives/7/pages/42`, async ({ request }) => {
        capturedBody = (await request.json()) as { parentId: number; index?: number };
        return ocsResponse({ page: { ...samplePage, parentId: 5 } });
      }),
    );

    await makeTools().movePage({ collectiveId: 7, pageId: 42, newParentId: 5, index: 2 });

    expect(capturedBody).toEqual({ parentId: 5, index: 2 });
  });

  test("deletePage moves the page to the trash", async () => {
    server.use(
      http.delete(`${BASE_URL}${API_PREFIX}/collectives/7/pages/42`, () =>
        ocsResponse({ page: { ...samplePage, trashTimestamp: 123 } }),
      ),
    );

    const result = await makeTools().deletePage({ collectiveId: 7, pageId: 42 });

    expect(result.trashTimestamp).toBe(123);
  });
});
